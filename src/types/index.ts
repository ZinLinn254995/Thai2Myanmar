/**
 * Core type definitions for Thai2Myanmar AI Studio
 */

export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export type LessonStatus = 
  | 'Draft'
  | 'Approved'
  | 'Rendering'
  | 'Ready'
  | 'Scheduled'
  | 'Published'
  | 'Failed';

export type JobStatus = 'queued' | 'rendering' | 'completed' | 'failed' | 'cancelled';

export interface VocabularyItem {
  id: string;
  thai: string;
  roman: string;
  myanmarPronounce: string; // မြန်မာစာဖြင့် အသံထွက် (e.g. "ခေါ့ပ်-ခွန်း-ခပ်")
  myanmarMeaning: string;   // မြန်မာဘာသာပြန်
  toneDescription?: string; // Low, Mid, High, Falling, Rising
  usageTip?: string;        // ဥပမာ သုံးစွဲပုံ အကြံပြုချက်
}

export interface DialogueLine {
  id: string;
  speaker: 'A' | 'B' | 'Teacher' | 'Student';
  speakerLabelMm?: string;
  thai: string;
  roman: string;
  myanmarPronounce: string;
  myanmarMeaning: string;
}

export interface ExerciseQuiz {
  questionMm: string;
  questionThai?: string;
  options: string[];
  correctAnswerIndex: number;
  explanationMm: string;
}

export interface VideoScene {
  sceneNumber: number;
  title: string;
  type: 'hook' | 'vocab' | 'dialogue' | 'quiz' | 'outro';
  durationSec: number;
  thaiText: string;
  romanText: string;
  myanmarPronounce: string;
  myanmarMeaning: string;
  teacherTipMm?: string;
  backgroundTheme: string;
  speakerTrack: 'thai' | 'myanmar' | 'duet';
  audioUrl?: string;
}

export interface LessonScript {
  id: string;
  title: string;
  topic: string;
  difficulty: DifficultyLevel;
  targetDurationSec: number;
  category: string;
  objectiveMm: string;
  hook: {
    hookThai: string;
    hookRoman: string;
    hookMm: string;
    retentionAngle: string;
  };
  vocabulary: VocabularyItem[];
  dialogue: DialogueLine[];
  exercise: ExerciseQuiz;
  summaryMm: string;
  tiktokCaption: string;
  hashtags: string[];
  culturalNoteMm?: string;
  scenes: VideoScene[];
  status: LessonStatus;
  voiceStyle: {
    thaiVoice: string; // 'female-polite' | 'male-formal' | 'natural-casual'
    myanmarVoice: string;
    speed: number;
  };
  subtitleStyle: {
    theme: 'neon-tiktok' | 'minimal-dark' | 'bangkok-sunset' | 'tokyo-cyber';
    fontSize: number;
    showRomanization: boolean;
    showMyanmarPhonetics: boolean;
  };
  renderedVideoId?: string;
  scheduledTime?: string;
  createdAt: string;
  updatedAt: string;
  aiModelUsed: string;
  tokenCount?: number;
  estimatedCostUsd?: number;
}

export interface ProductionJob {
  id: string;
  lessonId: string;
  lessonTitle: string;
  status: JobStatus;
  progress: number; // 0 to 100
  currentStep: string;
  renderSettings: {
    resolution: '1080x1920' | '720x1280';
    aspectRatio: '9:16';
    fps: number;
    theme: string;
    includeMusic: boolean;
    musicTrack: string;
    audioSpeed: number;
  };
  durationSec: number;
  videoUrl?: string;
  downloadFilename?: string;
  fileSizeBytes?: number;
  error?: string | null;
  startedAt: string;
  completedAt?: string;
}

export interface AIProviderConfig {
  id: string;
  name: string;
  category: 'text' | 'tts' | 'image' | 'video';
  modelName: string;
  enabled: boolean;
  isDefault: boolean;
  isRealConnected: boolean;
  status: 'active' | 'degraded' | 'not_configured' | 'mock_mode';
  costPerUnitUsd: number; // e.g. 0.0001 per 1k tokens or audio minute
  unitType: '1k_tokens' | 'minute' | 'character' | 'render';
  usageCount: number;
  retryPolicy: {
    maxRetries: number;
    backoffMs: number;
  };
  notes: string;
}

