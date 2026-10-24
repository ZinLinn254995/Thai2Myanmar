# Thai2Myanmar AI Studio

> **AI-Powered Video Production & Automation Platform for Thai Language Learning (TikTok Japan Focus Account)**

Thai2Myanmar AI Studio is a full-stack, production-grade content automation platform specifically architected to design, structure, synthesize, render, and schedule Thai language educational TikTok videos for Myanmar learners and expats.

---

## 🌟 Key Features

1. **Pedagogical Lesson Architect**:
   - Integrated with Google Gemini 3.8 Flash (`@google/genai` TypeScript SDK).
   - Generates authentic Thai script, Paiboon/RTGS Romanization, high-accuracy Burmese phonetics (မြန်မာအသံထွက်), natural Burmese translation (မြန်မာဘာသာပြန်), tone guides, vocabulary usage tips, real-life context dialogues, and interactive quiz challenges.
   - Section-by-section AI Rewriter (Hook, Vocabulary, Dialogue, Exercise, TikTok Caption).

2. **9:16 Vertical Video Production Studio**:
   - 1080×1920 Vertical TikTok canvas simulator.
   - 5-Scene visual storyboard (Hook, Core Vocabulary, Dialogue, Quiz, Outro).
   - Real-time karaoke text highlighting synced with playback duration.
   - Dual audio synchronization (Thai native speech + Myanmar teacher explanation).
   - Customizable visual themes: Neon TikTok, Minimal Dark, Bangkok Sunset, Tokyo Cyber.
   - **Instant Video Exporter**: Records 9:16 canvas frames and mixed audio via HTML5 Canvas + WebCodecs/MediaRecorder, allowing instant download of `.webm` / `.mp4` video files directly to the user's computer.

3. **Background Video Rendering Queue**:
   - Asynchronous job queue (`/api/production/render`) with progressive stage checkpoints (Scene decomposition, phonetics calibration, karaoke timing, compositing, packaging).
   - Full failure recovery, retry mechanisms, and cancellation controls.

4. **TikTok Japan Publishing Suite & 1-Click Package Kit**:
   - Focused on `@thai2myanmar_jp` (TikTok Japan region account).
   - 1-Click Copy Caption, 1-Click Copy Hashtags, and Direct Video Download.
   - 5-step publishing checklist & upload status tracker.

5. **Scheduler & Automation Guardrails**:
   - Daily production limit enforcement (default: 3 videos/day).
   - Timezone configuration (`Asia/Tokyo` JST UTC+9, `Asia/Yangon` MMT UTC+6:30).
   - **TikTok Creator Rewards Check**: Enforces minimum script duration of 60 seconds (>60s required for Creator Rewards monetization).
   - Duplicate Topic Prevention: Tracks historical lessons and rotates topics.

6. **AI Provider Architecture & Budget Protection**:
   - Decoupled provider interface supporting Gemini 3.8 Flash, Gemini TTS, ElevenLabs, and Omni Video adapters.
   - Token tracking, estimated USD spend, and MMK (မြန်မာကျပ်ငွေ) currency conversion.
   - Hard daily and monthly budget caps with automated pipeline halts.

7. **Data Persistence & Security**:
   - File-backed persistent database in `/data/app_database.json`.
   - Server-side execution of all Gemini API and audio calls—no keys or credentials exposed to the client.

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18
- `GEMINI_API_KEY` (configured in `.env` or AI Studio environment)

### Installation
```bash
npm install
```

### Running in Development
```bash
npm run dev
```
The server will start on `http://localhost:3000` with Express full-stack API and Vite middleware.

### Production Build
```bash
npm run build
npm start
```

---

## ⚙️ Architecture Overview

```
├── /server.ts                 # Express full-stack entry point & API routes
├── /server/
│   ├── storage.ts             # File-backed JSON database engine
│   ├── geminiService.ts       # @google/genai Gemini 3.8 Flash SDK service
│   ├── voiceService.ts        # Gemini TTS & audio synthesis engine
│   ├── productionQueue.ts     # Background video rendering worker
│   ├── scheduler.ts           # Daily automation cadence & limit manager
│   └── publishService.ts      # TikTok post scheduler & checklist tracker
├── /src/
│   ├── components/            # UI Views (Dashboard, Studio, Video Engine, etc.)
│   ├── context/AppContext.tsx # Global state, polling & bilingual engine
│   ├── services/api.ts        # Client API SDK
│   └── types/index.ts         # TypeScript data schemas
└── /data/app_database.json    # Persistent database storage
```

---

## 🔒 Security & Limitations

- **TikTok API Direct Posting**: TikTok's official Content Posting API requires partner application audits, webhook verification, and OAuth approval. To guarantee 100% operational reliability today, Thai2Myanmar AI Studio provides a robust **1-Click Manual Package Suite** (Instant Video Download, 1-Click Caption/Hashtags Copy, and Publishing Checklist) that eliminates unauthorized cookie automation while keeping accounts completely safe.
- **API Secret Isolation**: All AI keys remain server-side in `process.env`.
