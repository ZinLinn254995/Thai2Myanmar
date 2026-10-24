import fs from 'fs';
import path from 'path';
import { 
  LessonScript, 
  ProductionJob, 
  AIProviderConfig, 
  PublishingAccount, 
  ScheduledPost, 
  SystemSettings, 
  ActivityLog 
} from '../src/types/index.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'app_database.json');

export interface DatabaseSchema {
  lessons: LessonScript[];
  productionJobs: ProductionJob[];
  aiProviders: AIProviderConfig[];
  publishingAccounts: PublishingAccount[];
  scheduledPosts: ScheduledPost[];
  settings: SystemSettings;
  activityLogs: ActivityLog[];
  metrics: {
    totalTokensUsed: number;
    totalCostUsd: number;
    lastResetDate: string;
  };
}

const defaultSettings: SystemSettings = {
  dailyVideoLimit: 3,
  dailyBudgetLimitUsd: 2.00,
  monthlyBudgetLimitUsd: 25.00,
  timezone: 'Asia/Tokyo',
  requireManualApproval: true,
  creatorRewardsDurationCheck: true, // Requires > 60 seconds
  defaultThaiVoice: 'female-polite',
  defaultMyanmarVoice: 'female-clear',
  tiktokDefaultRegion: 'Japan',
  autoPipelineEnabled: false,
};

const defaultAIProviders: AIProviderConfig[] = [
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
    usageCount: 14,
    retryPolicy: { maxRetries: 3, backoffMs: 1000 },
    notes: 'Primary text generation & Burmese pedagogical structuring engine.',
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
    usageCount: 8,
    retryPolicy: { maxRetries: 2, backoffMs: 1500 },
    notes: 'Native Google GenAI speech synthesis with low latency.',
  },
  {
    id: 'elevenlabs-adapter',
    name: 'ElevenLabs Voice Engine',
    category: 'tts',
    modelName: 'eleven_multilingual_v2',
    enabled: false,
    isDefault: false,
    isRealConnected: false,
    status: 'not_configured',
    costPerUnitUsd: 0.003,
    unitType: 'character',
    usageCount: 0,
    retryPolicy: { maxRetries: 2, backoffMs: 2000 },
    notes: 'External TTS provider adapter. Requires ELEVENLABS_API_KEY.',
  },
  {
    id: 'omni-video-adapter',
    name: 'Gemini Omni Flash / Veo',
    category: 'video',
    modelName: 'gemini-omni-1.1-flash',
    enabled: false,
    isDefault: false,
    isRealConnected: false,
    status: 'not_configured',
    costPerUnitUsd: 0.05,
    unitType: 'render',
    usageCount: 0,
    retryPolicy: { maxRetries: 1, backoffMs: 3000 },
    notes: 'Future AI video generator interface. Current engine uses 9:16 Canvas Compositor.',
  },
];

const defaultPublishingAccounts: PublishingAccount[] = [
  {
    id: 'acc-tiktok-jp-1',
    platform: 'tiktok',
    handle: '@thai2myanmar_jp',
    displayName: 'Thai2Myanmar Official (JP)',
    region: 'Japan',
    isOfficialConnected: false, // Requires TikTok Partner audit for direct post
    authStatus: 'manual_only',
    followersCount: 12450,
    dailyPostingQuota: 2,
    todayPostedCount: 1,
    postingMode: 'manual_checklist',
    notes: 'Primary TikTok Japan account. Full manual checklist & 1-click package export enabled.',
  },
  {
    id: 'acc-tiktok-global',
    platform: 'tiktok',
    handle: '@thai_burmese_academy',
    displayName: 'Thai Language For Myanmar',
    region: 'Global',
    isOfficialConnected: false,
    authStatus: 'needs_approval',
    followersCount: 3820,
    dailyPostingQuota: 3,
    todayPostedCount: 0,
    postingMode: 'manual_checklist',
    notes: 'Secondary global account for general Myanmar learners in ASEAN.',
  },
];

