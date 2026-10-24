import { GoogleGenAI } from '@google/genai';
import { LessonScript, DifficultyLevel, VideoScene } from '../src/types/index.ts';

// Server-side initialization following @google/genai guidelines
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export interface GenerateLessonParams {
  topic: string;
  difficulty: DifficultyLevel;
  targetDurationSec?: number;
  category?: string;
  focusTone?: string;
  customInstructions?: string;
}

export class GeminiService {
  private hasKey(): boolean {
    return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
  }

  /**
   * Generates a complete, structured Thai-to-Myanmar lesson optimized for TikTok vertical video.
   */
  async generateLesson(params: GenerateLessonParams): Promise<{ lesson: Partial<LessonScript>; tokensUsed: number; costUsd: number }> {
    const targetDuration = params.targetDurationSec || 65; // Default 65s for TikTok Creator Rewards
    const difficulty = params.difficulty || 'Beginner';
    const topic = params.topic || 'Essential Daily Conversation';

    if (!this.hasKey()) {
      throw new Error('GEMINI_API_KEY is not configured on the server. Please ensure your API key is attached in the AI Studio environment.');
    }

    const systemPrompt = `You are a Master Bilingual Thai-Myanmar Language Teacher, Pedagogical Linguist, and TikTok Content Production Specialist.
Your mission is to craft highly engaging, linguistically accurate Thai language learning scripts designed for Myanmar learners and Burmese expatriates (including those living in Thailand or Japan).

Requirements:
1. Thai Script: Must be authentic, modern Thai spelling (e.g. สวัสดี, ขอบคุณ, อันนี้เท่าไหร่).
2. Romanization: Standard clear phonetic transcription (Paiboon / RTGS style).
3. Burmese Pronunciation (မြန်မာအသံထွက်): Accurate Burmese phonetic transcription with tones and stop consonants (e.g. ครับ -> "ခပ် / ခရတ်ပ်", ค่ะ -> "ခါ", ขอบคุณ -> "ခေါ့ပ်-ခွန်း", เท่าไหร่ -> "ထောင်း-ရိုင်း").
4. Burmese Translation (မြန်မာဘာသာပြန်): Natural, everyday Myanmar language.
5. High-Retention TikTok Hook: Designed to grab viewer attention in the first 3 seconds (addressing common mispronunciations, cultural nuances, or practical survival hacks).
6. Total video duration must be between 60 to 75 seconds to qualify for TikTok Creator Rewards Program.
7. Break into exactly 5 Scenes for 9:16 vertical video production:
   - Scene 1: Hook & Viral Problem (7-10s)
   - Scene 2: Core Vocabulary & Tones (18-22s)
   - Scene 3: Realistic Everyday Dialogue (16-20s)
   - Scene 4: Quick Interactive Practice Quiz (10-14s)
   - Scene 5: Outro & Call To Action (Follow / Save) (8-10s)

Output strictly valid JSON matching this structure:
{
  "title": "Short catchy Myanmar title",
  "topic": "${topic}",
  "difficulty": "${difficulty}",
  "targetDurationSec": ${targetDuration},
  "category": "${params.category || 'Daily Conversation'}",
  "objectiveMm": "Clear objective in Myanmar",
  "hook": {
    "hookThai": "Thai hook line",
    "hookRoman": "Romanized hook",
    "hookMm": "Catchy Myanmar hook for TikTok",
    "retentionAngle": "Why this hook works"
  },
  "vocabulary": [
    {
      "thai": "...",
      "roman": "...",
      "myanmarPronounce": "...",
      "myanmarMeaning": "...",
      "toneDescription": "Low/Mid/High/Falling/Rising",
      "usageTip": "Usage tip in Myanmar"
    }
  ],
  "dialogue": [
    {
      "speaker": "A",
      "speakerLabelMm": "လူပုဂ္ဂိုလ် (က)",
      "thai": "...",
      "roman": "...",
      "myanmarPronounce": "...",
      "myanmarMeaning": "..."
    },
    {
      "speaker": "B",
      "speakerLabelMm": "လူပုဂ္ဂိုလ် (ခ)",
      "thai": "...",
      "roman": "...",
      "myanmarPronounce": "...",
      "myanmarMeaning": "..."
    }
  ],
  "exercise": {
    "questionMm": "Myanmar quiz question",
    "questionThai": "Optional Thai question",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correctAnswerIndex": 0,
    "explanationMm": "Why this answer is correct in Myanmar"
  },
  "summaryMm": "Brief wrap-up in Myanmar",
  "tiktokCaption": "Engaging TikTok caption with emojis and call to action",
  "hashtags": ["#Thai2Myanmar", "#ထိုင်းစကားပြော", "#LearnThai", "#MyanmarInJapan", "#TikTokUni"],
  "culturalNoteMm": "Cultural etiquette or grammar secret in Myanmar",
  "scenes": [
    {
      "sceneNumber": 1,
      "title": "Hook & Viral Problem",
      "type": "hook",
      "durationSec": 9,
      "thaiText": "...",
      "romanText": "...",
      "myanmarPronounce": "...",
      "myanmarMeaning": "...",
      "teacherTipMm": "...",
      "backgroundTheme": "neon-tiktok",
      "speakerTrack": "thai"
    },
    {
      "sceneNumber": 2,
      "title": "Core Vocabulary & Pronunciation",
      "type": "vocab",
      "durationSec": 20,
      "thaiText": "...",
      "romanText": "...",
      "myanmarPronounce": "...",
      "myanmarMeaning": "...",
      "teacherTipMm": "...",
      "backgroundTheme": "bangkok-sunset",
      "speakerTrack": "duet"
    },
    {
      "sceneNumber": 3,
      "title": "Real Context Dialogue",
      "type": "dialogue",
      "durationSec": 18,
      "thaiText": "...",
      "romanText": "...",
      "myanmarPronounce": "...",
      "myanmarMeaning": "...",
      "teacherTipMm": "...",
      "backgroundTheme": "minimal-dark",
      "speakerTrack": "duet"
    },
    {
      "sceneNumber": 4,
      "title": "Interactive Practice Quiz",
      "type": "quiz",
      "durationSec": 12,
      "thaiText": "...",
      "romanText": "...",
      "myanmarPronounce": "...",
      "myanmarMeaning": "...",
      "teacherTipMm": "...",
      "backgroundTheme": "tokyo-cyber",
      "speakerTrack": "myanmar"
    },
    {
      "sceneNumber": 5,
      "title": "Outro & Engagement CTA",
      "type": "outro",
      "durationSec": 9,
      "thaiText": "...",
      "romanText": "...",
      "myanmarPronounce": "...",
      "myanmarMeaning": "...",
      "teacherTipMm": "...",
      "backgroundTheme": "neon-tiktok",
      "speakerTrack": "myanmar"
    }
  ]
}`;

    const userPrompt = `Create a Thai language lesson on the topic: "${topic}".
Difficulty Level: ${difficulty}
Target Video Duration: ${targetDuration} seconds
${params.customInstructions ? `Additional User Instructions: ${params.customInstructions}` : ''}
Provide exact, high-accuracy Burmese phonetics (မြန်မာအသံထွက်) so Burmese learners can speak native-like Thai.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const rawText = response.text || '{}';
      const parsedData = JSON.parse(rawText);

      // Add unique IDs to vocabulary and dialogue items if missing
      if (Array.isArray(parsedData.vocabulary)) {
        parsedData.vocabulary = parsedData.vocabulary.map((v: any, i: number) => ({
          id: v.id || `v-${Date.now()}-${i}`,
          ...v,
        }));
      }
      if (Array.isArray(parsedData.dialogue)) {
        parsedData.dialogue = parsedData.dialogue.map((d: any, i: number) => ({
          id: d.id || `d-${Date.now()}-${i}`,
          ...d,
        }));
      }

      // Calculate approximate token usage and cost for Gemini 3.8 Flash ($0.15 per 1M tokens)
      const estimatedTokens = Math.round((systemPrompt.length + userPrompt.length + rawText.length) / 3.8);
      const costUsd = (estimatedTokens / 1000) * 0.00015;

      return {
        lesson: parsedData,
        tokensUsed: estimatedTokens,
        costUsd,
      };
    } catch (err: any) {
      console.error('Gemini API lesson generation error:', err);
      throw new Error(`Failed to generate lesson via Gemini API: ${err.message || String(err)}`);
    }
  }

  /**
   * Rewrites an individual section of a lesson using Gemini.
   */
  async rewriteSection(
    lesson: LessonScript,
    section: 'hook' | 'vocabulary' | 'dialogue' | 'exercise' | 'tiktokCaption' | 'scenes',
    instruction: string
  ): Promise<{ updatedData: any; tokensUsed: number; costUsd: number }> {
    if (!this.hasKey()) {
      throw new Error('GEMINI_API_KEY is not configured on the server.');
    }

    const prompt = `You are editing a specific section of a Thai2Myanmar lesson script.
Lesson Title: "${lesson.title}"
Topic: "${lesson.topic}"
Difficulty: "${lesson.difficulty}"
Section to rewrite: "${section}"
Current Section Content: ${JSON.stringify((lesson as any)[section] || {})}
User Instruction for this rewrite: "${instruction}"

Return ONLY valid JSON with the rewritten data for this section matching the original schema of "${section}".
Ensure Burmese phonetic accuracy (မြန်မာအသံထွက်) and tone descriptions.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const rawText = response.text || '{}';
      const updatedData = JSON.parse(rawText);
      const estimatedTokens = Math.round((prompt.length + rawText.length) / 3.8);
      const costUsd = (estimatedTokens / 1000) * 0.00015;

      return { updatedData, tokensUsed: estimatedTokens, costUsd };
    } catch (err: any) {
      console.error('Gemini API section rewrite error:', err);
      throw new Error(`Failed to rewrite section: ${err.message || String(err)}`);
    }
  }
}

export const geminiService = new GeminiService();
