import { GoogleGenAI } from '@google/genai';
import { LessonScript, DifficultyLevel, VideoScene } from '../src/types/index.ts';

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
    return Boolean(
      process.env.GEMINI_API_KEY && 
      process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY' &&
      process.env.GEMINI_API_KEY.length > 5
    );
  }

  /**
   * Generates a complete, structured Thai-to-Myanmar lesson with strict pedagogical accuracy.
   */
  async generateLesson(params: GenerateLessonParams): Promise<{ lesson: Partial<LessonScript>; tokensUsed: number; costUsd: number }> {
    const targetDuration = params.targetDurationSec || 65; // Minimum 60s for TikTok Creator Rewards
    const difficulty = params.difficulty || 'Beginner';
    const topic = params.topic || 'Essential Daily Conversation';

    if (!this.hasKey()) {
      throw new Error('GEMINI_API_KEY is not configured on the server. Please attach a valid API key in AI Studio secrets.');
    }

    const systemPrompt = `You are a Master Bilingual Thai-Burmese Pedagogical Linguist and Viral TikTok Content Architect.
Your mission is to produce original, high-accuracy Thai language learning video scripts specifically designed for Burmese-speaking learners, expatriates in Thailand, and Myanmar workers in Japan.

CRITICAL PEDAGOGICAL LINGUISTIC RULES:
1. Authentic Thai Script: Must use correct modern Thai spelling and vowel placement (e.g., สวัสดี, ขอบคุณ, อันนี้เท่าไหร่, ช่วยด้วย).
2. Phonetic Romanization: Use consistent Paiboon/RTGS style with tone marks.
3. Burmese Pronunciation Guide (မြန်မာအသံထွက်):
   - Transcribe accurately using Burmese consonants, vowels, and final stop consonants (-k က်, -t တ်/ဒ်, -p ပ်, -m မ်, -n န်, -ng င်).
   - Tone distinctions MUST be described clearly:
     * Mid tone (ဖြောင့်သံ - e.g., စဝတ်ဒီ)
     * Low tone (အောက်စိုက်သံ - e.g., ခေါ့ပ်)
     * Falling tone (မြင့်ကျသံ - e.g., လွတ်ဒ်, နီး)
     * High tone (မြင့်သံ - e.g., ရူး)
     * Rising tone (နိမ့်တက်သံ - e.g., မိုင်း, ခေါဝ်)
   - Explain polite particles: အမျိုးသားသုံး (ครับ - ခပ်/ခရတ်ပ်) vs အမျိုးသမီးသုံး (ค่ะ/คะ - ခါ/ခ)။
4. Burmese Translation (မြန်မာဘာသာပြန်): Natural, respectful everyday Myanmar language.
5. 3-Second Viral Hook: First 3 seconds must arrest TikTok viewers' attention by spotlighting an embarrassing pronunciation mistake, a shopping bargain secret, or an essential survival phrase.
6. Target Duration: Total video duration MUST BE between 60 and 75 seconds (meeting the >60s requirement for TikTok Creator Rewards).
7. Break into EXACTLY 5 Scenes for 9:16 Vertical Video:
   - Scene 1: Hook & Problem (7-10s)
   - Scene 2: Core Vocabulary & Phonetic Tones (18-22s)
   - Scene 3: Everyday Real-life Dialogue (16-20s)
   - Scene 4: Interactive Quiz & Engagement (10-14s)
   - Scene 5: Outro & Call-To-Action (Follow & Save) (8-10s)

Output strictly valid JSON matching this schema:
{
  "title": "Clear catchy Myanmar title (မြန်မာခေါင်းစဉ်)",
  "topic": "${topic}",
  "difficulty": "${difficulty}",
  "targetDurationSec": ${targetDuration},
  "category": "${params.category || 'Daily Conversation'}",
  "objectiveMm": "Clear educational objective in Myanmar",
  "hook": {
    "hookThai": "Authentic Thai hook line",
    "hookRoman": "Romanized hook",
    "hookMm": "Catchy Burmese hook for TikTok",
    "retentionAngle": "Why this hook stops the scroll"
  },
  "vocabulary": [
    {
      "thai": "...",
      "roman": "...",
      "myanmarPronounce": "...",
      "myanmarMeaning": "...",
      "toneDescription": "Low / Mid / High / Falling / Rising tone",
      "usageTip": "Usage tip & polite particles in Myanmar"
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
    "questionMm": "Burmese quiz question",
    "questionThai": "Optional Thai question",
    "options": ["A: ...", "B: ...", "C: ...", "D: ..."],
    "correctAnswerIndex": 0,
    "explanationMm": "Why this answer is correct in Burmese"
  },
  "summaryMm": "Summary in Myanmar",
  "tiktokCaption": "Viral TikTok caption with emojis and call to action",
  "hashtags": ["#Thai2Myanmar", "#ထိုင်းစကားပြော", "#LearnThai", "#TikTokJapan", "#MyanmarInJapan"],
  "culturalNoteMm": "Cultural etiquette or grammar nuance in Myanmar",
  "scenes": [
    {
      "sceneNumber": 1,
      "title": "Viral Hook",
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
      "title": "Real Dialogue in Action",
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
      "title": "Interactive Quiz Challenge",
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
      "title": "Outro & Call To Action",
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

    const userPrompt = `Generate an authentic Thai lesson on topic: "${topic}".
Difficulty: ${difficulty}
Target Video Duration: ${targetDuration} seconds (Ensure scene durations sum to at least 65s).
${params.customInstructions ? `Custom User Instructions: ${params.customInstructions}` : ''}
Provide exact Burmese phonetic notation (မြန်မာအသံထွက်) with tone nuances.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
        },
      });

      const rawText = response.text || '{}';
      const parsedData = JSON.parse(rawText);

      // Add unique IDs
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

      // Ensure total scene duration meets TikTok Creator Rewards >60s
      if (Array.isArray(parsedData.scenes)) {
        const sumDuration = parsedData.scenes.reduce((acc: number, s: any) => acc + (s.durationSec || 12), 0);
        if (sumDuration < 60) {
          const factor = 65 / sumDuration;
          parsedData.scenes.forEach((s: any) => s.durationSec = Math.round((s.durationSec || 12) * factor));
        }
      }

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

    const prompt = `You are rewriting a specific section of a Thai2Myanmar lesson script.
Lesson Title: "${lesson.title}"
Topic: "${lesson.topic}"
Difficulty: "${lesson.difficulty}"
Section to rewrite: "${section}"
Current Section Content: ${JSON.stringify((lesson as any)[section] || {})}
User Instruction for this rewrite: "${instruction}"

Return ONLY valid JSON with the rewritten data for this section matching the original schema of "${section}".
Ensure authentic Thai spelling and high-accuracy Burmese phonetics (မြန်မာအသံထွက်).`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
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
  /** Translate Thai/Burmese text using the configured server-side Gemini provider. */
  async translateText(text: string, sourceLanguage: 'th' | 'my', targetLanguage: 'th' | 'my'): Promise<string> {
    if (!this.hasKey()) throw new Error('GEMINI_API_KEY is not configured on the server.');
    const sourceName = sourceLanguage === 'th' ? 'Thai' : 'Burmese';
    const targetName = targetLanguage === 'th' ? 'Thai' : 'Burmese';
    const prompt = `Translate the following ${sourceName} text into natural, accurate ${targetName}. Preserve meaning, tone, names, and formatting. Return only the translation, without explanations unless needed to disambiguate.\n\nText:\n${text}`;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: { temperature: 0.2 },
      });
      const result = (response.text || '').trim();
      if (!result) throw new Error('Gemini returned an empty translation.');
      return result;
    } catch (err: any) {
      throw new Error(`Translation failed: ${err?.message || String(err)}`);
    }
  }

  /** General-purpose assistant response using the configured server-side Gemini provider. */
  async chat(message: string): Promise<string> {
    if (!this.hasKey()) throw new Error('GEMINI_API_KEY is not configured on the server.');
    const prompt = `You are the Thai2Myanmar AI Studio assistant. Help the user with Thai-Burmese language work and practical AI Studio workflows. Be honest about current capabilities; never claim you executed an action unless a tool actually did it. Respond in the language used by the user when practical.\n\nUser message:\n${message}`;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: { temperature: 0.5 },
      });
      const result = (response.text || '').trim();
      if (!result) throw new Error('Gemini returned an empty response.');
      return result;
    } catch (err: any) {
      throw new Error(`AI chat failed: ${err?.message || String(err)}`);
    }
  }

}

export const geminiService = new GeminiService();