const seedLessons: LessonScript[] = [
  {
    id: 'lesson-seed-01',
    title: 'ထိုင်းရောက်စမှာ မဖြစ်မနေသိထားရမည့် အခြေခံနှုတ်ဆက်စကား (၅) ခွန်း',
    topic: 'Essential Daily Greetings in Thailand',
    difficulty: 'Beginner',
    targetDurationSec: 64, // Compliant with TikTok >60s Creator Rewards
    category: 'Daily Conversation',
    objectiveMm: 'ထိုင်းနိုင်ငံတွင် နေ့စဉ်သုံး အခြေခံ နှုတ်ဆက်စကား ၅ ခွန်းကို အသံထွက်မှန်ကန်စွာ ပြောဆိုတတ်စေရန်။',
    hook: {
      hookThai: 'สวัสดีครับ/ค่ะ พูดให้เหมือนคนไทย ทำยังไง?',
      hookRoman: 'Sawatdee khrap / kha, phut hai muean khon thai tham yang ngai?',
      hookMm: 'ထိုင်းစကား "မင်္ဂလာပါ" ကို ထိုင်းလူမျိုးစစ်စစ်လို အသံထွက်တတ်ချင်လား? ဒီ ၅ ခွန်းကို မှတ်ထားပါ!',
      retentionAngle: 'Stop scroll in first 3s by pointing out pronunciation tone secret.'
    },
    vocabulary: [
      {
        id: 'v1',
        thai: 'สวัสดี',
        roman: 'Sawatdee',
        myanmarPronounce: 'စဝတ်ဒီ',
        myanmarMeaning: 'မင်္ဂလာပါ / နှုတ်ဆက်ပါတယ်',
        toneDescription: 'Mid - Low - Mid tones',
        usageTip: 'အမျိုးသားဆိုပါက စဝတ်ဒီ ခပ် (ครับ)၊ အမျိုးသမီးဆိုပါက စဝတ်ဒီ ခါ (ค่ะ) တွဲသုံးပါ။'
      },
      {
        id: 'v2',
        thai: 'ขอบคุณ',
        roman: 'Khop khun',
        myanmarPronounce: 'ခေါ့ပ် ခွန်း',
        myanmarMeaning: 'ကျေးဇူးတင်ပါတယ်',
        toneDescription: 'Falling - Mid tone',
        usageTip: 'အဆုံးသတ်မှာ ခပ်/ခါ ထည့်ပေးခြင်းဖြင့် ယဉ်ကျေးမှုကို ဖော်ပြသည်။'
      },
      {
        id: 'v3',
        thai: 'ขอโทษ',
        roman: 'Kho thot',
        myanmarPronounce: 'ခေါဝ် ထုတ်တ်',
        myanmarMeaning: 'တောင်းပန်ပါတယ် / ခွင့်လွှတ်ပါ',
        toneDescription: 'Rising - Falling tone',
        usageTip: 'လမ်းဖယ်ပေးဖို့ ပြောတဲ့အခါ သို့မဟုတ် မှားသွားတဲ့အခါ သုံးသည်။'
      },
      {
        id: 'v4',
        thai: 'สบายดีไหม',
        roman: 'Sabai dee mai',
        myanmarPronounce: 'စဘိုင်း ဒီ မိုင်း',
        myanmarMeaning: 'နေကောင်းလား / အဆင်ပြေလား',
        toneDescription: 'Low - Mid - Rising tone',
        usageTip: 'အပြန်အလှန် နှုတ်ဆက်ရာတွင် အမြဲတွဲသုံးသည်။'
      },
      {
        id: 'v5',
        thai: 'ยินดีที่ได้รู้จัก',
        roman: 'Yin dee thee dai roojak',
        myanmarPronounce: 'ယင်းဒီ ထီး လိုက် ရူးဂျာ့က်',
        myanmarMeaning: 'တွေ့ရတာ ဝမ်းသာပါတယ်',
        toneDescription: 'Polite formal phrase',
        usageTip: 'ပထမဆုံးအကြိမ် မိတ်ဆက်သည့်အခါ အသုံးဝင်သည်။'
      }
    ],
    dialogue: [
      {
        id: 'd1',
        speaker: 'A',
        speakerLabelMm: 'စကားပြော (က)',
        thai: 'สวัสดีครับ คุณสบายดีไหมครับ',
        roman: 'Sawatdee khrap, khun sabai dee mai khrap?',
        myanmarPronounce: 'စဝတ်ဒီ ခပ်၊ ခွန်း စဘိုင်း ဒီ မိုင်း ခပ်?',
        myanmarMeaning: 'မင်္ဂလာပါခင်ဗျာ၊ သင် နေကောင်းရဲ့လားခင်ဗျာ?'
      },
      {
        id: 'd2',
        speaker: 'B',
        speakerLabelMm: 'စကားပြော (ခ)',
        thai: 'สบายดีค่ะ ขอบคุณค่ะ แล้วคุณล่ะคะ',
        roman: 'Sabai dee kha, khop khun kha, laew khun la kha?',
        myanmarPronounce: 'စဘိုင်း ဒီ ခါ၊ ခေါ့ပ် ခွန်း ခါ၊ လဲဝ် ခွန်း လ ခါ?',
        myanmarMeaning: 'နေကောင်းပါတယ်ရှင့်၊ ကျေးဇူးတင်ပါတယ်၊ သင်ရော နေကောင်းလားရှင့်?'
      }
    ],
    exercise: {
      questionMm: 'ထိုင်းလို "ကျေးဇူးတင်ပါတယ်" ကို ဘယ်လိုပြောသလဲ?',
      questionThai: 'คำว่า "ขอบคุณ" ในภาษาพม่าแปลว่าอะไร?',
      options: ['စဝတ်ဒီ (Sawatdee)', 'ခေါ့ပ် ခွန်း (Khop khun)', 'ခေါဝ် ထုတ်တ် (Kho thot)', 'စဘိုင်း ဒီ (Sabai dee)'],
      correctAnswerIndex: 1,
      explanationMm: 'မှန်ကန်သောအဖြေမှာ "ခေါ့ပ် ခွန်း (ขอบคุณ)" ဖြစ်ပြီး ကျေးဇူးတင်ပါတယ်ဟု အဓိပ္ပာယ်ရသည်။'
    },
    summaryMm: 'ဒီနေ့သင်ခန်းစာမှာ စဝတ်ဒီ (မင်္ဂလာပါ)၊ ခေါ့ပ်ခွန်း (ကျေးဇူးတင်ပါတယ်)၊ ခေါဝ်ထုတ်တ် (တောင်းပန်ပါတယ်) တို့ကို အသံထွက်မှန်မှန် လေ့ကျင့်ပြီးပါပြီ။',
    tiktokCaption: 'ထိုင်းစကား အခြေခံ နှုတ်ဆက်စကား ၅ ခွန်းကို ထိုင်းလူမျိုးလို အသံထွက်ရအောင်! Save ထားပြီး နေ့တိုင်းလေ့ကျင့်ပါ 🇹🇭🇲🇲',
    hashtags: ['#Thai2Myanmar', '#ထိုင်းစကားပြော', '#LearnThai', '#MyanmarTikTok', '#TikTokJapan', '#ထိုင်းစာသင်ခန်းစာ'],
    culturalNoteMm: 'ထိုင်းနိုင်ငံတွင် နှုတ်ဆက်ရာတွင် "ဝိုင်း (Wai)" လက်အုပ်ချီ နှုတ်ဆက်ခြင်းသည် လေးစားမှုကို ဖော်ပြသည်။',
    scenes: [
      {
        sceneNumber: 1,
        title: 'Hook & Problem',
        type: 'hook',
        durationSec: 8,
        thaiText: 'สวัสดีครับ พูดให้เหมือนคนไทย!',
        romanText: 'Sawatdee khrap, phut hai muean khon thai!',
        myanmarPronounce: 'စဝတ်ဒီ ခပ်၊ ဖူးတ် ဟိုင်း မွန်း ခွန်း ထိုင်း!',
        myanmarMeaning: 'ထိုင်းစကား "မင်္ဂလာပါ" ကို ထိုင်းလူမျိုးစစ်စစ်လို အသံထွက်ကြမယ်!',
        teacherTipMm: 'ပထမ ၃ စက္ကန့်အတွင်း အသံထွက်လျှို့ဝှက်ချက်ကို မိတ်ဆက်ပါ',
        backgroundTheme: 'neon-tiktok',
        speakerTrack: 'thai'
      },
      {
        sceneNumber: 2,
        title: 'Core Vocabulary & Tones',
        type: 'vocab',
        durationSec: 18,
        thaiText: 'สวัสดี (Sawatdee) / ขอบคุณ (Khop Khun)',
        romanText: 'Sawatdee = မင်္ဂလာပါ | Khop khun = ကျေးဇူးတင်ပါတယ်',
        myanmarPronounce: 'စဝတ်ဒီ / ခေါ့ပ် ခွန်း (ယဉ်ကျေးသောအသံဖြင့် ဆိုပါ)',
        myanmarMeaning: 'အမျိုးသားဆိုလျှင် "ခပ်" ၊ အမျိုးသမီးဆိုလျှင် "ခါ" တွဲထည့်ပါ',
        teacherTipMm: 'ထိုင်းစာလုံးကြီးများနှင့် မြန်မာအသံထွက်ကို ရှင်းလင်းစွာပြပါ',
        backgroundTheme: 'bangkok-sunset',
        speakerTrack: 'duet'
      },
      {
        sceneNumber: 3,
        title: 'Daily Dialogue In Action',
        type: 'dialogue',
        durationSec: 16,
        thaiText: 'สบายดีไหมครับ? สบายดีค่ะ ขอบคุณค่ะ',
        romanText: 'Sabai dee mai khrap? - Sabai dee kha, khop khun kha!',
        myanmarPronounce: 'စဘိုင်း ဒီ မိုင်း ခပ်? - စဘိုင်း ဒီ ခါ၊ ခေါ့ပ် ခွန်း ခါ!',
        myanmarMeaning: 'နေကောင်းလားခင်ဗျာ? - နေကောင်းပါတယ်ရှင့်၊ ကျေးဇူးတင်ပါတယ်!',
        teacherTipMm: 'နှစ်ဦးစကားပြောဟန်ဖြင့် သရုပ်ပြပါ',
        backgroundTheme: 'minimal-dark',
        speakerTrack: 'duet'
      },
      {
        sceneNumber: 4,
        title: 'Quick Practice Quiz',
        type: 'quiz',
        durationSec: 12,
        thaiText: 'လေ့ကျင့်ခန်းစမ်းသပ်မှု ❓ "ကျေးဇူးတင်ပါတယ်" ကို ထိုင်းလို ဘယ်လိုပြောလဲ?',
        romanText: 'A: စဝတ်ဒီ | B: ခေါ့ပ် ခွန်း | C: ခေါဝ် ထုတ်တ်',
        myanmarPronounce: 'အဖြေမှန်ကို Comment မှာ ရေးခဲ့ပါ!',
        myanmarMeaning: 'အဖြေမှန်မှာ B: ခေါ့ပ် ခွန်း (ขอบคุณ) ဖြစ်ပါတယ်!',
        teacherTipMm: 'Comment engagement တက်စေရန် ဉာဏ်စမ်းပါဝင်သည်',
        backgroundTheme: 'tokyo-cyber',
        speakerTrack: 'myanmar'
      },
      {
        sceneNumber: 5,
        title: 'Outro & Call To Action',
        type: 'outro',
        durationSec: 10,
        thaiText: 'กดติดตามไว้เลย! เรียนภาษาไทยทุกวัน',
        romanText: 'Kod tit-tam wai loei! Rian phasa thai thuk wan',
        myanmarPronounce: 'နောက်ထပ် ထိုင်းစကားပြော သင်ခန်းစာများအတွက် Follow လုပ်ထားပါ',
        myanmarMeaning: 'ဗီဒီယိုကို Save ပြီး သူငယ်ချင်းတွေဆီ Share ပေးပါခင်ဗျာ!',
        teacherTipMm: 'Follow/Save/Share CTA',
        backgroundTheme: 'neon-tiktok',
        speakerTrack: 'myanmar'
      }
    ],
    status: 'Ready',
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
    renderedVideoId: 'job-seed-render-01',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    aiModelUsed: 'gemini-3.8-flash',
    tokenCount: 1420,
    estimatedCostUsd: 0.00021,
  },
  {
    id: 'lesson-seed-02',
    title: 'ထိုင်းဈေးဝယ်ရာတွင် ဈေးဆစ်တတ်စေမည့် မရှိမဖြစ် စကားပြောစကားစုများ',
    topic: 'Shopping and Bargaining in Thai Market',
    difficulty: 'Intermediate',
    targetDurationSec: 68,
    category: 'Shopping & Finance',
    objectiveMm: 'ထိုင်းဈေးတွင် ပစ္စည်းမေးခြင်း၊ ဈေးဆစ်ခြင်းနှင့် ငွေရှင်းခြင်းတို့ကို ရဲဝံ့စွာ ပြောဆိုနိုင်စေရန်။',
    hook: {
      hookThai: 'ลดได้ไหม? พูดคำนี้ยังไงให้ได้ราคาถูก!',
      hookRoman: 'Lot dai mai? Phut kham nee yang ngai hai dai rakha thuk!',
      hookMm: '"လျှော့ပေးလို့ရမလား" ကို ထိုင်းလို ဘယ်လိုပြောရင် ဈေးအမှန်တကယ် လျှော့ပေးသလဲ?',
      retentionAngle: 'Practical shopping money-saving hack.'
    },
    vocabulary: [
      {
        id: 'v21',
        thai: 'อันนี้เท่าไหร่',
        roman: 'An nee thao rai',
        myanmarPronounce: 'အန်းနီး ထောင်းရိုင်း',
        myanmarMeaning: 'ဒါ ဘယ်လောက်လဲ?',
        toneDescription: 'Falling - Mid - Low',
        usageTip: 'ပစ္စည်းလက်ညှိုးထိုးပြီး မေးရာတွင် အလွန်သုံးသည်။'
      },
      {
        id: 'v22',
        thai: 'ลดได้ไหม',
        roman: 'Lot dai mai',
        myanmarPronounce: 'လွတ်ဒ် လိုက် မိုင်း',
        myanmarMeaning: 'ဈေးလျှော့ပေးလို့ ရမလား?',
        toneDescription: 'High - Falling - Rising',
        usageTip: 'ချိုသာသောအပြုံးဖြင့် ပြောပါက ပိုမိုထိရောက်သည်။'
      },
      {
        id: 'v23',
        thai: 'แพงเกินไป',
        roman: 'Phaeng gern pai',
        myanmarPronounce: 'ဖဲန်း ဂန်း ပိုင်း',
        myanmarMeaning: 'ဈေး အရမ်းကြီးလွန်းတယ်',
        toneDescription: 'High - Mid - Mid',
        usageTip: 'ဈေးညှိရာတွင် သုံးသည်။'
      }
    ],
    dialogue: [
      {
        id: 'd21',
        speaker: 'A',
        speakerLabelMm: 'ဝယ်သူ',
        thai: 'พี่ครับ เสื้อตัวนี้เท่าไหร่ครับ',
        roman: 'Phee khrap, suea dtua nee thao rai khrap?',
        myanmarPronounce: 'ဖီး ခပ်၊ စွတ် ဒူဝါ နီး ထောင်းရိုင်း ခပ်?',
        myanmarMeaning: 'အစ်ကိုခင်ဗျာ၊ ဒီအင်္ကျီ ဘယ်လောက်လဲခင်ဗျာ?'
      },
      {
        id: 'd22',
        speaker: 'B',
        speakerLabelMm: 'ရောင်းသူ',
        thai: 'ตัวละสามร้อยบาทจ้า ลดได้สองร้อยห้าสิบนะ',
        roman: 'Dtua la sam roi baht ja, lot dai song roi ha sip na',
        myanmarPronounce: 'ဒူဝါ လ စန်း ရွိုင်း ဘတ်တ် ဂျာ၊ လွတ်ဒ် လိုက် ဆောင်း ရွိုင်း ဟား စစ်ပ် ဏ',
        myanmarMeaning: 'တစ်ထည် ၃၀၀ ဘတ်ပါရှင်၊ ၂၅၀ ထိ လျှော့ပေးနိုင်ပါတယ်နော်'
      }
    ],
    exercise: {
      questionMm: '"ဒါ ဘယ်လောက်လဲ" ကို ထိုင်းလို ဘယ်လိုမေးမလဲ?',
      options: ['စဝတ်ဒီ (Sawatdee)', 'အန်းနီး ထောင်းရိုင်း (An nee thao rai)', 'လွတ်ဒ် လိုက် မိုင်း (Lot dai mai)', 'ခေါ့ပ် ခွန်း (Khop khun)'],
      correctAnswerIndex: 1,
      explanationMm: '"อันนี้เท่าไหร่ (အန်းနီး ထောင်းရိုင်း)" သည် ပစ္စည်းဈေးနှုန်းမေးရာတွင် သုံးသော စကားစုဖြစ်သည်။'
    },
    summaryMm: 'ဒီနေ့မှာ အန်းနီးထောင်းရိုင်း (ဘယ်လောက်လဲ) နဲ့ လွတ်ဒ်လိုက်မိုင်း (လျှော့ပေးလို့ရမလား) ကို သေချာလေ့လာခဲ့ပါတယ်။',
    tiktokCaption: 'ထိုင်းဈေးမှာ ဈေးဆစ်ချင်ရင် ဒီစကားတွေကို အလွတ်ကျက်ထားပါ! 🇹🇭 ပိုက်ဆံအများကြီး သက်သာစေမယ်နော် ✨',
    hashtags: ['#Thai2Myanmar', '#ထိုင်းစကားပြော', '#BargainInThai', '#LearnThaiOnline', '#ထိုင်းနိုင်ငံ'],
    scenes: [
      {
        sceneNumber: 1,
        title: 'Hook - Shopping Secret',
        type: 'hook',
        durationSec: 7,
        thaiText: 'ลดได้ไหม? พูดคำนี้ยังไงให้แม่ค้าใจอ่อน!',
        romanText: 'Lot dai mai? Phut kham nee yang ngai hai mae-kha jai-on!',
        myanmarPronounce: 'ဈေးဝယ်တဲ့အခါ ဈေးလျှော့ရအောင် ဘယ်လိုပြောမလဲ?',
        myanmarMeaning: 'ဒီစကားစုကို သိရင် ထိုင်းဈေးမှာ ပိုက်ဆံအများကြီး သက်သာစေမယ်!',
        backgroundTheme: 'neon-tiktok',
        speakerTrack: 'thai'
      },
      {
        sceneNumber: 2,
        title: 'Vocabulary: Price & Bargaining',
        type: 'vocab',
        durationSec: 20,
        thaiText: 'อันนี้เท่าไหร่ (ဘယ်လောက်လဲ) / ลดได้ไหม (လျှော့ပေးမလား)',
        romanText: 'An nee thao rai / Lot dai mai na khrap',
        myanmarPronounce: 'အန်းနီး ထောင်းရိုင်း / လွတ်ဒ် လိုက် မိုင်း ဏ ခပ်',
        myanmarMeaning: 'ပစ္စည်းမေးခြင်းနှင့် ဈေးညှိနှိုင်းခြင်း အဓိကစကားစုများ',
        backgroundTheme: 'bangkok-sunset',
        speakerTrack: 'duet'
      },
      {
        sceneNumber: 3,
        title: 'Real Market Dialogue',
        type: 'dialogue',
        durationSec: 18,
        thaiText: 'เสื้อตัวนี้เท่าไหร่ครับ? สามร้อย ลดได้ไหม?',
        romanText: 'Suea dtua nee thao rai? Sam roi, lot dai mai?',
        myanmarPronounce: 'အင်္ကျီ ဘယ်လောက်လဲ? ၃၀၀ ဘတ်၊ လျှော့ပေးလို့ရမလား?',
        myanmarMeaning: 'ရောင်းသူနဲ့ ဝယ်သူ အပြန်အလှန် ဈေးဆစ်ပုံ နမူနာ',
        backgroundTheme: 'minimal-dark',
        speakerTrack: 'duet'
      },
      {
        sceneNumber: 4,
        title: 'Quiz Challenge',
        type: 'quiz',
        durationSec: 13,
        thaiText: 'မေးခွန်း- "ဈေးလျှော့ပေးလို့ရမလား" ကို ထိုင်းလို ဘယ်လိုခေါ်လဲ?',
        romanText: 'A: စဝတ်ဒီ | B: လွတ်ဒ် လိုက် မိုင်း | C: အန်းနီး ထောင်းရိုင်း',
        myanmarPronounce: 'အဖြေမှန် B ဖြစ်ကြောင်း မှတ်သားပါ',
        myanmarMeaning: 'မှန်ကန်သောအဖြေ B: လွတ်ဒ် လိုက် မိုင်း (ลดได้ไหม)',
        backgroundTheme: 'tokyo-cyber',
        speakerTrack: 'myanmar'
      },
      {
        sceneNumber: 5,
        title: 'Save & Share Outro',
        type: 'outro',
        durationSec: 10,
        thaiText: 'กดถูกใจและบันทึกไว้ดูย้อนหลัง!',
        romanText: 'Kod thuk-jai lae ban-thuek wai doo yon lang!',
        myanmarPronounce: 'Save လုပ်ထားပြီး လိုအပ်တဲ့အခါ ပြန်ကြည့်ပါနော်',
        myanmarMeaning: 'နောက်ထပ် ဈေးဝယ်စကားပြောတွေ သိချင်ရင် Follow လုပ်ထားပါခင်ဗျာ!',
        backgroundTheme: 'neon-tiktok',
        speakerTrack: 'myanmar'
      }
    ],
    status: 'Scheduled',
    voiceStyle: {
      thaiVoice: 'female-polite',
      myanmarVoice: 'female-clear',
      speed: 1.0,
    },
    subtitleStyle: {
      theme: 'bangkok-sunset',
      fontSize: 32,
      showRomanization: true,
      showMyanmarPhonetics: true,
    },
    scheduledTime: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date(Date.now() - 43200000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    aiModelUsed: 'gemini-3.8-flash',
    tokenCount: 1530,
    estimatedCostUsd: 0.00023,
  }
];

const seedJobs: ProductionJob[] = [
  {
    id: 'job-seed-render-01',
    lessonId: 'lesson-seed-01',
    lessonTitle: 'ထိုင်းရောက်စမှာ မဖြစ်မနေသိထားရမည့် အခြေခံနှုတ်ဆက်စကား (၅) ခွန်း',
    status: 'completed',
    progress: 100,
    currentStep: 'Render complete (1080x1920 9:16 Vertical MP4)',
    renderSettings: {
      resolution: '1080x1920',
      aspectRatio: '9:16',
      fps: 30,
      theme: 'neon-tiktok',
      includeMusic: true,
      musicTrack: 'lofi-thai-beats',
      audioSpeed: 1.0
    },
    durationSec: 64,
    videoUrl: '/api/production/video/job-seed-render-01',
    downloadFilename: 'Thai2Myanmar_Lesson_01_Greetings.mp4',
    fileSizeBytes: 14205800,
    startedAt: new Date(Date.now() - 7200000).toISOString(),
    completedAt: new Date(Date.now() - 7140000).toISOString(),
  }
];

const seedScheduledPosts: ScheduledPost[] = [
  {
    id: 'sched-01',
    lessonId: 'lesson-seed-02',
    lessonTitle: 'ထိုင်းဈေးဝယ်ရာတွင် ဈေးဆစ်တတ်စေမည့် မရှိမဖြစ် စကားပြောစကားစုများ',
    accountId: 'acc-tiktok-jp-1',
    accountHandle: '@thai2myanmar_jp',
    platform: 'tiktok',
    scheduledTime: new Date(Date.now() + 86400000).toISOString(),
    videoUrl: '/api/production/video/job-seed-render-01',
    caption: 'ထိုင်းဈေးမှာ ဈေးဆစ်ချင်ရင် ဒီစကားတွေကို အလွတ်ကျက်ထားပါ! 🇹🇭 ပိုက်ဆံအများကြီး သက်သာစေမယ်နော် ✨',
    hashtags: ['#Thai2Myanmar', '#ထိုင်းစကားပြော', '#BargainInThai', '#LearnThaiOnline', '#ထိုင်းနိုင်ငံ'],
    autoPublish: false,
    status: 'scheduled',
    checklist: {
      videoDownloaded: true,
      captionCopied: true,
      tagsCopied: true,
      soundVerified: true,
      manualUploadCompleted: false
    },
    createdAt: new Date().toISOString()
  }
];

const seedLogs: ActivityLog[] = [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    category: 'system',
    action: 'System Initialized',
    details: 'Thai2Myanmar Video Production Engine online. Connected to Gemini 3.8 Flash.',
    level: 'info'
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 7140000).toISOString(),
    category: 'video_render',
    action: 'Video Render Completed',
    details: 'Job job-seed-render-01 (Lesson 1: Greetings) completed. 64s, 1080x1920 9:16.',
    level: 'success'
  },
  {
    id: 'log-3',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    category: 'scheduler',
    action: 'Post Scheduled',
    details: 'Lesson 2 scheduled for TikTok Japan account @thai2myanmar_jp tomorrow.',
    level: 'info'
  }
];

