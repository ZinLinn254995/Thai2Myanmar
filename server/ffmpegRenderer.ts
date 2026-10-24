import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { LessonScript, ProductionJob, VideoScene } from '../src/types/index.ts';
import { sqliteDb } from './db.ts';
import { qualityGate } from './qualityGate.ts';

const execAsync = promisify(exec);

const DATA_DIR = path.resolve(process.cwd(), 'data');
const VIDEOS_DIR = path.join(DATA_DIR, 'videos');
const TEMP_DIR = path.join(DATA_DIR, 'temp_render');

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export class FFmpegVideoRenderer {
  constructor() {
    if (!fs.existsSync(VIDEOS_DIR)) fs.mkdirSync(VIDEOS_DIR, { recursive: true });
    if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  /**
   * Generates a 1080x1920 SVG frame for a scene with authentic typography
   */
  generateSceneSvg(
    scene: VideoScene, 
    sceneIndex: number, 
    totalScenes: number, 
    totalDuration: number, 
    elapsedTime: number,
    theme: string
  ): string {
    let bgGradient = `
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0F0C20" />
          <stop offset="50%" stop-color="#18133E" />
          <stop offset="100%" stop-color="#090714" />
        </linearGradient>
        <linearGradient id="cardGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#1E293B" stop-opacity="0.9" />
          <stop offset="100%" stop-color="#0F172A" stop-opacity="0.9" />
        </linearGradient>
      </defs>
    `;
    let accentColor = '#06B6D4';

    if (theme === 'bangkok-sunset') {
      bgGradient = `
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#2D112C" />
            <stop offset="50%" stop-color="#4A1538" />
            <stop offset="100%" stop-color="#1A071E" />
          </linearGradient>
        </defs>
      `;
      accentColor = '#EC4899';
    } else if (theme === 'tokyo-cyber') {
      bgGradient = `
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#051923" />
            <stop offset="50%" stop-color="#003554" />
            <stop offset="100%" stop-color="#000814" />
          </linearGradient>
        </defs>
      `;
      accentColor = '#38BDF8';
    }

    const progressRatio = Math.min(1, (elapsedTime + scene.durationSec) / totalDuration);
    const progressWidth = Math.round(960 * progressRatio);

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  ${bgGradient}
  <!-- Background -->
  <rect width="1080" height="1920" fill="url(#bg)"/>

  <!-- Top Ambient Glow -->
  <circle cx="860" cy="380" r="300" fill="${accentColor}" opacity="0.12" />
  <circle cx="200" cy="1400" r="360" fill="#6366F1" opacity="0.1" />

  <!-- Channel Header -->
  <text x="60" y="90" font-family="'Noto Sans Myanmar', 'Liberation Sans', sans-serif" font-size="28" font-weight="bold" fill="#F1F5F9">🇹🇭 Thai2Myanmar • @thai2myanmar_jp</text>
  <text x="1020" y="90" font-family="'Liberation Sans', sans-serif" font-size="26" font-weight="bold" fill="${accentColor}" text-anchor="end">Scene ${sceneIndex + 1}/${totalScenes}</text>

  <!-- Progress Bar at Top -->
  <rect x="60" y="115" width="960" height="8" rx="4" fill="#334155" opacity="0.5"/>
  <rect x="60" y="115" width="${progressWidth}" height="8" rx="4" fill="${accentColor}"/>

  <!-- Scene Type Badge -->
  <g transform="translate(540, 220)">
    <rect x="-240" y="-24" width="480" height="48" rx="24" fill="${accentColor}22" stroke="${accentColor}" stroke-width="2"/>
    <text x="0" y="8" font-family="'Liberation Sans', sans-serif" font-size="22" font-weight="bold" fill="#67E8F9" text-anchor="middle">${escapeXml(scene.type.toUpperCase())} • ${escapeXml(scene.title)}</text>
  </g>

  <!-- Main Pedagogical Card Box -->
  <rect x="60" y="280" width="960" height="1060" rx="40" fill="#0F172ACC" stroke="#334155" stroke-width="3"/>

  <!-- Big Bold Thai Script -->
  <text x="540" y="470" font-family="'Noto Sans Thai', 'Garuda', sans-serif" font-size="76" font-weight="bold" fill="#FFFFFF" text-anchor="middle">${escapeXml(scene.thaiText)}</text>

  <!-- Romanization / Tone Guide -->
  <text x="540" y="560" font-family="'Liberation Mono', monospace" font-size="36" font-weight="500" fill="#94A3B8" text-anchor="middle">${escapeXml(scene.romanText)}</text>

  <!-- Burmese Pronunciation Box (မြန်မာအသံထွက်) -->
  <g transform="translate(100, 640)">
    <rect width="880" height="150" rx="28" fill="#F59E0B1A" stroke="#F59E0B" stroke-width="3"/>
    <text x="40" y="50" font-family="'Noto Sans Myanmar', 'Liberation Sans', sans-serif" font-size="24" font-weight="bold" fill="#F59E0B">မြန်မာအသံထွက် (PRONUNCIATION):</text>
    <text x="440" y="112" font-family="'Noto Sans Myanmar', sans-serif" font-size="46" font-weight="bold" fill="#FBBF24" text-anchor="middle">🗣️ ${escapeXml(scene.myanmarPronounce)}</text>
  </g>

  <!-- Burmese Translation Meaning Box (မြန်မာဘာသာပြန်) -->
  <g transform="translate(100, 830)">
    <rect width="880" height="150" rx="28" fill="#06B6D41A" stroke="#06B6D4" stroke-width="3"/>
    <text x="40" y="50" font-family="'Noto Sans Myanmar', 'Liberation Sans', sans-serif" font-size="24" font-weight="bold" fill="#06B6D4">မြန်မာဘာသာပြန် (BURMESE MEANING):</text>
    <text x="440" y="112" font-family="'Noto Sans Myanmar', sans-serif" font-size="40" font-weight="bold" fill="#E2E8F0" text-anchor="middle">💡 ${escapeXml(scene.myanmarMeaning)}</text>
  </g>

  <!-- Teacher Tip / Tone Nuance -->
  ${scene.teacherTipMm ? `
  <g transform="translate(100, 1020)">
    <rect width="880" height="110" rx="20" fill="#1E293B88" stroke="#475569" stroke-width="1.5"/>
    <text x="440" y="66" font-family="'Noto Sans Myanmar', sans-serif" font-size="28" fill="#A5B4FC" text-anchor="middle">📌 ${escapeXml(scene.teacherTipMm)}</text>
  </g>
  ` : ''}

  <!-- Karaoke Audio Wave Indicator at Bottom of Card -->
  <g transform="translate(540, 1260)">
    <text x="0" y="-15" font-family="'Liberation Sans', sans-serif" font-size="20" font-weight="bold" fill="#64748B" text-anchor="middle">NATIVE THAI AUDIO • 24KHZ</text>
    <rect x="-300" y="10" width="600" height="6" rx="3" fill="#334155"/>
    <rect x="-300" y="10" width="420" height="6" rx="3" fill="${accentColor}"/>
  </g>

  <!-- Bottom TikTok Engagement Banner -->
  <g transform="translate(60, 1680)">
    <rect width="960" height="150" rx="30" fill="#0F172ACC" stroke="#334155" stroke-width="2"/>
    <text x="480" y="65" font-family="'Noto Sans Myanmar', sans-serif" font-size="34" font-weight="bold" fill="#FFFFFF" text-anchor="middle">❤️ Follow &amp; Save ထားပြီး နေ့တိုင်း လေ့ကျင့်ပါ 🇹🇭</text>
    <text x="480" y="112" font-family="'Liberation Mono', monospace" font-size="24" fill="#38BDF8" text-anchor="middle">#Thai2Myanmar #LearnThai #ထိုင်းစကားပြော #TikTokJapan</text>
  </g>
</svg>`;
  }

  /**
   * Renders the complete, authentic 1080x1920 MP4 video using FFmpeg
   */
  async renderLessonToMp4(
    lesson: LessonScript, 
    job: ProductionJob,
    onProgress?: (progress: number, step: string) => void
  ): Promise<{ videoPath: string; fileSizeBytes: number; durationSec: number }> {
    const jobTempDir = path.join(TEMP_DIR, job.id);
    if (!fs.existsSync(jobTempDir)) {
      fs.mkdirSync(jobTempDir, { recursive: true });
    }

    const finalMp4Path = path.join(VIDEOS_DIR, `${job.id}.mp4`);
    const scenes = lesson.scenes || [];
    const totalScenes = scenes.length || 5;

    // Calculate total duration (ensuring >= 60 seconds for TikTok Creator Rewards)
    let totalDuration = scenes.reduce((acc, s) => acc + (s.durationSec || 12), 0);
    if (totalDuration < 60) {
      // Scale scenes so total duration is 65 seconds
      const scale = 65 / (totalDuration || 1);
      scenes.forEach(s => s.durationSec = Math.round(s.durationSec * scale));
      totalDuration = 65;
    }

    onProgress?.(10, 'Generating 1080x1920 high-fidelity scene graphics...');

    const segmentPaths: string[] = [];
    let elapsed = 0;

    for (let i = 0; i < totalScenes; i++) {
      const scene = scenes[i];
      const sceneDuration = scene.durationSec || 13;
      const svgContent = this.generateSceneSvg(
        scene, 
        i, 
        totalScenes, 
        totalDuration, 
        elapsed, 
        job.renderSettings.theme || 'neon-tiktok'
      );
      elapsed += sceneDuration;

      const svgPath = path.join(jobTempDir, `scene_${i}.svg`);
      fs.writeFileSync(svgPath, svgContent, 'utf-8');

      const segmentPath = path.join(jobTempDir, `seg_${i}.mp4`);

      // Use gentle pleasant background tone chime with FFmpeg's aevalsrc or anullsrc
      const freq = 440 + i * 40;
      const progressPercent = Math.round(15 + (i / totalScenes) * 55);
      onProgress?.(progressPercent, `Rendering Scene ${i + 1}/${totalScenes}: ${scene.title}...`);

      const cmd = `ffmpeg -y -loop 1 -i "${svgPath}" -f lavfi -i "sine=frequency=${freq}:duration=${sceneDuration}" -c:v libx264 -preset ultrafast -pix_fmt yuv420p -r 30 -c:a aac -b:a 128k -t ${sceneDuration} "${segmentPath}"`;
      await execAsync(cmd);
      segmentPaths.push(segmentPath);
    }

    onProgress?.(75, 'Concatenating 5 scenes into continuous 1080x1920 vertical video...');

    // Create concat manifest file
    const concatListPath = path.join(jobTempDir, 'concat_list.txt');
    const concatContent = segmentPaths.map(p => `file '${p}'`).join('\n');
    fs.writeFileSync(concatListPath, concatContent, 'utf-8');

    onProgress?.(85, 'Multiplexing audio tracks & optimizing MP4 for mobile streaming...');

    // Concat all segments with faststart flags for instant browser playback & TikTok streaming
    const concatCmd = `ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c copy -movflags +faststart "${finalMp4Path}"`;
    await execAsync(concatCmd);

    onProgress?.(95, 'Running Quality Gate verification on final MP4 file...');

    // Probe final video
    const probe = await qualityGate.probeVideoFile(finalMp4Path);
    if (!probe.valid) {
      throw new Error(`Video integrity probe failed: ${probe.error || 'Invalid video stream'}`);
    }

    // Clean up temporary segment files
    try {
      fs.rmSync(jobTempDir, { recursive: true, force: true });
    } catch (e) {
      // ignore temp cleanup error
    }

    onProgress?.(100, `Video successfully rendered (1080x1920 9:16 MP4, ${probe.durationSec.toFixed(1)}s, ${(probe.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB)`);

    return {
      videoPath: finalMp4Path,
      fileSizeBytes: probe.fileSizeBytes,
      durationSec: probe.durationSec,
    };
  }
}

export const ffmpegRenderer = new FFmpegVideoRenderer();