export interface PublishingAccount {
  id: string;
  platform: 'tiktok' | 'youtube' | 'facebook' | 'instagram';
  handle: string;
  displayName: string;
  region: 'Japan' | 'Global' | 'Myanmar';
  isOfficialConnected: boolean;
  authStatus: 'authorized' | 'needs_approval' | 'manual_only';
  followersCount: number;
  dailyPostingQuota: number;
  todayPostedCount: number;
  postingMode: 'manual_checklist' | 'direct_api';
  notes: string;
}

export interface QualityAuditRecord {
  id: string;
  lessonId: string;
  score: number; // 0 to 100
  passed: boolean;
  checks: {
    durationOver60s: boolean;
    thaiScriptValid: boolean;
    burmesePronunciationPresent: boolean;
    burmeseTranslationPresent: boolean;
    viralHookPresent: boolean;
    quizInteractive: boolean;
    videoIntegrityVerified: boolean;
    repetitionDetected: boolean;
  };
  structuralChecks?: {
    durationTargetMet: boolean;
    thaiCharactersPresent: boolean;
    burmesePhoneticsFieldPresent: boolean;
    burmeseTranslationFieldPresent: boolean;
    viralHookStructureComplete: boolean;
    quizStructureComplete: boolean;
    repetitionCheckPassed: boolean;
  };
  mediaChecks?: {
    videoFileExists: boolean;
    videoCodecValid: boolean;
    audioCodecValid: boolean;
    isVerticalPortrait: boolean;
    actualVideoDurationSec: number;
    fileSizeBytes: number;
  };
  linguisticVerification?: {
    status: 'heuristic_verified' | 'pending_native_review' | 'native_reviewed';
    disclaimer: string;
    politeParticlesDetected: boolean;
    toneGuidancePresent: boolean;
  };
  recommendationsMm: string[];
  auditedAt: string;
}

export interface ScheduledPost {
  id: string;
  lessonId: string;
  lessonTitle: string;
  accountId: string;
  accountHandle: string;
  platform: 'tiktok';
  scheduledTime: string; // ISO string
  videoUrl: string;
  caption: string;
  hashtags: string[];
  autoPublish: boolean;
  status: 'scheduled' | 'ready_for_upload' | 'publishing' | 'published' | 'failed';
  checklist: {
    videoDownloaded: boolean;
    captionCopied: boolean;
    tagsCopied: boolean;
    soundVerified: boolean;
    manualUploadCompleted: boolean;
  };
  confirmationMethod?: 'validated_url' | 'manual_declaration';
  publishedPostUrl?: string;
  confirmedAt?: string;
  confirmationNotes?: string;
  createdAt: string;
}

export interface SystemSettings {
  dailyVideoLimit: number;
  dailyBudgetLimitUsd: number;
  monthlyBudgetLimitUsd: number;
  timezone: string; // e.g. 'Asia/Tokyo' | 'Asia/Yangon'
  requireManualApproval: boolean;
  creatorRewardsDurationCheck: boolean; // Must be >= 60 seconds
  defaultThaiVoice: string;
  defaultMyanmarVoice: string;
  tiktokDefaultRegion: 'Japan';
  autoPipelineEnabled: boolean;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  category: 'ai_generation' | 'video_render' | 'publish' | 'system' | 'scheduler';
  action: string;
  details: string;
  level: 'info' | 'warn' | 'error' | 'success';
}

export interface CostUsageSummary {
  todayAiCalls: number;
  todayTokensUsed: number;
  todayEstimatedCostUsd: number;
  monthEstimatedCostUsd: number;
  dailyBudgetLimitUsd: number;
  monthlyBudgetLimitUsd: number;
  totalVideosRendered: number;
  totalPublished: number;
}