class DatabaseManager {
  private db: DatabaseSchema | null = null;

  constructor() {
    this.ensureDatabase();
  }

  private ensureDatabase(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (!fs.existsSync(DB_FILE)) {
        const initialData: DatabaseSchema = {
          lessons: seedLessons,
          productionJobs: seedJobs,
          aiProviders: defaultAIProviders,
          publishingAccounts: defaultPublishingAccounts,
          scheduledPosts: seedScheduledPosts,
          settings: defaultSettings,
          activityLogs: seedLogs,
          metrics: {
            totalTokensUsed: 2950,
            totalCostUsd: 0.00044,
            lastResetDate: new Date().toISOString().split('T')[0]
          }
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
        this.db = initialData;
      } else {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.db = JSON.parse(raw);
      }
    } catch (err) {
      console.error('Failed to initialize local database:', err);
      // Fallback in-memory
      this.db = {
        lessons: seedLessons,
        productionJobs: seedJobs,
        aiProviders: defaultAIProviders,
        publishingAccounts: defaultPublishingAccounts,
        scheduledPosts: seedScheduledPosts,
        settings: defaultSettings,
        activityLogs: seedLogs,
        metrics: {
          totalTokensUsed: 2950,
          totalCostUsd: 0.00044,
          lastResetDate: new Date().toISOString().split('T')[0]
        }
      };
    }
  }

