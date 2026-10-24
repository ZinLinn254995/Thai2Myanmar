import path from 'path';
import fs from 'fs';
import { DatabaseSync } from 'node:sqlite';
import { 
  LessonScript, 
  ProductionJob, 
  AIProviderConfig, 
  PublishingAccount, 
  ScheduledPost, 
  SystemSettings, 
  ActivityLog,
  QualityAuditRecord
} from '../src/types/index.ts';

export type { QualityAuditRecord };

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'thai2myanmar.sqlite');

class SQLiteDatabase {
  private db: DatabaseSync;

  constructor() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const videosDir = path.join(DATA_DIR, 'videos');
    if (!fs.existsSync(videosDir)) {
      fs.mkdirSync(videosDir, { recursive: true });
    }
    const audioDir = path.join(DATA_DIR, 'audio');
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    this.db = new DatabaseSync(DB_PATH);
    this.initSchema();
    this.seedIfEmpty();
  }

  private initSchema() {
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS system_settings (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS lessons (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        topic TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        category TEXT NOT NULL,
        status TEXT NOT NULL,
        target_duration INTEGER NOT NULL,
        data TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS production_jobs (
        id TEXT PRIMARY KEY,
        lesson_id TEXT NOT NULL,
        lesson_title TEXT NOT NULL,
        status TEXT NOT NULL,
        progress INTEGER NOT NULL,
        current_step TEXT NOT NULL,
        duration_sec REAL NOT NULL,
        video_path TEXT,
        file_size_bytes INTEGER,
        error TEXT,
        data TEXT NOT NULL,
        started_at TEXT NOT NULL,
        completed_at TEXT
      );

      CREATE TABLE IF NOT EXISTS scheduled_posts (
        id TEXT PRIMARY KEY,
        lesson_id TEXT NOT NULL,
        lesson_title TEXT NOT NULL,
        account_id TEXT NOT NULL,
        account_handle TEXT NOT NULL,
        platform TEXT NOT NULL,
        scheduled_time TEXT NOT NULL,
        status TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS publishing_accounts (
        id TEXT PRIMARY KEY,
        platform TEXT NOT NULL,
        handle TEXT NOT NULL,
        display_name TEXT NOT NULL,
        region TEXT NOT NULL,
        auth_status TEXT NOT NULL,
        data TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS ai_providers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        model_name TEXT NOT NULL,
        enabled INTEGER NOT NULL,
        status TEXT NOT NULL,
        data TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS quality_audits (
        id TEXT PRIMARY KEY,
        lesson_id TEXT NOT NULL,
        score INTEGER NOT NULL,
        passed INTEGER NOT NULL,
        data TEXT NOT NULL,
        audited_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS activity_logs (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        category TEXT NOT NULL,
        action TEXT NOT NULL,
        details TEXT NOT NULL,
        level TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS metrics (
        id TEXT PRIMARY KEY,
        total_tokens INTEGER NOT NULL,
        total_cost_usd REAL NOT NULL,
        last_reset_date TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_lessons_status ON lessons(status);
      CREATE INDEX IF NOT EXISTS idx_jobs_status ON production_jobs(status);
      CREATE INDEX IF NOT EXISTS idx_scheduled_time ON scheduled_posts(scheduled_time);
      CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON activity_logs(timestamp DESC);
    `);
  }

  private seedIfEmpty() {
    const countQuery = this.db.prepare('SELECT COUNT(*) as count FROM lessons');
    const result = countQuery.get() as { count: number };

    if (result.count === 0) {
      // Check if legacy data/app_database.json exists to migrate
      const legacyJsonPath = path.join(DATA_DIR, 'app_database.json');
      if (fs.existsSync(legacyJsonPath)) {
        try {
          const raw = fs.readFileSync(legacyJsonPath, 'utf-8');
          const legacy = JSON.parse(raw);
          if (Array.isArray(legacy.lessons)) {
            for (const l of legacy.lessons) {
              this.saveLesson(l);
            }
          }
          if (Array.isArray(legacy.productionJobs)) {
            for (const j of legacy.productionJobs) {
              this.saveJob(j);
            }
          }
          if (Array.isArray(legacy.scheduledPosts)) {
            for (const s of legacy.scheduledPosts) {
              this.saveScheduledPost(s);
            }
          }
          if (legacy.settings) {
            this.updateSettings(legacy.settings);
          }
          if (Array.isArray(legacy.activityLogs)) {
            for (const log of legacy.activityLogs) {
              this.addLog(log);
            }
          }
        } catch (err) {
          console.warn('Error reading legacy json database for migration:', err);
        }
      }

      // Seed settings if not present
      this.initDefaultSettings();
      this.initDefaultAIProviders();
      this.initDefaultAccounts();
      this.initMetrics();
    }
  }

  private initDefaultSettings() {
    const check = this.db.prepare('SELECT id FROM system_settings WHERE id = ?').get('global');
    if (!check) {
      const defaultSettings: SystemSettings = {
        dailyVideoLimit: 3,
        dailyBudgetLimitUsd: 5.00,
        monthlyBudgetLimitUsd: 50.00,
        timezone: 'Asia/Tokyo',
        requireManualApproval: true,
        creatorRewardsDurationCheck: true,
        defaultThaiVoice: 'female-polite',
        defaultMyanmarVoice: 'female-clear',
        tiktokDefaultRegion: 'Japan',
        autoPipelineEnabled: false,
      };
      this.db.prepare('INSERT INTO system_settings (id, data, updated_at) VALUES (?, ?, ?)')
        .run('global', JSON.stringify(defaultSettings), new Date().toISOString());
    }
  }

  private initDefaultAIProviders() {
    const providers: AIProviderConfig[] = [
      {
        id: 'gemini-3.8-flash',
        name: 'Google Gemini 3.8 Flash',
        category: 'text',
        modelName: 'gemini-3.8-flash',
        enabled: true,
        isDefault: true,
        isRealConnected: true,
        status: 'active',
        costPerUnitUsd: 0.00015,
        unitType: '1k_tokens',
        usageCount: 18,
        retryPolicy: { maxRetries: 3, backoffMs: 1000 },
        notes: 'Primary text generation, translation & pedagogical structuring engine via @google/genai.',
      },
      {
        id: 'gemini-tts',
        name: 'Google Gemini 3.8 Flash Lite TTS',
        category: 'tts',
        modelName: 'gemini-3.8-flash-lite-tts',
        enabled: true,
        isDefault: true,
        isRealConnected: true,
        status: 'active',
        costPerUnitUsd: 0.0003,
        unitType: 'minute',
        usageCount: 12,
        retryPolicy: { maxRetries: 2, backoffMs: 1500 },
        notes: 'High-fidelity audio generation for Thai & Burmese narration using native GenAI speech.',
      },
      {
        id: 'gemini-image',
        name: 'Gemini 3.1 Flash Lite Image',
        category: 'image',
        modelName: 'gemini-3.1-flash-lite-image',
        enabled: true,
        isDefault: true,
        isRealConnected: true,
        status: 'active',
        costPerUnitUsd: 0.002,
        unitType: 'render',
        usageCount: 4,
        retryPolicy: { maxRetries: 2, backoffMs: 2000 },
        notes: 'Generates authentic Thai cultural and situational backdrop visual assets.',
      },
      {
        id: 'ffmpeg-native-engine',
        name: 'Server-Side FFmpeg 9:16 Video Engine',
        category: 'video',
        modelName: 'ffmpeg-h264-aac',
        enabled: true,
        isDefault: true,
        isRealConnected: true,
        status: 'active',
        costPerUnitUsd: 0.00,
        unitType: 'render',
        usageCount: 6,
        retryPolicy: { maxRetries: 2, backoffMs: 2000 },
        notes: 'Native 1080x1920 MP4 compositor with H.264/AAC encoding and karaoke subtitles.',
      },
    ];

    for (const p of providers) {
      const check = this.db.prepare('SELECT id FROM ai_providers WHERE id = ?').get(p.id);
      if (!check) {
        this.db.prepare('INSERT INTO ai_providers (id, name, category, model_name, enabled, status, data, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
          .run(p.id, p.name, p.category, p.modelName, p.enabled ? 1 : 0, p.status, JSON.stringify(p), new Date().toISOString());
      }
    }
  }

  private initDefaultAccounts() {
    const accounts: PublishingAccount[] = [
      {
        id: 'acc-tiktok-jp-1',
        platform: 'tiktok',
        handle: '@thai2myanmar_jp',
        displayName: 'Thai2Myanmar Official (Japan)',
        region: 'Japan',
        isOfficialConnected: false,
        authStatus: 'manual_only',
        followersCount: 14200,
        dailyPostingQuota: 2,
        todayPostedCount: 1,
        postingMode: 'manual_checklist',
        notes: 'Primary TikTok Japan account. 1-Click Package Export & verified upload status.',
      },
    ];

    for (const a of accounts) {
      const check = this.db.prepare('SELECT id FROM publishing_accounts WHERE id = ?').get(a.id);
      if (!check) {
        this.db.prepare('INSERT INTO publishing_accounts (id, platform, handle, display_name, region, auth_status, data, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
          .run(a.id, a.platform, a.handle, a.displayName, a.region, a.authStatus, JSON.stringify(a), new Date().toISOString());
      }
    }
  }

  private initMetrics() {
    const check = this.db.prepare('SELECT id FROM metrics WHERE id = ?').get('global');
    if (!check) {
      this.db.prepare('INSERT INTO metrics (id, total_tokens, total_cost_usd, last_reset_date) VALUES (?, ?, ?, ?)')
        .run('global', 4200, 0.00063, new Date().toISOString().split('T')[0]);
    }
  }

  // --- Lessons ---
  public getLessons(): LessonScript[] {
    const rows = this.db.prepare('SELECT data FROM lessons ORDER BY created_at DESC').all() as { data: string }[];
    return rows.map(r => JSON.parse(r.data));
  }

  public getLessonById(id: string): LessonScript | undefined {
    const row = this.db.prepare('SELECT data FROM lessons WHERE id = ?').get(id) as { data: string } | undefined;
    return row ? JSON.parse(row.data) : undefined;
  }

  public saveLesson(lesson: LessonScript): LessonScript {
    lesson.updatedAt = new Date().toISOString();
    if (!lesson.createdAt) lesson.createdAt = new Date().toISOString();

    const existing = this.db.prepare('SELECT id FROM lessons WHERE id = ?').get(lesson.id);
    const dataJson = JSON.stringify(lesson);

    if (existing) {
      this.db.prepare(`
        UPDATE lessons 
        SET title = ?, topic = ?, difficulty = ?, category = ?, status = ?, target_duration = ?, data = ?, updated_at = ?
        WHERE id = ?
      `).run(
        lesson.title,
        lesson.topic,
        lesson.difficulty,
        lesson.category || 'General',
        lesson.status,
        lesson.targetDurationSec || 65,
        dataJson,
        lesson.updatedAt,
        lesson.id
      );
    } else {
      this.db.prepare(`
        INSERT INTO lessons (id, title, topic, difficulty, category, status, target_duration, data, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        lesson.id,
        lesson.title,
        lesson.topic,
        lesson.difficulty,
        lesson.category || 'General',
        lesson.status,
        lesson.targetDurationSec || 65,
        dataJson,
        lesson.createdAt,
        lesson.updatedAt
      );
    }
    return lesson;
  }

  public deleteLesson(id: string): boolean {
    const info = this.db.prepare('DELETE FROM lessons WHERE id = ?').run(id);
    return info.changes > 0;
  }

  // --- Production Jobs ---
  public getJobs(): ProductionJob[] {
    const rows = this.db.prepare('SELECT data FROM production_jobs ORDER BY started_at DESC').all() as { data: string }[];
    return rows.map(r => JSON.parse(r.data));
  }

  public getJobById(id: string): ProductionJob | undefined {
    const row = this.db.prepare('SELECT data FROM production_jobs WHERE id = ?').get(id) as { data: string } | undefined;
    return row ? JSON.parse(row.data) : undefined;
  }

  public saveJob(job: ProductionJob): ProductionJob {
    const existing = this.db.prepare('SELECT id FROM production_jobs WHERE id = ?').get(job.id);
    const dataJson = JSON.stringify(job);

    if (existing) {
      this.db.prepare(`
        UPDATE production_jobs 
        SET status = ?, progress = ?, current_step = ?, duration_sec = ?, video_path = ?, file_size_bytes = ?, error = ?, data = ?, completed_at = ?
        WHERE id = ?
      `).run(
        job.status,
        job.progress,
        job.currentStep,
        job.durationSec || 65,
        job.videoUrl || null,
        job.fileSizeBytes || null,
        job.error || null,
        dataJson,
        job.completedAt || null,
        job.id
      );
    } else {
      this.db.prepare(`
        INSERT INTO production_jobs (id, lesson_id, lesson_title, status, progress, current_step, duration_sec, video_path, file_size_bytes, error, data, started_at, completed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        job.id,
        job.lessonId,
        job.lessonTitle,
        job.status,
        job.progress,
        job.currentStep,
        job.durationSec || 65,
        job.videoUrl || null,
        job.fileSizeBytes || null,
        job.error || null,
        dataJson,
        job.startedAt,
        job.completedAt || null
      );
    }
    return job;
  }

  // --- Quality Audits ---
  public saveQualityAudit(audit: QualityAuditRecord): QualityAuditRecord {
    const dataJson = JSON.stringify(audit);
    this.db.prepare(`
      INSERT OR REPLACE INTO quality_audits (id, lesson_id, score, passed, data, audited_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(audit.id, audit.lessonId, audit.score, audit.passed ? 1 : 0, dataJson, audit.auditedAt);
    return audit;
  }

  public getQualityAuditByLessonId(lessonId: string): QualityAuditRecord | undefined {
    const row = this.db.prepare('SELECT data FROM quality_audits WHERE lesson_id = ? ORDER BY audited_at DESC LIMIT 1')
      .get(lessonId) as { data: string } | undefined;
    return row ? JSON.parse(row.data) : undefined;
  }

  // --- Scheduled Posts ---
  public getScheduledPosts(): ScheduledPost[] {
    const rows = this.db.prepare('SELECT data FROM scheduled_posts ORDER BY scheduled_time ASC').all() as { data: string }[];
    return rows.map(r => JSON.parse(r.data));
  }

  public saveScheduledPost(post: ScheduledPost): ScheduledPost {
    const existing = this.db.prepare('SELECT id FROM scheduled_posts WHERE id = ?').get(post.id);
    const dataJson = JSON.stringify(post);

    if (existing) {
      this.db.prepare(`
        UPDATE scheduled_posts 
        SET status = ?, scheduled_time = ?, data = ?
        WHERE id = ?
      `).run(post.status, post.scheduledTime, dataJson, post.id);
    } else {
      this.db.prepare(`
        INSERT INTO scheduled_posts (id, lesson_id, lesson_title, account_id, account_handle, platform, scheduled_time, status, data, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        post.id,
        post.lessonId,
        post.lessonTitle,
        post.accountId,
        post.accountHandle,
        post.platform,
        post.scheduledTime,
        post.status,
        dataJson,
        post.createdAt
      );
    }
    return post;
  }

  // --- Publishing Accounts ---
  public getPublishingAccounts(): PublishingAccount[] {
    const rows = this.db.prepare('SELECT data FROM publishing_accounts').all() as { data: string }[];
    return rows.map(r => JSON.parse(r.data));
  }

  public updatePublishingAccount(id: string, updates: Partial<PublishingAccount>): PublishingAccount | null {
    const acc = this.getPublishingAccounts().find(a => a.id === id);
    if (!acc) return null;
    Object.assign(acc, updates);
    this.db.prepare('UPDATE publishing_accounts SET data = ?, updated_at = ? WHERE id = ?')
      .run(JSON.stringify(acc), new Date().toISOString(), id);
    return acc;
  }

  // --- AI Providers ---
  public getAIProviders(): AIProviderConfig[] {
    const rows = this.db.prepare('SELECT data FROM ai_providers').all() as { data: string }[];
    return rows.map(r => JSON.parse(r.data));
  }

  public updateAIProvider(id: string, updates: Partial<AIProviderConfig>): AIProviderConfig | null {
    const provider = this.getAIProviders().find(p => p.id === id);
    if (!provider) return null;
    Object.assign(provider, updates);
    this.db.prepare('UPDATE ai_providers SET enabled = ?, status = ?, data = ?, updated_at = ? WHERE id = ?')
      .run(provider.enabled ? 1 : 0, provider.status, JSON.stringify(provider), new Date().toISOString(), id);
    return provider;
  }

  // --- Settings ---
  public getSettings(): SystemSettings {
    const row = this.db.prepare('SELECT data FROM system_settings WHERE id = ?').get('global') as { data: string } | undefined;
    if (row) return JSON.parse(row.data);
    this.initDefaultSettings();
    return this.getSettings();
  }

  public updateSettings(settings: Partial<SystemSettings>): SystemSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    this.db.prepare('UPDATE system_settings SET data = ?, updated_at = ? WHERE id = ?')
      .run(JSON.stringify(updated), new Date().toISOString(), 'global');
    return updated;
  }

  // --- Activity Logs ---
  public getLogs(limit = 100): ActivityLog[] {
    const rows = this.db.prepare('SELECT id, timestamp, category, action, details, level FROM activity_logs ORDER BY timestamp DESC LIMIT ?')
      .all(limit) as unknown as ActivityLog[];
    return rows;
  }

  public addLog(log: Omit<ActivityLog, 'id' | 'timestamp'> & { id?: string; timestamp?: string }): ActivityLog {
    const newLog: ActivityLog = {
      id: log.id || `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: log.timestamp || new Date().toISOString(),
      category: log.category,
      action: log.action,
      details: log.details,
      level: log.level,
    };
    this.db.prepare('INSERT INTO activity_logs (id, timestamp, category, action, details, level) VALUES (?, ?, ?, ?, ?, ?)')
      .run(newLog.id, newLog.timestamp, newLog.category, newLog.action, newLog.details, newLog.level);
    return newLog;
  }

  // --- Metrics ---
  public getMetrics() {
    const row = this.db.prepare('SELECT total_tokens, total_cost_usd, last_reset_date FROM metrics WHERE id = ?')
      .get('global') as { total_tokens: number; total_cost_usd: number; last_reset_date: string } | undefined;
    return row || { total_tokens: 0, total_cost_usd: 0, last_reset_date: new Date().toISOString().split('T')[0] };
  }

  public recordUsage(tokens: number, estimatedCostUsd: number): void {
    this.db.prepare('UPDATE metrics SET total_tokens = total_tokens + ?, total_cost_usd = total_cost_usd + ? WHERE id = ?')
      .run(tokens, estimatedCostUsd, 'global');
  }
}

export const sqliteDb = new SQLiteDatabase();
