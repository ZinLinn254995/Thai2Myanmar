import { 
  LessonScript, 
  ProductionJob, 
  AIProviderConfig, 
  PublishingAccount, 
  ScheduledPost, 
  SystemSettings, 
  ActivityLog, 
  DifficultyLevel 
} from '../types/index.ts';

const API_BASE = '/api';

export const api = {
  // System Health
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  // Lessons
  async getLessons(params?: { status?: string; difficulty?: string; search?: string }): Promise<LessonScript[]> {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`${API_BASE}/lessons?${query}`);
    const data = await res.json();
    return data.data || [];
  },

  async getLesson(id: string): Promise<LessonScript> {
    const res = await fetch(`${API_BASE}/lessons/${id}`);
    const data = await res.json();
    return data.data;
  },

  async generateLesson(params: {
    topic: string;
    difficulty: DifficultyLevel;
    targetDurationSec?: number;
    category?: string;
    customInstructions?: string;
  }): Promise<LessonScript> {
    const res = await fetch(`${API_BASE}/lessons/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to generate lesson');
    }
    return data.data;
  },

  async saveLesson(lesson: Partial<LessonScript>): Promise<LessonScript> {
    const method = lesson.id ? 'PUT' : 'POST';
    const url = lesson.id ? `${API_BASE}/lessons/${lesson.id}` : `${API_BASE}/lessons`;
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lesson),
    });
    const data = await res.json();
    return data.data;
  },

  async deleteLesson(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/lessons/${id}`, { method: 'DELETE' });
    const data = await res.json();
    return data.success;
  },

  async duplicateLesson(id: string): Promise<LessonScript> {
    const res = await fetch(`${API_BASE}/lessons/${id}/duplicate`, { method: 'POST' });
    const data = await res.json();
    return data.data;
  },

  async rewriteSection(id: string, section: string, instruction: string): Promise<LessonScript> {
    const res = await fetch(`${API_BASE}/lessons/${id}/rewrite-section`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section, instruction }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  },

  // Voice
  async generateVoice(text: string, language: 'th-TH' | 'my-MM', voiceStyle?: string, speed?: number) {
    const res = await fetch(`${API_BASE}/voice/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language, voiceStyle, speed }),
    });
    return res.json();
  },

  // Video Production
  async renderVideo(lessonId: string, renderSettings?: any): Promise<ProductionJob> {
    const res = await fetch(`${API_BASE}/production/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId, renderSettings }),
    });
    const data = await res.json();
    return data.data;
  },

  async getJobs(): Promise<ProductionJob[]> {
    const res = await fetch(`${API_BASE}/production/jobs`);
    const data = await res.json();
    return data.data || [];
  },

  async retryJob(jobId: string): Promise<ProductionJob> {
    const res = await fetch(`${API_BASE}/production/jobs/${jobId}/retry`, { method: 'POST' });
    const data = await res.json();
    return data.data;
  },

  async cancelJob(jobId: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/production/jobs/${jobId}/cancel`, { method: 'POST' });
    const data = await res.json();
    return data.success;
  },

  // Publishing
  async getAccounts(): Promise<PublishingAccount[]> {
    const res = await fetch(`${API_BASE}/publish/accounts`);
    const data = await res.json();
    return data.data || [];
  },

  async updateAccount(id: string, updates: Partial<PublishingAccount>): Promise<PublishingAccount> {
    const res = await fetch(`${API_BASE}/publish/accounts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    return data.data;
  },

  async getScheduledPosts(): Promise<ScheduledPost[]> {
    const res = await fetch(`${API_BASE}/publish/scheduled`);
    const data = await res.json();
    return data.data || [];
  },

  async schedulePost(params: {
    lessonId: string;
    accountId: string;
    scheduledTime: string;
    autoPublish?: boolean;
  }): Promise<ScheduledPost> {
    const res = await fetch(`${API_BASE}/publish/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    return data.data;
  },

  async updateChecklist(postId: string, item: string, value: boolean): Promise<ScheduledPost> {
    const res = await fetch(`${API_BASE}/publish/checklist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, item, value }),
    });
    const data = await res.json();
    return data.data;
  },

  // Scheduler & Automation
  async runDailyAutomation(): Promise<{ success: boolean; message: string; lesson?: LessonScript }> {
    const res = await fetch(`${API_BASE}/scheduler/run-now`, { method: 'POST' });
    return res.json();
  },

  // AI Providers & Metrics
  async getProviders(): Promise<AIProviderConfig[]> {
    const res = await fetch(`${API_BASE}/providers`);
    const data = await res.json();
    return data.data || [];
  },

  async updateProvider(id: string, updates: Partial<AIProviderConfig>): Promise<AIProviderConfig> {
    const res = await fetch(`${API_BASE}/providers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    return data.data;
  },

  async getMetrics(): Promise<any> {
    const res = await fetch(`${API_BASE}/metrics`);
    const data = await res.json();
    return data.data;
  },

  // Settings & Activity Logs
  async getSettings(): Promise<SystemSettings> {
    const res = await fetch(`${API_BASE}/settings`);
    const data = await res.json();
    return data.data;
  },

  async updateSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    return data.data;
  },

  async getLogs(limit = 100): Promise<ActivityLog[]> {
    const res = await fetch(`${API_BASE}/logs?limit=${limit}`);
    const data = await res.json();
    return data.data || [];
  },
};
