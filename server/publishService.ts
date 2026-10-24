import { dbManager } from './storage.ts';
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
    const lesson = dbManager.getLessonById(params.lessonId);
    if (!lesson) {
      throw new Error(`Lesson ${params.lessonId} not found.`);
    }

    const accounts = dbManager.getPublishingAccounts();
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

    dbManager.saveScheduledPost(scheduledPost);

    lesson.status = 'Scheduled';
    lesson.scheduledTime = params.scheduledTime;
    dbManager.saveLesson(lesson);

    dbManager.addLog({
      category: 'publish',
      action: 'Post Scheduled',
      details: `Scheduled "${lesson.title}" for ${account.handle} at ${new Date(params.scheduledTime).toLocaleString()}`,
      level: 'info',
    });

    return scheduledPost;
  }

  /**
   * Update post checklist item
   */
  updateChecklist(postId: string, item: keyof ScheduledPost['checklist'], value: boolean): ScheduledPost {
    const posts = dbManager.getScheduledPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) {
      throw new Error(`Scheduled post ${postId} not found.`);
    }

    post.checklist[item] = value;

    // If manual upload completed, mark post as published
    if (post.checklist.manualUploadCompleted) {
      post.status = 'published';
      post.publishedPostUrl = `https://www.tiktok.com/${post.accountHandle}/video/mock_${Date.now()}`;

      const lesson = dbManager.getLessonById(post.lessonId);
      if (lesson) {
        lesson.status = 'Published';
        dbManager.saveLesson(lesson);
      }

      dbManager.addLog({
        category: 'publish',
        action: 'Post Published',
        details: `Post "${post.lessonTitle}" marked as published on ${post.accountHandle}`,
        level: 'success',
      });
    }

    dbManager.saveScheduledPost(post);
    return post;
  }
}

export const publishService = new PublishService();
