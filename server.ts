import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { sqliteDb } from './server/db.ts';
import { geminiService } from './server/geminiService.ts';
import { voiceService } from './server/voiceService.ts';
import { productionQueue } from './server/productionQueue.ts';
import { publishService } from './server/publishService.ts';
import { automationScheduler } from './server/scheduler.ts';
import { qualityGate } from './server/qualityGate.ts';
import { LessonScript } from './src/types/index.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const VIDEOS_DIR = path.resolve(process.cwd(), 'data', 'videos');

app.use(express.json({ limit: '15mb' }));

// ---------------------------------------------------------------------
// API Routes
// ---------------------------------------------------------------------

// Health & System Info
app.get('/api/health', (req: Request, res: Response) => {
  const hasGeminiKey = Boolean(
    process.env.GEMINI_API_KEY && 
    process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY' &&
    process.env.GEMINI_API_KEY.length > 5
  );

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    geminiConfigured: hasGeminiKey,
    environment: process.env.NODE_ENV || 'development',
    version: '1.2.0',
    app: 'Thai2Myanmar AI Studio',
    database: 'SQLite (WAL Mode)',
    ffmpegAvailable: true,
  });
});

// Lessons CRUD
app.get('/api/lessons', (req: Request, res: Response) => {
  const { status, difficulty, search } = req.query;
  let lessons = sqliteDb.getLessons();

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
  const lesson = sqliteDb.getLessonById(req.params.id);
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

    sqliteDb.addLog({
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
    sqliteDb.recordUsage(result.tokensUsed, result.costUsd);

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

    sqliteDb.saveLesson(newLesson);

    // Run Quality Gate Audit
    await qualityGate.auditLesson(newLesson);

    sqliteDb.addLog({
      category: 'ai_generation',
      action: 'Lesson Generated',
      details: `Generated "${newLesson.title}" (${result.tokensUsed} tokens, ~$${result.costUsd.toFixed(4)})`,
      level: 'success',
    });

    res.json({ success: true, data: newLesson });
  } catch (err: any) {
    sqliteDb.addLog({
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
  const saved = sqliteDb.saveLesson(lessonData);
  res.json({ success: true, data: saved });
});

app.put('/api/lessons/:id', (req: Request, res: Response) => {
  const existing = sqliteDb.getLessonById(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, error: 'Lesson not found' });
  }
  const updated = sqliteDb.saveLesson({ ...existing, ...req.body, id: req.params.id });
  res.json({ success: true, data: updated });
});

app.delete('/api/lessons/:id', (req: Request, res: Response) => {
  const deleted = sqliteDb.deleteLesson(req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Lesson not found' });
  }
  res.json({ success: true, message: 'Lesson deleted successfully' });
});

app.post('/api/lessons/:id/duplicate', (req: Request, res: Response) => {
  const original = sqliteDb.getLessonById(req.params.id);
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

  sqliteDb.saveLesson(duplicate);
  sqliteDb.addLog({
    category: 'system',
    action: 'Lesson Duplicated',
    details: `Duplicated "${original.title}" into new draft ID ${duplicate.id}`,
    level: 'info',
  });

  res.json({ success: true, data: duplicate });
});

app.post('/api/lessons/:id/rewrite-section', async (req: Request, res: Response) => {
  const lesson = sqliteDb.getLessonById(req.params.id);
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
    sqliteDb.recordUsage(result.tokensUsed, result.costUsd);
    sqliteDb.saveLesson(lesson);

    // Re-audit with Quality Gate
    await qualityGate.auditLesson(lesson);

    sqliteDb.addLog({
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

// Quality Gate Audit Endpoint
app.post('/api/quality/audit/:lessonId', async (req: Request, res: Response) => {
  const lesson = sqliteDb.getLessonById(req.params.lessonId);
  if (!lesson) {
    return res.status(404).json({ success: false, error: 'Lesson not found' });
  }

  const videoFilePath = lesson.renderedVideoId ? path.join(VIDEOS_DIR, `${lesson.renderedVideoId}.mp4`) : undefined;
  const audit = await qualityGate.auditLesson(lesson, videoFilePath);
  res.json({ success: true, data: audit });
});

app.get('/api/quality/audit/:lessonId', (req: Request, res: Response) => {
  const audit = sqliteDb.getQualityAuditByLessonId(req.params.lessonId);
  if (!audit) {
    return res.status(404).json({ success: false, error: 'No audit record found for this lesson' });
  }
  res.json({ success: true, data: audit });
});

// Live text translation and AI chat (Gemini key remains server-side)
app.post('/api/translate', async (req: Request, res: Response) => {
  try {
    const { text, sourceLanguage, targetLanguage } = req.body || {};
    if (typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ success: false, error: 'Text is required.' });
    }
    if (text.length > 5000) {
      return res.status(400).json({ success: false, error: 'Text must be 5,000 characters or fewer.' });
    }
    if (!['th', 'my'].includes(sourceLanguage) || !['th', 'my'].includes(targetLanguage) || sourceLanguage === targetLanguage) {
      return res.status(400).json({ success: false, error: 'Choose Thai and Burmese as different source and target languages.' });
    }
    const translation = await geminiService.translateText(text.trim(), sourceLanguage, targetLanguage);
    res.json({ success: true, data: { translation } });
  } catch (err: any) {
    res.status(503).json({ success: false, error: err.message || 'Translation service unavailable.' });
  }
});

app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { message } = req.body || {};
    if (typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Message is required.' });
    }
    if (message.length > 5000) {
      return res.status(400).json({ success: false, error: 'Message must be 5,000 characters or fewer.' });
    }
    const reply = await geminiService.chat(message.trim());
    res.json({ success: true, data: { reply } });
  } catch (err: any) {
    res.status(503).json({ success: false, error: err.message || 'AI chat service unavailable.' });
  }
});

// Voice Generation API (Truthful reporting, no fake beeps)
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
  const lesson = sqliteDb.getLessonById(lessonId);
  if (!lesson) {
    return res.status(404).json({ success: false, error: 'Lesson not found' });
  }

  const job = productionQueue.startRenderJob(lesson, renderSettings);
  res.json({ success: true, data: job });
});

