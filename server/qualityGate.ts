import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { LessonScript } from '../src/types/index.ts';
import { sqliteDb, QualityAuditRecord } from './db.ts';

const execAsync = promisify(exec);

export interface VideoProbeResult {
  valid: boolean;
  durationSec: number;
  width: number;
  height: number;
  hasAudio: boolean;
  videoCodec: string;
  audioCodec: string;
  fileSizeBytes: number;
  error?: string;
}

export class QualityGate {
  /**
   * Probe an actual MP4 video file using ffprobe
   */
  async probeVideoFile(filePath: string): Promise<VideoProbeResult> {
    if (!fs.existsSync(filePath)) {
      return {
        valid: false,
        durationSec: 0,
        width: 0,
        height: 0,
        hasAudio: false,
        videoCodec: 'none',
        audioCodec: 'none',
        fileSizeBytes: 0,
        error: `File not found at ${filePath}`,
      };
    }

    const stats = fs.statSync(filePath);
    if (stats.size < 50000) { // < 50KB is suspiciously small for a full video
      return {
        valid: false,
        durationSec: 0,
        width: 0,
        height: 0,
        hasAudio: false,
        videoCodec: 'unknown',
        audioCodec: 'unknown',
        fileSizeBytes: stats.size,
        error: `File size too small (${stats.size} bytes). Video encoding may have failed.`,
      };
    }

    try {
      const { stdout } = await execAsync(
        `ffprobe -v error -show_entries format=duration,size:stream=codec_type,codec_name,width,height -of json "${filePath}"`
      );
      const parsed = JSON.parse(stdout);

      const duration = parseFloat(parsed.format?.duration || '0');
      const videoStream = parsed.streams?.find((s: any) => s.codec_type === 'video');
      const audioStream = parsed.streams?.find((s: any) => s.codec_type === 'audio');

      const width = videoStream?.width || 0;
      const height = videoStream?.height || 0;
      const videoCodec = videoStream?.codec_name || 'none';
      const audioCodec = audioStream?.codec_name || 'none';

      const valid = Boolean(
        videoStream && 
        width > 0 && 
        height > 0 && 
        duration > 0
      );

      return {
        valid,
        durationSec: duration,
        width,
        height,
        hasAudio: Boolean(audioStream),
        videoCodec,
        audioCodec,
        fileSizeBytes: stats.size,
      };
    } catch (err: any) {
      return {
        valid: false,
        durationSec: 0,
        width: 0,
        height: 0,
        hasAudio: false,
        videoCodec: 'unknown',
        audioCodec: 'unknown',
        fileSizeBytes: stats.size,
        error: `ffprobe failed: ${err.message}`,
      };
    }
  }

