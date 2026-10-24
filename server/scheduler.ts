import { sqliteDb } from './db.ts';
import { geminiService } from './geminiService.ts';
import { productionQueue } from './productionQueue.ts';
import { qualityGate } from './qualityGate.ts';
import { LessonScript } from '../src/types/index.ts';

export class AutomationScheduler {
  private isRunning = false;

  /**
   * Run automated daily workflow:
   * 1. Checks budget & video count limits
   * 2. Picks next progressive topic (avoiding duplicates)
   * 3. Generates lesson via Gemini 3.8 Flash
   * 4. Enqueues 9:16 rendering job
   * 5. Runs Quality Gate audit
   */
  async runDailyAutomationJob(): Promise<{ success: boolean; message: string; lesson?: LessonScript }> {
    if (this.isRunning) {
      return { success: false, message: 'Automation job is already running.' };
    }

    this.isRunning = true;
    const settings = sqliteDb.getSettings();
    const metrics = sqliteDb.getMetrics();

    try {
      // 1. Check budget limits
      if (metrics.total_cost_usd >= settings.dailyBudgetLimitUsd) {
        sqliteDb.addLog({
          category: 'scheduler',
          action: 'Automation Halted',
          details: `Daily budget limit reached ($${metrics.total_cost_usd.toFixed(4)} >= $${settings.dailyBudgetLimitUsd.toFixed(2)}). Skipping auto generation.`,
          level: 'warn',
        });
        return { success: false, message: 'Daily budget limit reached.' };
      }

      // 2. Check today's video count
      const lessons = sqliteDb.getLessons();
      const today = new Date().toISOString().split('T')[0];
      const todayCreated = lessons.filter(l => l.createdAt && l.createdAt.startsWith(today)).length;

      if (todayCreated >= settings.dailyVideoLimit) {
        sqliteDb.addLog({
          category: 'scheduler',
          action: 'Limit Reached',
          details: `Daily video limit reached (${todayCreated}/${settings.dailyVideoLimit}).`,
          level: 'info',
        });
        return { success: false, message: `Daily video limit of ${settings.dailyVideoLimit} reached.` };
      }

      // 3. Progressive Topics Pool (with duplicate avoidance)
      const topicPool = [
        { topic: 'ထိုင်းမှာ မရှိမဖြစ် နှုတ်ဆက်စကား ၅ ခွန်းနှင့် အသံနေအထား', category: 'Daily Greetings', diff: 'Beginner' as const },
        { topic: 'ထိုင်းအစားအသောက် မှာယူရာတွင် သုံးသော စကားစုများ', category: 'Food & Dining', diff: 'Beginner' as const },
        { topic: 'ထိုင်းဈေးဝယ်ရာတွင် ဈေးဆစ်တတ်စေမည့် စကားပြောများ', category: 'Shopping & Finance', diff: 'Intermediate' as const },
        { topic: 'ထိုင်းဆေးဆိုင်နှင့် ဆေးခန်းတွင် ရောဂါလက္ခဏာပြောဆိုနည်း', category: 'Health & Pharmacy', diff: 'Intermediate' as const },
        { topic: 'အလုပ်ခွင်နှင့် စက်ရုံသုံး အရေးပေါ် ထိုင်းစကားစုများ', category: 'Workplace & Safety', diff: 'Beginner' as const },
        { topic: 'ထိုင်းမှာ အငှားယာဉ်/တက္ကစီ စီးရာတွင် လမ်းညွှန်နည်း', category: 'Transportation', diff: 'Beginner' as const },
        { topic: 'ထိုင်းဘဏ်တွင် ငွေလွှဲခြင်းနှင့် ATM အသုံးပြုနည်း', category: 'Banking & Money', diff: 'Intermediate' as const },
        { topic: 'ထိုင်းလူမျိုးနှင့် ရင်းနှီးစွာ စကားစမြည်ပြောနည်း', category: 'Social & Culture', diff: 'Advanced' as const },
      ];

      // Filter out already created topics
      const existingTopics = new Set(lessons.map(l => l.topic.toLowerCase().trim()));
      const availableTopic = topicPool.find(p => !existingTopics.has(p.topic.toLowerCase().trim())) || topicPool[0];

      sqliteDb.addLog({
        category: 'scheduler',
        action: 'Automation Triggered',
        details: `Starting auto-production for topic: "${availableTopic.topic}" (${availableTopic.diff})`,
        level: 'info',
      });

      // 4. Call Gemini
      const genResult = await geminiService.generateLesson({
        topic: availableTopic.topic,
        difficulty: availableTopic.diff,
        category: availableTopic.category,
        targetDurationSec: 65,
      });

      // Record metrics
      sqliteDb.recordUsage(genResult.tokensUsed, genResult.costUsd);

      // Create new lesson
      const newLessonId = `lesson-auto-${Date.now()}`;
      const newLesson: LessonScript = {
        id: newLessonId,
        title: genResult.lesson.title || availableTopic.topic,
        topic: availableTopic.topic,
        difficulty: availableTopic.diff,
        targetDurationSec: 65,
        category: availableTopic.category,
        objectiveMm: genResult.lesson.objectiveMm || '',
        hook: genResult.lesson.hook || {
          hookThai: 'สวัสดีครับ',
          hookRoman: 'Sawatdee khrap',
          hookMm: 'ထိုင်းစကားပြော လေ့လာကြမယ်!',
          retentionAngle: 'Immediate value delivery',
        },
        vocabulary: genResult.lesson.vocabulary || [],
        dialogue: genResult.lesson.dialogue || [],
        exercise: genResult.lesson.exercise || {
          questionMm: 'အဓိကစကားလုံးကို မှတ်မိပါသလား?',
          options: ['Option A', 'Option B'],
          correctAnswerIndex: 0,
          explanationMm: 'သင်ခန်းစာကို ပြန်လည်လေ့ကျင့်ပါ',
        },
        summaryMm: genResult.lesson.summaryMm || '',
        tiktokCaption: genResult.lesson.tiktokCaption || '',
        hashtags: genResult.lesson.hashtags || ['#Thai2Myanmar', '#ထိုင်းစကားပြော'],
        scenes: genResult.lesson.scenes || [],
        status: settings.requireManualApproval ? 'Draft' : 'Approved',
        voiceStyle: {
          thaiVoice: settings.defaultThaiVoice,
          myanmarVoice: settings.defaultMyanmarVoice,
          speed: 1.0,
        },
        subtitleStyle: {
          theme: 'neon-tiktok',
          fontSize: 32,
          showRomanization: true,
          showMyanmarPhonetics: true,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        aiModelUsed: 'gemini-3.8-flash',
        tokenCount: genResult.tokensUsed,
        estimatedCostUsd: genResult.costUsd,
      };

      sqliteDb.saveLesson(newLesson);

      // Run Quality Gate Audit
      await qualityGate.auditLesson(newLesson);

      // If auto-render enabled and approved, start rendering
      if (!settings.requireManualApproval) {
        productionQueue.startRenderJob(newLesson);
      }

      sqliteDb.addLog({
        category: 'scheduler',
        action: 'Automation Completed',
        details: `Successfully generated "${newLesson.title}". Status: ${newLesson.status}.`,
        level: 'success',
      });

      return {
        success: true,
        message: `Generated "${newLesson.title}" successfully.`,
        lesson: newLesson,
      };
    } catch (err: any) {
      sqliteDb.addLog({
        category: 'scheduler',
        action: 'Automation Error',
        details: `Auto-job failed: ${err.message || String(err)}`,
        level: 'error',
      });
      return { success: false, message: err.message || 'Auto-job failed' };
    } finally {
      this.isRunning = false;
    }
  }
}

export const automationScheduler = new AutomationScheduler();