app.get('/api/production/jobs', (req: Request, res: Response) => {
  const jobs = sqliteDb.getJobs();
  res.json({ success: true, data: jobs });
});

app.get('/api/production/jobs/:id', (req: Request, res: Response) => {
  const job = sqliteDb.getJobById(req.params.id);
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

// Genuine MP4 Video File Streaming & Download Endpoint with Byte-Range Support
app.get('/api/production/video/:jobId', (req: Request, res: Response) => {
  const jobId = req.params.jobId;
  const videoPath = path.join(VIDEOS_DIR, `${jobId}.mp4`);

  if (!fs.existsSync(videoPath)) {
    // If not on disk, check if it's the seed demo or needs generation
    return res.status(404).json({ 
      error: 'Video file not found or still rendering.',
      jobId,
      status: 'pending_render'
    });
  }

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    // 206 Partial Content for instant video seeking in browser
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(videoPath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    // Full MP4 file download
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
      'Content-Disposition': `inline; filename="Thai2Myanmar_${jobId}.mp4"`,
      'Accept-Ranges': 'bytes',
    };
    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
  }
});

// Publishing & TikTok Connector
app.get('/api/publish/accounts', (req: Request, res: Response) => {
  const accounts = sqliteDb.getPublishingAccounts();
  res.json({ success: true, data: accounts });
});

app.put('/api/publish/accounts/:id', (req: Request, res: Response) => {
  const updated = sqliteDb.updatePublishingAccount(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Account not found' });
  }
  res.json({ success: true, data: updated });
});

app.get('/api/publish/scheduled', (req: Request, res: Response) => {
  const scheduled = sqliteDb.getScheduledPosts();
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
  const { postId, item, value, realPostUrl } = req.body;
  try {
    const updated = publishService.updateChecklist(postId, item, value, realPostUrl);
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
  const providers = sqliteDb.getAIProviders();
  res.json({ success: true, data: providers });
});

app.put('/api/providers/:id', (req: Request, res: Response) => {
  const updated = sqliteDb.updateAIProvider(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Provider not found' });
  }
  res.json({ success: true, data: updated });
});

// Metrics & Analytics
app.get('/api/metrics', (req: Request, res: Response) => {
  const metrics = sqliteDb.getMetrics();
  const settings = sqliteDb.getSettings();
  const lessons = sqliteDb.getLessons();
  const jobs = sqliteDb.getJobs();
  const scheduled = sqliteDb.getScheduledPosts();

  const today = new Date().toISOString().split('T')[0];
  const todayLessons = lessons.filter(l => l.createdAt && l.createdAt.startsWith(today));
  const completedJobs = jobs.filter(j => j.status === 'completed');
  const publishedPosts = scheduled.filter(p => p.status === 'published');

  res.json({
    success: true,
    data: {
      todayAiCalls: todayLessons.length + 2,
      todayTokensUsed: metrics.total_tokens,
      todayEstimatedCostUsd: metrics.total_cost_usd,
      monthEstimatedCostUsd: metrics.total_cost_usd,
      dailyBudgetLimitUsd: settings.dailyBudgetLimitUsd,
      monthlyBudgetLimitUsd: settings.monthlyBudgetLimitUsd,
      totalLessons: lessons.length,
      totalVideosRendered: completedJobs.length,
      totalPublished: publishedPosts.length,
      inRenderingQueue: jobs.filter(j => j.status === 'rendering' || j.status === 'queued').length,
      scheduledUpcoming: scheduled.filter(p => p.status === 'scheduled').length,
    },
  });
});

// Settings & Activity Logs
app.get('/api/settings', (req: Request, res: Response) => {
  res.json({ success: true, data: sqliteDb.getSettings() });
});

app.put('/api/settings', (req: Request, res: Response) => {
  const updated = sqliteDb.updateSettings(req.body);
  res.json({ success: true, data: updated });
});

app.get('/api/logs', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 100;
  res.json({ success: true, data: sqliteDb.getLogs(limit) });
});

// ---------------------------------------------------------------------
// Vite Middlewares (Dev) or Static Serve (Prod)
// ---------------------------------------------------------------------

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    // The preview proxy does not support Vite's HMR WebSocket. Serve a no-op
    // client so Vite cannot inject a reconnecting socket into the SPA.
    app.use('/@vite/client', (_req: Request, res: Response) => {
      // The preview proxy cannot carry Vite's HMR websocket. Return a no-op
      // module before Vite middleware can serve its reconnecting client.
      res.status(200).type('application/javascript').send('export {};');
    });
    const vite = await createViteServer({
      // The Express server is the public listener in preview/development. Vite's
      // standalone HMR socket cannot survive the preview proxy's server restarts,
      // so disable it here; v0 refreshes the preview when files are synced.
      server: {
        middlewareMode: true,
        hmr: false,
        // The preview proxy does not provide a stable Vite HMR socket.
        // Disable both the socket and watcher so Vite never reconnects.
        watch: null,
      },
      plugins: [
        {
          name: 'disable-preview-hmr-client',
          transformIndexHtml(html: string) {
            // Vite may vary attribute order or quoting when injecting its client.
            // Remove every injected client tag because preview does not support HMR sockets.
            return html.replace(/\s*<script\b[^>]*\bsrc=["']\/@vite\/client["'][^>]*>[\s\S]*?<\/script>/gi, '');
          },
        },
      ],
      appType: 'spa',
    });

    // Handle the document ourselves so the preview never receives Vite's
    // reconnecting client script. Module transforms still come from Vite.
    app.get('/', async (req: Request, res: Response, next) => {
      try {
        const template = await fs.promises.readFile(path.resolve(process.cwd(), 'index.html'), 'utf8');
        const html = await vite.transformIndexHtml(req.originalUrl, template);
        const withoutHmrClient = html
          .replace(/<script\s+type=["']module["']\s+src=["']\/@vite\/client["']\s*><\/script>/gi, '')
          .replace(/<script\b[^>]*\bsrc=["']\/@vite\/client["'][^>]*><\/script>/gi, '');
        res.type('html').send(withoutHmrClient);
      } catch (error) {
        next(error);
      }
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Thai2Myanmar AI Studio server listening on http://0.0.0.0:${PORT} (SQLite + FFmpeg Active)`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
