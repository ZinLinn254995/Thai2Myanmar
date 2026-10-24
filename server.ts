import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { dbManager } from './server/storage.ts';
import { geminiService } from './server/geminiService.ts';
import { voiceService } from './server/voiceService.ts';
import { productionQueue } from './server/productionQueue.ts';
import { publishService } from './server/publishService.ts';
import { automationScheduler } from './server/scheduler.ts';
import { LessonScript } from './src/types/index.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// ---------------------------------------------------------------------
// API Routes
// ---------------------------------------------------------------------

// Health & System Info
app.get('/api/health', (req: Request, res: Response) => {
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    geminiConfigured: hasGeminiKey,
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    app: 'Thai2Myanmar AI Studio',
  });
});

// Lessons CRUD
app.get('/api/lessons', (req: Request, res: Response) => {
  const { status, difficulty, search } = req.query;
  let lessons = dbManager.getLessons();

  if (status && typeof status === 'string' && status !== 'all') {
    lessons = lessons.filter(l => l.status === status);
  }
  if (difficulty && typeof difficulty === 'string' && difficulty !== 'all') {
    lessons = lessons.filter(l => l.difficulty === difficulty);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    lessons = lessons.filter(l => 
      l.title.toLowerCase().includes(q) || 
      l.topic.toLowerCase().includes(q) ||
      l.tiktokCaption.toLowerCase().includes(q)
    );
  }

  res.json({ success: true, count: lessons.length, data: lessons });
});

app.get('/api/lessons/:id', (req: Request, res: Response) => {
  const lesson = dbManager.getLessonById(req.params.id);
  if (!lesson) {
    return res.status(404).json({ success: false, error: 'Lesson not found' });
  }
  res.json({ success: true, data: lesson });
});

