import { sqliteDb } from './db.ts';
import { ScheduledPost, PublishingAccount } from '../src/types/index.ts';

export class PublishService {
  /**
   * Schedule a post for TikTok or social platform
   */
  schedulePost(params: {
    lessonId: string;
    accountId: string;
    scheduledTime: string;
    autoPublish?: boolean;
  }): ScheduledPost {
    const lesson = sqliteDb.getLessonById(params.lessonId);
    if (!lesson) {
      throw new Error(`Lesson ${params.lessonId} not found.`);
    }

    const accounts = sqliteDb.getPublishingAccounts();
    const account = accounts.find(a => a.id === params.accountId) || accounts[0];

    const scheduledPost: ScheduledPost = {
      id: `sched-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      accountId: account.id,
      accountHandle: account.handle,
      platform: 'tiktok',
      scheduledTime: params.scheduledTime,
      videoUrl: lesson.renderedVideoId ? `/api/production/video/${lesson.renderedVideoId}` : '',
      caption: lesson.tiktokCaption,
      hashtags: lesson.hashtags,
      autoPublish: params.autoPublish ?? false,
      status: 'scheduled',
      checklist: {
        videoDownloaded: false,
        captionCopied: false,
        tagsCopied: false,
        soundVerified: false,
        manualUploadCompleted: false,
      },
      createdAt: new Date().toISOString(),
    };

    sqliteDb.saveScheduledPost(scheduledPost);

    lesson.status = 'Scheduled';
    lesson.scheduledTime = params.scheduledTime;
    sqliteDb.saveLesson(lesson);

    sqliteDb.addLog({
      category: 'publish',
      action: 'Post Scheduled',
      details: `Scheduled "${lesson.title}" for ${account.handle} at ${new Date(params.scheduledTime).toLocaleString()}`,
      level: 'info',
    });

    return scheduledPost;
  }

  /**
   * Update post checklist item and confirm truthful publishing status
   */
  updateChecklist(
    postId: string, 
    item: keyof ScheduledPost['checklist'], 
    value: boolean,
    realPostUrl?: string
  ): ScheduledPost {
    const posts = sqliteDb.getScheduledPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) {
      throw new Error(`Scheduled post ${postId} not found.`);
    }

    post.checklist[item] = value;

    if (item === 'manualUploadCompleted') {
      if (value) {
        post.status = 'published';
        // Only set post URL if the user provides the real link; NEVER fabricate fake mock URLs
        if (realPostUrl && realPostUrl.startsWith('http')) {
          post.publishedPostUrl = realPostUrl;
        }

        const lesson = sqliteDb.getLessonById(post.lessonId);
        if (lesson) {
          lesson.status = 'Published';
          sqliteDb.saveLesson(lesson);
        }

        sqliteDb.addLog({
          category: 'publish',
          action: 'Post Published (Manual Verified)',
          details: `Post "${post.lessonTitle}" marked as published on ${post.accountHandle}. ${realPostUrl ? `URL: ${realPostUrl}` : '(Manual Package upload)'}`,
          level: 'success',
        });
      } else {
        post.status = 'scheduled';
        post.publishedPostUrl = undefined;
        const lesson = sqliteDb.getLessonById(post.lessonId);
        if (lesson) {
          lesson.status = 'Scheduled';
          sqliteDb.saveLesson(lesson);
        }
      }
    }

    sqliteDb.saveScheduledPost(post);
    return post;
  }
}

export const publishService = new PublishService();
