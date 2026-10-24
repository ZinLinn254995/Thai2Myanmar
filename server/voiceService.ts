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

function detectAudioFormat(buffer: Buffer): { mimeType: string; ext: string } {
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WAVE') {
    return { mimeType: 'audio/wav', ext: 'wav' };
  }
  if (buffer.length >= 3 && (buffer.toString('ascii', 0, 3) === 'ID3' || (buffer[0] === 0xFF && (buffer[1] & 0xE0) === 0xE0))) {
    return { mimeType: 'audio/mpeg', ext: 'mp3' };
  }
  if (buffer.length >= 8 && buffer.toString('ascii', 4, 8) === 'ftyp') {
    return { mimeType: 'audio/mp4', ext: 'm4a' };
  }
  if (buffer.length >= 4 && buffer.toString('ascii', 0, 4) === 'OggS') {
    return { mimeType: 'audio/ogg', ext: 'ogg' };
  }
  return { mimeType: 'audio/wav', ext: 'wav' };
}

export class VoiceService {
  public hasKey(): boolean {
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
          const { mimeType, ext } = detectAudioFormat(buffer);
          const hash = crypto.createHash('md5').update(text + params.language).digest('hex');
          const audioFilePath = path.join(AUDIO_DIR, `${hash}.${ext}`);
          fs.writeFileSync(audioFilePath, buffer);

          return {
            audioBase64: base64Audio,
            mimeType,
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
          mimeType: '',
          durationSec: 0,
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
      mimeType: '',
      durationSec: 0,
      engineUsed: 'unconfigured',
      isRealGenerated: false,
      error: 'GEMINI_API_KEY is not configured on the server. Please attach a valid Gemini API key in AI Studio Secrets to generate real voice tracks.',
    };
  }

  /**
   * Diagnostic test for speech synthesis capability
   */
  async testSpeechEngine(language: 'th-TH' | 'my-MM' = 'th-TH'): Promise<{
    hasApiKey: boolean;
    success: boolean;
    mimeType?: string;
    engineUsed: string;
    error?: string;
  }> {
    if (!this.hasKey()) {
      return {
        hasApiKey: false,
        success: false,
        engineUsed: 'unconfigured',
        error: 'No active GEMINI_API_KEY detected in server environment.',
      };
    }

    const testPhrase = language === 'th-TH' ? 'สวัสดีครับ' : 'မင်္ဂလာပါ';
    try {
      const result = await this.generateSpeech({ text: testPhrase, language });
      return {
        hasApiKey: true,
        success: result.isRealGenerated,
        mimeType: result.mimeType,
        engineUsed: result.engineUsed,
        error: result.error || undefined,
      };
    } catch (err: any) {
      return {
        hasApiKey: true,
        success: false,
        engineUsed: 'failed',
        error: err.message,
      };
    }
  }
}

export const voiceService = new VoiceService();