app.post('/api/lessons/generate', async (req: Request, res: Response) => {
  try {
    const { topic, difficulty, targetDurationSec, category, customInstructions } = req.body;
    
    if (!topic) {
      return res.status(400).json({ success: false, error: 'Topic is required.' });
    }

    dbManager.addLog({
      category: 'ai_generation',
      action: 'Generating Lesson',
      details: `Gemini 3.8 Flash requested for topic: "${topic}" (${difficulty || 'Beginner'})`,
      level: 'info',
    });

    const result = await geminiService.generateLesson({
      topic,
      difficulty: difficulty || 'Beginner',
      targetDurationSec: targetDurationSec || 65,
      category: category || 'Daily Conversation',
      customInstructions,
    });

    // Record usage
    dbManager.recordUsage(result.tokensUsed, result.costUsd);

    const newLesson: LessonScript = {
      id: `lesson-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: result.lesson.title || topic,
      topic: topic,
      difficulty: difficulty || 'Beginner',
      targetDurationSec: targetDurationSec || 65,
      category: category || 'Daily Conversation',
      objectiveMm: result.lesson.objectiveMm || '',
      hook: result.lesson.hook || {
        hookThai: '',
        hookRoman: '',
        hookMm: '',
        retentionAngle: '',
      },
      vocabulary: result.lesson.vocabulary || [],
      dialogue: result.lesson.dialogue || [],
      exercise: result.lesson.exercise || {
        questionMm: '',
        options: [],
        correctAnswerIndex: 0,
        explanationMm: '',
      },
      summaryMm: result.lesson.summaryMm || '',
      tiktokCaption: result.lesson.tiktokCaption || '',
      hashtags: result.lesson.hashtags || ['#Thai2Myanmar', '#ထိုင်းစကားပြော'],
      scenes: result.lesson.scenes || [],
      status: 'Draft',
      voiceStyle: {
        thaiVoice: 'female-polite',
        myanmarVoice: 'female-clear',
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
      tokenCount: result.tokensUsed,
      estimatedCostUsd: result.costUsd,
    };

    dbManager.saveLesson(newLesson);

    dbManager.addLog({
      category: 'ai_generation',
      action: 'Lesson Generated',
      details: `Generated "${newLesson.title}" (${result.tokensUsed} tokens, ~$${result.costUsd.toFixed(4)})`,
      level: 'success',
    });

    res.json({ success: true, data: newLesson });
  } catch (err: any) {
    dbManager.addLog({
      category: 'ai_generation',
      action: 'Generation Failed',
      details: err.message || 'Unknown error during AI generation',
      level: 'error',
    });
    res.status(500).json({ success: false, error: err.message || 'Generation failed' });
  }
});

app.post('/api/lessons', (req: Request, res: Response) => {
  const lessonData = req.body;
  if (!lessonData.id) {
    lessonData.id = `lesson-${Date.now()}`;
  }
  const saved = dbManager.saveLesson(lessonData);
  res.json({ success: true, data: saved });
});

app.put('/api/lessons/:id', (req: Request, res: Response) => {
  const existing = dbManager.getLessonById(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, error: 'Lesson not found' });
  }
  const updated = dbManager.saveLesson({ ...existing, ...req.body, id: req.params.id });
  res.json({ success: true, data: updated });
});

app.delete('/api/lessons/:id', (req: Request, res: Response) => {
  const deleted = dbManager.deleteLesson(req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Lesson not found' });
  }
  res.json({ success: true, message: 'Lesson deleted successfully' });
});

app.post('/api/lessons/:id/duplicate', (req: Request, res: Response) => {
  const original = dbManager.getLessonById(req.params.id);
  if (!original) {
    return res.status(404).json({ success: false, error: 'Lesson not found' });
  }

  const duplicate: LessonScript = {
    ...JSON.parse(JSON.stringify(original)),
    id: `lesson-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title: `${original.title} (Copy)`,
    status: 'Draft',
    renderedVideoId: undefined,
    scheduledTime: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  dbManager.saveLesson(duplicate);
  dbManager.addLog({
    category: 'system',
    action: 'Lesson Duplicated',
    details: `Duplicated "${original.title}" into new draft ID ${duplicate.id}`,
    level: 'info',
  });

  res.json({ success: true, data: duplicate });
});

app.post('/api/lessons/:id/rewrite-section', async (req: Request, res: Response) => {
  const lesson = dbManager.getLessonById(req.params.id);
  if (!lesson) {
    return res.status(404).json({ success: false, error: 'Lesson not found' });
  }

  const { section, instruction } = req.body;
  if (!section || !instruction) {
    return res.status(400).json({ success: false, error: 'Section and instruction are required.' });
  }

  try {
    const result = await geminiService.rewriteSection(lesson, section, instruction);
    (lesson as any)[section] = result.updatedData;
    dbManager.recordUsage(result.tokensUsed, result.costUsd);
    dbManager.saveLesson(lesson);

    dbManager.addLog({
      category: 'ai_generation',
      action: 'Section Rewritten',
      details: `Rewrote section "${section}" in "${lesson.title}"`,
      level: 'success',
    });

    res.json({ success: true, data: lesson, updatedSection: result.updatedData });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Section rewrite failed' });
  }
});

// Voice Generation API
app.post('/api/voice/generate', async (req: Request, res: Response) => {
  try {
    const { text, language, voiceStyle, speed } = req.body;
    const result = await voiceService.generateSpeech({
      text,
      language: language || 'th-TH',
      voiceStyle,
      speed,
    });
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Voice generation failed' });
  }
});

// Production & Video Rendering
app.post('/api/production/render', (req: Request, res: Response) => {
  const { lessonId, renderSettings } = req.body;
  const lesson = dbManager.getLessonById(lessonId);
  if (!lesson) {
    return res.status(404).json({ success: false, error: 'Lesson not found' });
  }

  const job = productionQueue.startRenderJob(lesson, renderSettings);
  res.json({ success: true, data: job });
});

app.get('/api/production/jobs', (req: Request, res: Response) => {
  const jobs = dbManager.getJobs();
  res.json({ success: true, data: jobs });
});

app.get('/api/production/jobs/:id', (req: Request, res: Response) => {
  const job = dbManager.getJobById(req.params.id);
  if (!job) {
    return res.status(404).json({ success: false, error: 'Job not found' });
  }
  res.json({ success: true, data: job });
});

app.post('/api/production/jobs/:id/retry', (req: Request, res: Response) => {
  const job = productionQueue.retryJob(req.params.id);
  if (!job) {
    return res.status(404).json({ success: false, error: 'Job not found' });
  }
  res.json({ success: true, data: job });
});

app.post('/api/production/jobs/:id/cancel', (req: Request, res: Response) => {
  const cancelled = productionQueue.cancelJob(req.params.id);
  if (!cancelled) {
    return res.status(404).json({ success: false, error: 'Job not found or already completed' });
  }
  res.json({ success: true, message: 'Job cancelled' });
});

// Simulated/Rendered Video File Endpoint (produces video manifest / response)
app.get('/api/production/video/:jobId', (req: Request, res: Response) => {
  const job = dbManager.getJobById(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Video asset not found' });
  }

  const lesson = dbManager.getLessonById(job.lessonId);
  res.json({
    jobId: job.id,
    lessonId: job.lessonId,
    title: job.lessonTitle,
    durationSec: job.durationSec,
    resolution: job.renderSettings.resolution,
    aspectRatio: '9:16',
    format: 'video/mp4',
    scenes: lesson?.scenes || [],
    audioTracks: {
      thaiVoice: lesson?.voiceStyle.thaiVoice,
      myanmarVoice: lesson?.voiceStyle.myanmarVoice,
    },
    message: 'Video asset descriptor ready for playback and export.',
  });
});

// Publishing & TikTok Connector
app.get('/api/publish/accounts', (req: Request, res: Response) => {
  const accounts = dbManager.getPublishingAccounts();
  res.json({ success: true, data: accounts });
});

app.put('/api/publish/accounts/:id', (req: Request, res: Response) => {
  const updated = dbManager.updatePublishingAccount(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Account not found' });
  }
  res.json({ success: true, data: updated });
});

app.get('/api/publish/scheduled', (req: Request, res: Response) => {
  const scheduled = dbManager.getScheduledPosts();
  res.json({ success: true, data: scheduled });
});

app.post('/api/publish/schedule', (req: Request, res: Response) => {
  try {
    const post = publishService.schedulePost(req.body);
    res.json({ success: true, data: post });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/publish/checklist', (req: Request, res: Response) => {
  const { postId, item, value } = req.body;
  try {
    const updated = publishService.updateChecklist(postId, item, value);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Scheduler & Automation
app.post('/api/scheduler/run-now', async (req: Request, res: Response) => {
  const result = await automationScheduler.runDailyAutomationJob();
  res.json(result);
});

// AI Providers
app.get('/api/providers', (req: Request, res: Response) => {
  const providers = dbManager.getAIProviders();
  res.json({ success: true, data: providers });
});

app.put('/api/providers/:id', (req: Request, res: Response) => {
  const updated = dbManager.updateAIProvider(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Provider not found' });
  }
  res.json({ success: true, data: updated });
});

// Metrics & Analytics
app.get('/api/metrics', (req: Request, res: Response) => {
  const db = dbManager.getDatabase();
  const today = new Date().toISOString().split('T')[0];
  const todayLessons = db.lessons.filter(l => l.createdAt && l.createdAt.startsWith(today));
  const completedJobs = db.productionJobs.filter(j => j.status === 'completed');
  const publishedPosts = db.scheduledPosts.filter(p => p.status === 'published');

  res.json({
    success: true,
    data: {
      todayAiCalls: todayLessons.length + 2,
      todayTokensUsed: db.metrics.totalTokensUsed,
      todayEstimatedCostUsd: db.metrics.totalCostUsd,
      monthEstimatedCostUsd: db.metrics.totalCostUsd,
      dailyBudgetLimitUsd: db.settings.dailyBudgetLimitUsd,
      monthlyBudgetLimitUsd: db.settings.monthlyBudgetLimitUsd,
      totalLessons: db.lessons.length,
      totalVideosRendered: completedJobs.length,
      totalPublished: publishedPosts.length,
      inRenderingQueue: db.productionJobs.filter(j => j.status === 'rendering' || j.status === 'queued').length,
      scheduledUpcoming: db.scheduledPosts.filter(p => p.status === 'scheduled').length,
    },
  });
});

// Settings & Activity Logs
app.get('/api/settings', (req: Request, res: Response) => {
  res.json({ success: true, data: dbManager.getSettings() });
});

app.put('/api/settings', (req: Request, res: Response) => {
  const updated = dbManager.updateSettings(req.body);
  res.json({ success: true, data: updated });
});

app.get('/api/logs', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 100;
  res.json({ success: true, data: dbManager.getLogs(limit) });
});

// ---------------------------------------------------------------------
// Vite Middlewares (Dev) or Static Serve (Prod)
// ---------------------------------------------------------------------

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Vite Dev Server
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static files
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Thai2Myanmar AI Studio server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
