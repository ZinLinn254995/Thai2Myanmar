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
   * Update post checklist item. Checklist actions alone do NOT falsely claim published status.
   */
  updateChecklist(
    postId: string, 
    item: keyof ScheduledPost['checklist'], 
    value: boolean
  ): ScheduledPost {
    const posts = sqliteDb.getScheduledPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) {
      throw new Error(`Scheduled post ${postId} not found.`);
    }

    post.checklist[item] = value;

    // Transition to ready_for_upload if media & metadata are prepped, but do NOT falsely mark published
    if (post.status !== 'published') {
      const isPrepped = post.checklist.videoDownloaded && 
                        post.checklist.captionCopied && 
                        post.checklist.tagsCopied && 
                        post.checklist.soundVerified;
      post.status = isPrepped ? 'ready_for_upload' : 'scheduled';
    }

    sqliteDb.saveScheduledPost(post);
    return post;
  }

  /**
   * Explicitly confirm publication with truthful verification.
   * Requires either a validated TikTok URL or an explicit operator manual declaration.
   */
  confirmPublication(params: {
    postId: string;
    confirmationMethod: 'validated_url' | 'manual_declaration';
    postUrl?: string;
    confirmedByOperator: boolean;
    confirmationNotes?: string;
  }): ScheduledPost {
    const posts = sqliteDb.getScheduledPosts();
    const post = posts.find(p => p.id === params.postId);
    if (!post) {
      throw new Error(`Scheduled post ${params.postId} not found.`);
    }

    if (params.confirmationMethod === 'validated_url') {
      const url = (params.postUrl || '').trim();
      const tiktokRegex = /^https?:\/\/(?:[a-zA-Z0-9-]+\.)?tiktok\.com\/[A-Za-z0-9@_./?=&-]+$/i;
      if (!url || !tiktokRegex.test(url)) {
        throw new Error('Invalid TikTok post URL format. URL must begin with https://tiktok.com or https://www.tiktok.com/@handle/video/...');
      }
      post.publishedPostUrl = url;
      post.confirmationMethod = 'validated_url';
    } else if (params.confirmationMethod === 'manual_declaration') {
      if (!params.confirmedByOperator) {
        throw new Error('Operator declaration must be explicitly checked to confirm manual publication without URL.');
      }
      post.publishedPostUrl = undefined;
      post.confirmationMethod = 'manual_declaration';
    } else {
      throw new Error('Unsupported publication confirmation method.');
    }

    post.status = 'published';
    post.checklist.manualUploadCompleted = true;
    post.confirmedAt = new Date().toISOString();
    post.confirmationNotes = params.confirmationNotes || (post.publishedPostUrl ? 'Confirmed with live TikTok post URL' : 'Confirmed via explicit operator manual declaration');

    sqliteDb.saveScheduledPost(post);

    const lesson = sqliteDb.getLessonById(post.lessonId);
    if (lesson) {
      lesson.status = 'Published';
      sqliteDb.saveLesson(lesson);
    }

    sqliteDb.addLog({
      category: 'publish',
      action: 'Post Publication Truthfully Confirmed',
      details: `Post "${post.lessonTitle}" verified on ${post.accountHandle}. Method: ${post.confirmationMethod} ${post.publishedPostUrl ? `URL: ${post.publishedPostUrl}` : ''}`,
      level: 'success',
    });

    return post;
  }

  /**
   * Revert publication status back to scheduled / ready
   */
  revertPublication(postId: string): ScheduledPost {
    const posts = sqliteDb.getScheduledPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) {
      throw new Error(`Scheduled post ${postId} not found.`);
    }

    post.status = 'scheduled';
    post.checklist.manualUploadCompleted = false;
    post.publishedPostUrl = undefined;
    post.confirmationMethod = undefined;
    post.confirmedAt = undefined;
    post.confirmationNotes = undefined;

    sqliteDb.saveScheduledPost(post);

    const lesson = sqliteDb.getLessonById(post.lessonId);
    if (lesson) {
      lesson.status = 'Scheduled';
      sqliteDb.saveLesson(lesson);
    }

    sqliteDb.addLog({
      category: 'publish',
      action: 'Post Publication Reverted',
      details: `Reverted publication state for "${post.lessonTitle}" back to scheduled.`,
      level: 'info',
    });

    return post;
  }
}

export const publishService = new PublishService();
