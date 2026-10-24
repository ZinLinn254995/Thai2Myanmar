# Thai2Myanmar AI Studio

> **AI-Powered Video Production & Automation Platform for Thai Language Learning (TikTok Japan Focus Account)**

Thai2Myanmar AI Studio is an enterprise-grade full-stack video automation studio specialized in teaching Thai to Burmese-speaking learners, expatriates in Thailand, and Myanmar workers in Japan.

---

## 🌟 Architecture & Implemented Capabilities

1. **Pedagogical Lesson Architect**:
   - Integrated with **Google Gemini 3.8 Flash** (`@google/genai` TypeScript SDK) on the server side.
   - Generates authentic Thai script, RTGS Romanization, Burmese phonetics (မြန်မာအသံထွက်) with tone nuances, natural Burmese translation (မြန်မာဘာသာပြန်), everyday dialogues, and interactive quiz challenges.

2. **Genuine 1080×1920 MP4 Video Production Engine**:
   - Built on native **FFmpeg** (`libx264` + `aac` + `librsvg`).
   - SVG frame compositor utilizing native **Noto Sans Thai** and **Noto Sans Myanmar** system fonts for crisp typography.
   - Outputs true H.264/AAC 1080×1920 vertical video MP4 files complying with TikTok Creator Rewards (>60s requirement).
   - High-performance HTTP 206 partial content streaming for in-browser scrubbing and direct download.

3. **High-Accuracy Voice Synthesis**:
   - Uses **Gemini 3.8 Flash Lite TTS** (`gemini-3.8-flash-lite-tts`) for authentic 24 kHz speech narration.
   - Inspects audio magic bytes for genuine WAV format verification.
   - Never silently replaces narration with synthetic tones; failures return explicit diagnostics.

4. **Multi-Tier Quality Gate Auditor**:
   - **Tier 1 (Structural Completeness)**: Validates Thai script characters, phonetic guidance fields, translation fields, 3-second retention hook, interactive quiz challenge, and curriculum repetition prevention.
   - **Tier 2 (Media Stream Verification)**: Runs `ffprobe` to verify video codec (`h264`), audio codec (`aac`), portrait aspect ratio (`height >= width`), and actual elapsed duration (`>= 60s`).
   - **Tier 3 (Linguistic Transparency)**: Transparently flags heuristic checks vs human native speaker review requirements for colloquial tones and polite particles (ครับ / ค่ะ).

5. **Truthful Publishing Hub**:
   - 4-step preparation checklist (Video download, caption copy, hashtags copy, sound verification).
   - Strict Step 5 publication confirmation requiring either a validated live TikTok URL (`https://www.tiktok.com/@handle/video/...`) or an explicit operator certification.
   - No automatic mock URL fabrication.

6. **ACID Persistent Database**:
   - Built using Node 22 native `node:sqlite` in WAL (Write-Ahead Logging) mode.
   - Zero external binary compilation steps.
   - Crash recovery automatically checks for interrupted rendering jobs on server boot and sets actionable retry states.

7. **PWA & Mobile Support**:
   - Web App Manifest (`/public/manifest.json`) and high-resolution icons (192px, 512px, maskable, apple-touch-icon).
   - In-app install banner with deferred prompt support and real-time offline status indicator.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: >= 22.0.0 (required for native `node:sqlite`)
- **FFmpeg**: `ffmpeg` and `ffprobe` installed with `libx264` and `librsvg`
- **System Fonts**:
  ```bash
  apt-get update && apt-get install -y ffmpeg fonts-noto-core fonts-noto-extra fonts-noto-ui-core fonts-thai-tlwg fontconfig
  ```
- **Gemini API Key**: Attach `GEMINI_API_KEY` in environment variables or AI Studio Secrets.

### Running Locally
```bash
npm install
npm run build
npx tsx server.ts
```
The server starts on `http://localhost:3000`.

---

## ☁️ Deployment Guide

### Option 1: Docker / Container Runtime (Cloud Run, Fly.io, Railway)
Use the included multi-stage `Dockerfile`:
```bash
docker build -t thai2myanmar-studio .
docker run -p 3000:3000 -e GEMINI_API_KEY="your-key" -v $(pwd)/data:/app/data thai2myanmar-studio
```

> **Important for Google Cloud Run**:
> Because Cloud Run's local root disk is an in-memory tmpfs that resets on container shutdown, mount a Cloud Storage bucket to `/app/data` using Cloud Run Volume Mounts (Cloud Storage FUSE) to persist rendered MP4 videos and the SQLite database across restarts.

### Option 2: Linux VPS / Dedicated Server (Ubuntu/Debian)
```bash
# 1. Install system dependencies
sudo apt update && sudo apt install -y ffmpeg fonts-noto-core fonts-noto-extra fonts-noto-ui-core fonts-thai-tlwg

# 2. Clone and install
git clone https://github.com/ZinLinn254995/Thai2Myanmar.git
cd Thai2Myanmar
npm ci

# 3. Build and launch with systemd or PM2
npm run build
pm2 start "npx tsx server.ts" --name "thai2myanmar"
```
