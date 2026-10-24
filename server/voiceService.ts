import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const AUDIO_DIR = path.join(DATA_DIR, 'audio');

if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export interface VoiceGenerationRequest {
  text: string;
  language: 'th-TH' | 'my-MM';
  voiceStyle?: string;
  speed?: number;
  allowPreviewFallback?: boolean;
}

export interface VoiceGenerationResult {
  audioBase64: string | null;
  mimeType: string;
  durationSec: number;
  engineUsed: string;
  isRealGenerated: boolean;
  audioFilePath?: string;
  error?: string | null;
}

export class VoiceService {
  private hasKey(): boolean {
    return Boolean(
      process.env.GEMINI_API_KEY && 
      process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY' &&
      process.env.GEMINI_API_KEY.length > 5
    );
  }

  /**
   * Generates genuine speech audio for Thai or Myanmar text using configured Gemini 3.8 Flash Lite TTS.
   * Never silently substitutes beeps as real narration.
   */
  async generateSpeech(params: VoiceGenerationRequest): Promise<VoiceGenerationResult> {
    const text = (params.text || '').trim();
    if (!text) {
      throw new Error('Text parameter is required for voice generation.');
    }

    const charCount = text.length;
    const estimatedDuration = Math.max(1.8, Math.min(25.0, charCount * 0.14));

    // 1. Try configured Google Gemini 3.8 Flash Lite TTS
    if (this.hasKey()) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash-lite-tts',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: text,
                  speechMetadata: {
                    style: params.language === 'th-TH' 
                      ? 'Authentic, clear native Thai speaker, polite tone with exact vowel lengths' 
                      : 'Encouraging, articulate native Burmese language teacher',
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: params.language === 'th-TH' ? 'Zephyr' : 'Kore',
                },
              },
            },
          },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
          const buffer = Buffer.from(base64Audio, 'base64');
          const hash = crypto.createHash('md5').update(text + params.language).digest('hex');
          const audioFilePath = path.join(AUDIO_DIR, `${hash}.wav`);
          fs.writeFileSync(audioFilePath, buffer);

          return {
            audioBase64: base64Audio,
            mimeType: 'audio/wav',
            durationSec: estimatedDuration,
            engineUsed: 'gemini-3.8-flash-lite-tts',
            isRealGenerated: true,
            audioFilePath,
            error: null,
          };
        }
      } catch (err: any) {
        console.warn('Gemini 3.8 Flash Lite TTS call failed:', err?.message || err);
        return {
          audioBase64: null,
          mimeType: 'audio/wav',
          durationSec: estimatedDuration,
          engineUsed: 'failed',
          isRealGenerated: false,
          error: `Gemini TTS API error: ${err.message || 'API request failed'}. Please verify quota and attached GEMINI_API_KEY.`,
        };
      }
    }

    // 2. If API Key is missing: Return explicit failure status
    // NEVER fake it or pretend beeps are successful voice narration!
    return {
      audioBase64: null,
      mimeType: 'audio/wav',
      durationSec: estimatedDuration,
      engineUsed: 'unconfigured',
      isRealGenerated: false,
      error: 'GEMINI_API_KEY is not configured on the server. Please attach a valid Gemini API key in AI Studio Secrets to generate real voice tracks.',
    };
  }
}

export const voiceService = new VoiceService();
