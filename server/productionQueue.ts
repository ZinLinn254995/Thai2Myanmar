import fs from 'fs';
import path from 'path';
import { sqliteDb } from './db.ts';
import { ffmpegRenderer } from './ffmpegRenderer.ts';
import { qualityGate } from './qualityGate.ts';
import { LessonScript, ProductionJob } from '../src/types/index.ts';

const VIDEOS_DIR = path.resolve(process.cwd(), 'data', 'videos');

export class ProductionQueue {
  private activeJobs: Set<string> = new Set();

  constructor() {
    this.recoverInterruptedJobs();
  }

  /**
   * On server startup, recover any jobs that were interrupted during a restart
   */
  private recoverInterruptedJobs() {
    const allJobs = sqliteDb.getJobs();
    for (const job of allJobs) {
      if (job.status === 'rendering' || job.status === 'queued') {
        const videoPath = path.join(VIDEOS_DIR, `${job.id}.mp4`);
        if (fs.existsSync(videoPath)) {
          job.status = 'completed';
          job.progress = 100;
          job.currentStep = 'Render verified from disk';
          job.videoUrl = `/api/production/video/${job.id}`;
          job.completedAt = job.completedAt || new Date().toISOString();
          sqliteDb.saveJob(job);
        } else {
          // Mark as paused / recoverable
          job.status = 'failed';
          job.error = 'Job interrupted by server restart. Click "Retry Render" to regenerate.';
          sqliteDb.saveJob(job);
        }
      }
    }
  }

  /**
   * Enqueues a lesson for video production rendering
   */
  startRenderJob(lesson: LessonScript, settings?: Partial<ProductionJob['renderSettings']>): ProductionJob {
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const duration = lesson.targetDurationSec || 65;

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

    sqliteDb.saveJob(newJob);

    // Update lesson status to 'Rendering'
    lesson.status = 'Rendering';
    lesson.renderedVideoId = jobId;
    sqliteDb.saveLesson(lesson);

    sqliteDb.addLog({
      category: 'video_render',
      action: 'Rendering Started',
      details: `Enqueued Job ${jobId} for "${lesson.title}" (${duration}s, 1080x1920 9:16 MP4)`,
      level: 'info',
    });

    // Start background rendering execution
    this.runWorker(jobId, lesson);

    return newJob;
  }

  /**
   * Executes the real FFmpeg 9:16 rendering pipeline asynchronously
   */
  private async runWorker(jobId: string, lesson: LessonScript): Promise<void> {
    if (this.activeJobs.has(jobId)) return;
    this.activeJobs.add(jobId);

    try {
      const job = sqliteDb.getJobById(jobId);
      if (!job) return;

      job.status = 'rendering';
      job.progress = 5;
      job.currentStep = 'Starting FFmpeg 1080x1920 video pipeline...';
      sqliteDb.saveJob(job);

      // Execute genuine FFmpeg render
      const renderResult = await ffmpegRenderer.renderLessonToMp4(
        lesson,
        job,
        (progress, step) => {
          const current = sqliteDb.getJobById(jobId);
          if (current && current.status !== 'cancelled') {
            current.progress = progress;
            current.currentStep = step;
            sqliteDb.saveJob(current);
          }
        }
      );

      // Probe & Audit video with Quality Gate
      const audit = await qualityGate.auditLesson(lesson, renderResult.videoPath);

      // Update job to completed
      const completedJob = sqliteDb.getJobById(jobId);
      if (completedJob) {
        completedJob.status = 'completed';
        completedJob.progress = 100;
        completedJob.currentStep = `Render complete (1080x1920 MP4, ${renderResult.durationSec.toFixed(1)}s, Quality: ${audit.score}/100)`;
        completedJob.durationSec = renderResult.durationSec;
        completedJob.fileSizeBytes = renderResult.fileSizeBytes;
        completedJob.videoUrl = `/api/production/video/${jobId}`;
        completedJob.downloadFilename = `Thai2Myanmar_${lesson.id.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`;
        completedJob.completedAt = new Date().toISOString();
        sqliteDb.saveJob(completedJob);
      }

      // Update lesson status to 'Ready'
      const currentLesson = sqliteDb.getLessonById(lesson.id);
      if (currentLesson) {
        currentLesson.status = 'Ready';
        currentLesson.renderedVideoId = jobId;
        sqliteDb.saveLesson(currentLesson);
      }

      sqliteDb.addLog({
        category: 'video_render',
        action: 'Rendering Completed',
        details: `Job ${jobId} finished: Genuine 1080x1920 MP4 (${renderResult.durationSec.toFixed(1)}s, ${(renderResult.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB). Quality Gate: ${audit.score}%`,
        level: 'success',
      });

    } catch (err: any) {
      console.error(`Render job ${jobId} failed:`, err);
      const failedJob = sqliteDb.getJobById(jobId);
      if (failedJob) {
        failedJob.status = 'failed';
        failedJob.error = err.message || 'FFmpeg rendering failed';
        failedJob.currentStep = 'Render failed: ' + (err.message || 'Unknown error');
        sqliteDb.saveJob(failedJob);
      }

      const currentLesson = sqliteDb.getLessonById(lesson.id);
      if (currentLesson) {
        currentLesson.status = 'Failed';
        sqliteDb.saveLesson(currentLesson);
      }

      sqliteDb.addLog({
        category: 'video_render',
        action: 'Rendering Failed',
        details: `Job ${jobId} error: ${err.message}`,
        level: 'error',
      });
    } finally {
      this.activeJobs.delete(jobId);
    }
  }

  /**
   * Retries a failed rendering job
   */
  retryJob(jobId: string): ProductionJob | null {
    const job = sqliteDb.getJobById(jobId);
    if (!job) return null;

    const lesson = sqliteDb.getLessonById(job.lessonId);
    if (!lesson) return null;

    job.status = 'queued';
    job.progress = 0;
    job.currentStep = 'Retrying rendering job...';
    job.error = null;
    job.startedAt = new Date().toISOString();
    job.completedAt = undefined;
    sqliteDb.saveJob(job);

    sqliteDb.addLog({
      category: 'video_render',
      action: 'Rendering Retried',
      details: `Retrying Job ${jobId} for "${lesson.title}"`,
      level: 'info',
    });

    this.runWorker(jobId, lesson);
    return job;
  }

  /**
   * Cancels an active job
   */
  cancelJob(jobId: string): boolean {
    const job = sqliteDb.getJobById(jobId);
    if (job && (job.status === 'rendering' || job.status === 'queued')) {
      job.status = 'cancelled';
      job.currentStep = 'Job cancelled by user';
      sqliteDb.saveJob(job);
      this.activeJobs.delete(jobId);
      return true;
    }
    return false;
  }
}

export const productionQueue = new ProductionQueue();