  private save(): void {
    if (!this.db) return;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.db, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save to database file:', err);
    }
  }

  public getDatabase(): DatabaseSchema {
    if (!this.db) this.ensureDatabase();
    return this.db!;
  }

  // --- Lessons ---
  public getLessons(): LessonScript[] {
    return this.getDatabase().lessons;
  }

  public getLessonById(id: string): LessonScript | undefined {
    return this.getDatabase().lessons.find(l => l.id === id);
  }

  public saveLesson(lesson: LessonScript): LessonScript {
    const db = this.getDatabase();
    const existingIndex = db.lessons.findIndex(l => l.id === lesson.id);
    lesson.updatedAt = new Date().toISOString();
    
    if (existingIndex >= 0) {
      db.lessons[existingIndex] = lesson;
    } else {
      if (!lesson.createdAt) lesson.createdAt = new Date().toISOString();
      db.lessons.unshift(lesson);
    }
    this.save();
    return lesson;
  }

  public deleteLesson(id: string): boolean {
    const db = this.getDatabase();
    const initialLen = db.lessons.length;
    db.lessons = db.lessons.filter(l => l.id !== id);
    if (db.lessons.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // --- Production Jobs ---
  public getJobs(): ProductionJob[] {
    return this.getDatabase().productionJobs;
  }

  public getJobById(id: string): ProductionJob | undefined {
    return this.getDatabase().productionJobs.find(j => j.id === id);
  }

  public saveJob(job: ProductionJob): ProductionJob {
    const db = this.getDatabase();
    const idx = db.productionJobs.findIndex(j => j.id === job.id);
    if (idx >= 0) {
      db.productionJobs[idx] = job;
    } else {
      db.productionJobs.unshift(job);
    }
    this.save();
    return job;
  }

  // --- AI Providers ---
  public getAIProviders(): AIProviderConfig[] {
    return this.getDatabase().aiProviders;
  }

  public updateAIProvider(id: string, updates: Partial<AIProviderConfig>): AIProviderConfig | null {
    const db = this.getDatabase();
    const provider = db.aiProviders.find(p => p.id === id);
    if (!provider) return null;
    Object.assign(provider, updates);
    this.save();
    return provider;
  }

  // --- Publishing Accounts ---
  public getPublishingAccounts(): PublishingAccount[] {
    return this.getDatabase().publishingAccounts;
  }

  public updatePublishingAccount(id: string, updates: Partial<PublishingAccount>): PublishingAccount | null {
    const db = this.getDatabase();
    const acc = db.publishingAccounts.find(a => a.id === id);
    if (!acc) return null;
    Object.assign(acc, updates);
    this.save();
    return acc;
  }

  // --- Scheduled Posts ---
  public getScheduledPosts(): ScheduledPost[] {
    return this.getDatabase().scheduledPosts;
  }

  public saveScheduledPost(post: ScheduledPost): ScheduledPost {
    const db = this.getDatabase();
    const idx = db.scheduledPosts.findIndex(p => p.id === post.id);
    if (idx >= 0) {
      db.scheduledPosts[idx] = post;
    } else {
      db.scheduledPosts.unshift(post);
    }
    this.save();
    return post;
  }

  // --- Settings ---
  public getSettings(): SystemSettings {
    return this.getDatabase().settings;
  }

  public updateSettings(settings: Partial<SystemSettings>): SystemSettings {
    const db = this.getDatabase();
    db.settings = { ...db.settings, ...settings };
    this.save();
    return db.settings;
  }

  // --- Activity Logs ---
  public getLogs(limit = 100): ActivityLog[] {
    return this.getDatabase().activityLogs.slice(0, limit);
  }

  public addLog(log: Omit<ActivityLog, 'id' | 'timestamp'>): ActivityLog {
    const db = this.getDatabase();
    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...log
    };
    db.activityLogs.unshift(newLog);
    if (db.activityLogs.length > 300) {
      db.activityLogs = db.activityLogs.slice(0, 300);
    }
    this.save();
    return newLog;
  }

  // --- Metrics ---
  public recordUsage(tokens: number, estimatedCostUsd: number): void {
    const db = this.getDatabase();
    db.metrics.totalTokensUsed += tokens;
    db.metrics.totalCostUsd += estimatedCostUsd;
    this.save();
  }
}

export const dbManager = new DatabaseManager();
