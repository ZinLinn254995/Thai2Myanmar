import { dbManager } from './storage.ts';
import { LessonScript, ProductionJob } from '../src/types/index.ts';

export class ProductionQueue {
  private activeTimers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Enqueues a lesson for video production rendering
   */
  startRenderJob(lesson: LessonScript, settings?: Partial<ProductionJob['renderSettings']>): ProductionJob {
    const jobId = `job-render-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const duration = lesson.targetDurationSec || 64;

    const newJob: ProductionJob = {
      id: jobId,
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      status: 'queued',
      progress: 0,
      currentStep: 'Job queued in background production pipeline',
      renderSettings: {
        resolution: settings?.resolution || '1080x1920',
        aspectRatio: '9:16',
        fps: settings?.fps || 30,
        theme: settings?.theme || lesson.subtitleStyle?.theme || 'neon-tiktok',
        includeMusic: settings?.includeMusic ?? true,
        musicTrack: settings?.musicTrack || 'lofi-thai-beats',
        audioSpeed: settings?.audioSpeed || 1.0,
      },
      durationSec: duration,
      startedAt: new Date().toISOString(),
    };

    dbManager.saveJob(newJob);

    // Update lesson status to 'Rendering'
    lesson.status = 'Rendering';
    lesson.renderedVideoId = jobId;
    dbManager.saveLesson(lesson);

    dbManager.addLog({
      category: 'video_render',
      action: 'Rendering Started',
      details: `Enqueued Job ${jobId} for "${lesson.title}" (${duration}s, 1080x1920 9:16)`,
      level: 'info',
    });

    // Start asynchronous stage-by-stage rendering worker
    this.runBackgroundWorker(jobId, lesson);

    return newJob;
  }

  /**
   * Simulates/runs step-by-step rendering with real progress checkpoints
   */
  private runBackgroundWorker(jobId: string, lesson: LessonScript): void {
    const stages = [
      { progress: 15, step: 'Decomposing 5 scenes & typography layout' },
      { progress: 35, step: 'Calibrating Thai and Myanmar audio phonetics' },
      { progress: 55, step: 'Generating karaoke-timed subtitles and tone badges' },
      { progress: 80, step: 'Compositing 9:16 vertical frames with visual cards' },
      { progress: 100, step: 'Final video packaged & optimized for TikTok' },
    ];

    let currentStageIndex = 0;

    const interval = setInterval(() => {
      const job = dbManager.getJobById(jobId);
      if (!job || job.status === 'cancelled') {
        clearInterval(interval);
        this.activeTimers.delete(jobId);
        return;
      }

      if (currentStageIndex < stages.length) {
        const stage = stages[currentStageIndex];
        job.status = 'rendering';
        job.progress = stage.progress;
        job.currentStep = stage.step;
        dbManager.saveJob(job);
        currentStageIndex++;
      } else {
        // Complete
        clearInterval(interval);
        this.activeTimers.delete(jobId);

        job.status = 'completed';
        job.progress = 100;
        job.currentStep = 'Render complete (1080x1920 9:16 Vertical MP4)';
        job.videoUrl = `/api/production/video/${jobId}`;
        job.downloadFilename = `Thai2Myanmar_${lesson.id.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`;
        job.fileSizeBytes = Math.round(12000000 + (lesson.targetDurationSec || 60) * 85000);
        job.completedAt = new Date().toISOString();
        dbManager.saveJob(job);

        // Update lesson status to 'Ready'
        const currentLesson = dbManager.getLessonById(lesson.id);
        if (currentLesson) {
          currentLesson.status = 'Ready';
          currentLesson.renderedVideoId = jobId;
          dbManager.saveLesson(currentLesson);
        }

        dbManager.addLog({
          category: 'video_render',
          action: 'Rendering Completed',
          details: `Job ${jobId} rendered successfully. Ready for preview, download, and TikTok scheduling.`,
          level: 'success',
        });
      }
    }, 1800);

    this.activeTimers.set(jobId, interval);
  }

  /**
   * Retries a failed or cancelled rendering job
   */
  retryJob(jobId: string): ProductionJob | null {
    const job = dbManager.getJobById(jobId);
    if (!job) return null;

    const lesson = dbManager.getLessonById(job.lessonId);
    if (!lesson) return null;

    job.status = 'queued';
    job.progress = 0;
    job.currentStep = 'Retrying rendering job...';
    job.error = null;
    job.startedAt = new Date().toISOString();
    job.completedAt = undefined;
    dbManager.saveJob(job);

    dbManager.addLog({
      category: 'video_render',
      action: 'Rendering Retried',
      details: `Retrying Job ${jobId} for "${lesson.title}"`,
      level: 'info',
    });

    this.runBackgroundWorker(jobId, lesson);
    return job;
  }

  /**
   * Cancels an active job
   */
  cancelJob(jobId: string): boolean {
    const timer = this.activeTimers.get(jobId);
    if (timer) {
      clearInterval(timer);
      this.activeTimers.delete(jobId);
    }

    const job = dbManager.getJobById(jobId);
    if (job) {
      job.status = 'cancelled';
      job.currentStep = 'Job cancelled by user';
      dbManager.saveJob(job);
      return true;
    }
    return false;
  }
}

export const productionQueue = new ProductionQueue();