  /**
   * Run comprehensive pedagogical, linguistic, and media quality checks
   */
  async auditLesson(lesson: LessonScript, videoFilePath?: string): Promise<QualityAuditRecord> {
    const recommendations: string[] = [];
    let score = 100;

    // 1. Duration Check for TikTok Creator Rewards (>60 seconds)
    const targetDuration = lesson.targetDurationSec || 65;
    const durationOver60s = targetDuration >= 60;
    if (!durationOver60s) {
      score -= 20;
      recommendations.push(
        'Duration is under 60 seconds. TikTok Creator Rewards Program requires videos > 60 seconds (ကြာချိန် ၆၀ စက္ကန့်အထက် လိုအပ်သည်).'
      );
    }

    // 2. Thai Script Validation (must contain Thai Unicode characters U+0E00..U+0E7F)
    const thaiRegex = /[\u0E00-\u0E7F]/;
    const hasThaiInVocab = (lesson.vocabulary || []).every(v => thaiRegex.test(v.thai));
    const hasThaiInDialogue = (lesson.dialogue || []).length > 0 && (lesson.dialogue || []).every(d => thaiRegex.test(d.thai));
    const thaiScriptValid = Boolean(hasThaiInVocab && (lesson.dialogue.length === 0 || hasThaiInDialogue));
    if (!thaiScriptValid) {
      score -= 20;
      recommendations.push(
        'Missing authentic Thai characters in vocabulary or dialogue (ထိုင်းစာလုံးများ မှန်ကန်စွာ မပါဝင်ပါ).'
      );
    }

    // 3. Burmese Pronunciation Guide completeness
    const burmesePronunciationPresent = (lesson.vocabulary || []).every(
      v => v.myanmarPronounce && v.myanmarPronounce.trim().length > 0
    );
    if (!burmesePronunciationPresent) {
      score -= 20;
      recommendations.push(
        'Some vocabulary items lack Burmese pronunciation phonetics (မြန်မာအသံထွက် ညွှန်ပြချက် မပြည့်စုံပါ).'
      );
    }

    // 4. Burmese Translation completeness
    const burmeseTranslationPresent = (lesson.vocabulary || []).every(
      v => v.myanmarMeaning && v.myanmarMeaning.trim().length > 0
    );
    if (!burmeseTranslationPresent) {
      score -= 15;
      recommendations.push(
        'Some vocabulary items lack Burmese translation (မြန်မာဘာသာပြန် မပြည့်စုံပါ).'
      );
    }

    // 5. 3-Second Viral Hook Check
    const viralHookPresent = Boolean(
      lesson.hook &&
      lesson.hook.hookThai &&
      lesson.hook.hookMm &&
      lesson.hook.retentionAngle
    );
    if (!viralHookPresent) {
      score -= 10;
      recommendations.push(
        'Lesson lacks a complete 3-second viral hook with retention angle (3-Second Viral Hook မပြည့်စုံပါ).'
      );
    }

    // 6. Interactive Quiz Check
    const quizInteractive = Boolean(
      lesson.exercise &&
      lesson.exercise.questionMm &&
      lesson.exercise.options &&
      lesson.exercise.options.length >= 2 &&
      lesson.exercise.correctAnswerIndex !== undefined
    );
    if (!quizInteractive) {
      score -= 10;
      recommendations.push(
        'Interactive quiz challenge is missing or incomplete (လေ့ကျင့်ခန်း ဉာဏ်စမ်း မပြည့်စုံပါ).'
      );
    }

    // 7. Repetition & Duplicate Check against existing lessons
    const allLessons = sqliteDb.getLessons();
    const existingVocab = new Set<string>();
    for (const l of allLessons) {
      if (l.id !== lesson.id && l.vocabulary) {
        for (const v of l.vocabulary) {
          existingVocab.add(v.thai.trim());
        }
      }
    }
    const currentVocab = (lesson.vocabulary || []).map(v => v.thai.trim());
    const duplicateCount = currentVocab.filter(v => existingVocab.has(v)).length;
    const repetitionDetected = currentVocab.length > 0 && duplicateCount === currentVocab.length;
    if (repetitionDetected) {
      score -= 15;
      recommendations.push(
        'All vocabulary items duplicate previously created lessons. Diversify topics (ယခင်သင်ခန်းစာများနှင့် စကားလုံးများ ထပ်နေပါသည်).'
      );
    }

    // 8. Video Media Integrity Check (if video file path is provided or exists)
    let videoIntegrityVerified = false;
    if (videoFilePath && fs.existsSync(videoFilePath)) {
      const probe = await this.probeVideoFile(videoFilePath);
      if (probe.valid) {
        videoIntegrityVerified = true;
        // Verify vertical 9:16 aspect ratio
        if (probe.height < probe.width) {
          score -= 15;
          recommendations.push(
            'Rendered video is horizontal, not vertical 9:16 (ဒေါင်လိုက် 9:16 မဟုတ်ဘဲ အလျားလိုက် ဖြစ်နေပါသည်).'
          );
        }
        if (probe.durationSec < 59.5) {
          score -= 20;
          recommendations.push(
            `Rendered video duration is ${probe.durationSec.toFixed(1)}s, which is under the 60s TikTok threshold.`
          );
        }
      } else {
        score -= 25;
        recommendations.push(
          `Rendered video failed integrity check: ${probe.error || 'Corrupt media stream'}`
        );
      }
    } else {
      // If video has not been rendered yet, note it
      recommendations.push('Video has not been rendered or probed yet (ဗီဒီယို မထုတ်လုပ်ရသေးပါ).');
    }

    const finalScore = Math.max(0, Math.min(100, score));
    const passed = finalScore >= 80;

    const auditRecord: QualityAuditRecord = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      lessonId: lesson.id,
      score: finalScore,
      passed,
      checks: {
        durationOver60s,
        thaiScriptValid,
        burmesePronunciationPresent,
        burmeseTranslationPresent,
        viralHookPresent,
        quizInteractive,
        videoIntegrityVerified,
        repetitionDetected,
      },
      recommendationsMm: recommendations,
      auditedAt: new Date().toISOString(),
    };

    sqliteDb.saveQualityAudit(auditRecord);

    sqliteDb.addLog({
      category: 'system',
      action: 'Quality Gate Audit',
      details: `Audited "${lesson.title}": Score ${finalScore}/100 (${passed ? 'PASSED' : 'FLAGGED'})`,
      level: passed ? 'success' : 'warn',
    });

    return auditRecord;
  }
}

export const qualityGate = new QualityGate();
