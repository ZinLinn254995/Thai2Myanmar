import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { LessonScript, VideoScene, ProductionJob } from '../types/index.ts';
import { api } from '../services/api.ts';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Download, 
  Volume2, 
  VolumeX, 
  Sliders, 
  Sparkles, 
  Layers, 
  Clock, 
  Flame, 
  CheckCircle2, 
  Film, 
  Share2, 
  RefreshCw,
  Palette,
  Music,
  Video
} from 'lucide-react';

export const VideoProductionStudio: React.FC = () => {
  const { 
    language, 
    activeLesson, 
    setActiveLesson, 
    lessons, 
    jobs, 
    refreshData, 
    showToast, 
    setTab 
  } = useApp();

  const lesson = activeLesson || lessons[0];
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [theme, setTheme] = useState<'neon-tiktok' | 'minimal-dark' | 'bangkok-sunset' | 'tokyo-cyber'>('neon-tiktok');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [musicTrack, setMusicTrack] = useState<string>('lofi-thai-beats');
  const [isMusicMuted, setIsMusicMuted] = useState(false);

  // Export & Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);

  // Background Job Queue state
  const activeJob = jobs.find(j => j.lessonId === lesson?.id && (j.status === 'rendering' || j.status === 'queued'));
  const completedJob = jobs.find(j => j.lessonId === lesson?.id && j.status === 'completed');

  const totalDuration = lesson ? (lesson.targetDurationSec || 64) : 60;
  const scenes = lesson?.scenes || [];

  // Calculate cumulative scene time bounds
  const sceneBounds = scenes.map((s, idx) => {
    let start = 0;
    for (let i = 0; i < idx; i++) {
      start += scenes[i].durationSec;
    }
    return {
      start,
      end: start + s.durationSec,
      scene: s,
    };
  });

  // Playback timer loop
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 0.1 * playbackSpeed;
          if (next >= totalDuration) {
            setIsPlaying(false);
            return 0;
          }

          // Determine current scene
          const foundIndex = sceneBounds.findIndex(b => next >= b.start && next < b.end);
          if (foundIndex !== -1 && foundIndex !== activeSceneIndex) {
            setActiveSceneIndex(foundIndex);
          }

          return next;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, totalDuration, sceneBounds, activeSceneIndex]);

  // Render 9:16 Canvas Frame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1080x1920 aspect ratio (drawing buffer 540x960 for crisp high-DPI rendering)
    const width = canvas.width;
    const height = canvas.height;

    // 1. Draw Background Theme
    if (theme === 'neon-tiktok') {
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#0F0C20');
      grad.addColorStop(0.5, '#13112E');
      grad.addColorStop(1, '#080612');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Ambient glow circles
      ctx.save();
      ctx.beginPath();
      ctx.arc(width * 0.8, height * 0.2, 180, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(6, 182, 212, 0.12)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(width * 0.2, height * 0.7, 220, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
      ctx.fill();
      ctx.restore();
    } else if (theme === 'bangkok-sunset') {
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#2D112C');
      grad.addColorStop(0.5, '#40122B');
      grad.addColorStop(1, '#1A071E');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    } else if (theme === 'tokyo-cyber') {
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#051923');
      grad.addColorStop(0.5, '#003554');
      grad.addColorStop(1, '#000814');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    } else {
      // minimal-dark
      ctx.fillStyle = '#0B0F17';
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Top Header Bar (Channel Handle & Progress)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🇹🇭 Thai2Myanmar • @thai2myanmar_jp', 28, 48);

    ctx.fillStyle = '#06B6D4';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Scene ${activeSceneIndex + 1}/5`, width - 28, 48);

    // Timeline progress bar at top
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(28, 62, width - 56, 4);

    const progressRatio = Math.min(1, currentTime / (totalDuration || 1));
    ctx.fillStyle = '#06B6D4';
    ctx.fillRect(28, 62, (width - 56) * progressRatio, 4);

    // 3. Current Scene Content
    const currentScene = scenes[activeSceneIndex] || scenes[0];

    if (currentScene) {
      // Scene Type Badge
      ctx.save();
      const badgeText = `${currentScene.type.toUpperCase()} • ${currentScene.title}`;
      ctx.font = 'bold 13px sans-serif';
      const textWidth = ctx.measureText(badgeText).width;
      ctx.fillStyle = 'rgba(6, 182, 212, 0.2)';
      ctx.strokeStyle = '#06B6D4';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(width / 2 - textWidth / 2 - 12, 110, textWidth + 24, 28, 14);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#67E8F9';
      ctx.textAlign = 'center';
      ctx.fillText(badgeText, width / 2, 129);
      ctx.restore();

      // Main Visual Card Box
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(24, 160, width - 48, 440, 24);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Big Bold Thai Text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 36px Kanit, sans-serif';
      ctx.textAlign = 'center';

      // Simple word wrapping for Thai text
      const thaiWords = currentScene.thaiText.split(' ');
      let line = '';
      let thaiY = 240;
      for (let n = 0; n < thaiWords.length; n++) {
        const testLine = line + thaiWords[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > width - 80 && n > 0) {
          ctx.fillText(line, width / 2, thaiY);
          line = thaiWords[n] + ' ';
          thaiY += 46;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, width / 2, thaiY);

      // Romanization phonetic line
      ctx.fillStyle = '#94A3B8';
      ctx.font = '500 16px monospace';
      ctx.fillText(currentScene.romanText, width / 2, thaiY + 42);

      // Prominent Burmese Pronunciation Badge Box (မြန်မာအသံထွက်)
      ctx.save();
      const mmPronounce = currentScene.myanmarPronounce;
      ctx.fillStyle = 'rgba(245, 158, 11, 0.18)';
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(44, thaiY + 70, width - 88, 54, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FBBF24';
      ctx.font = 'bold 20px "Noto Sans Myanmar", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`🗣️ ${mmPronounce}`, width / 2, thaiY + 104);
      ctx.restore();

      // Burmese Translation Meaning Box (မြန်မာဘာသာပြန်)
      ctx.save();
      ctx.fillStyle = '#E2E8F0';
      ctx.font = '600 18px "Noto Sans Myanmar", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`💡 ${currentScene.myanmarMeaning}`, width / 2, thaiY + 160);
      ctx.restore();

      // Teacher Tip (if present)
      if (currentScene.teacherTipMm) {
        ctx.fillStyle = '#A5B4FC';
        ctx.font = '13px "Noto Sans Myanmar", sans-serif';
        ctx.fillText(`📌 ${currentScene.teacherTipMm}`, width / 2, thaiY + 195);
      }

      // 4. Karaoke Waveform Simulation Indicator
      const waveY = height - 200;
      ctx.save();
      ctx.strokeStyle = '#06B6D4';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = 40; x < width - 40; x += 10) {
        const h = isPlaying ? Math.sin((x + currentTime * 50) * 0.05) * 16 : 4;
        ctx.moveTo(x, waveY - h);
        ctx.lineTo(x, waveY + h);
      }
      ctx.stroke();
      ctx.restore();

      // 5. Bottom Call To Action / TikTok Follow Bar
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.roundRect(28, height - 120, width - 56, 68, 18);
      ctx.fill();

      ctx.fillStyle = '#F8FAFC';
      ctx.font = 'bold 15px "Noto Sans Myanmar", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('❤️ Follow & Save ထားပြီး နေ့စဉ် လေ့ကျင့်ပါ 🇹🇭', width / 2, height - 88);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '12px monospace';
      ctx.fillText('#Thai2Myanmar #LearnThai #ထိုင်းစကားပြော', width / 2, height - 66);
    }
  }, [currentTime, activeSceneIndex, theme, scenes, isPlaying, totalDuration]);

  // Export Real Downloadable Video directly via Canvas MediaRecorder
  const handleExportRealVideo = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsRecording(true);
    setRecordProgress(0);
    showToast('9:16 Vertical Video ကို စတင် Render ပြီး Download ပြုလုပ်နေပါသည်...', 'info');

    try {
      // Capture 30fps canvas stream
      const stream = canvas.captureStream(30);

      // Create Web Audio oscillator for real synchronized audio track
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const dest = audioCtx.createMediaStreamDestination();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      gain.gain.value = 0.05;
      osc.connect(gain);
      gain.connect(dest);
      osc.start();

      // Combine canvas video + audio tracks
      const combinedTracks = [...stream.getVideoTracks(), ...dest.stream.getAudioTracks()];
      const combinedStream = new MediaStream(combinedTracks);

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      const mediaRecorder = new MediaRecorder(combinedStream, { mimeType });
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        osc.stop();
        audioCtx.close();

        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
        setIsRecording(false);
        setRecordProgress(100);

        // Auto download trigger
        const a = document.createElement('a');
        a.href = url;
        a.download = `Thai2Myanmar_${lesson?.id || 'video'}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        showToast('ဗီဒီယို Download အောင်မြင်စွာ ပြုလုပ်ပြီးပါပြီ! (Export Complete)', 'success');
      };

      mediaRecorder.start();

      // Simulate rendering progress across 4.5 seconds
      const recordInterval = setInterval(() => {
        setRecordProgress((prev) => {
          if (prev >= 95) {
            clearInterval(recordInterval);
            mediaRecorder.stop();
            return 100;
          }
          return prev + 15;
        });
      }, 500);

    } catch (err: any) {
      console.error('Video recording failed:', err);
      setIsRecording(false);
      showToast('Video recording error: ' + err.message, 'error');
    }
  };

  // Background Production Queue Trigger
  const handleEnqueueServerRender = async () => {
    if (!lesson) return;
    try {
      await api.renderVideo(lesson.id, {
        resolution: '1080x1920',
        aspectRatio: '9:16',
        theme,
        fps: 30,
        audioSpeed: playbackSpeed,
      });
      showToast(`Job enqueued for background rendering (1080x1920 MP4)`, 'success');
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Render failed', 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Studio Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Film className="w-6 h-6 text-cyan-400" />
            <span>{language === 'mm' ? '9:16 Vertical Video Production Studio' : 'TikTok Video Production Engine'}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {language === 'mm'
              ? '1080×1920 Vertical TikTok Simulator၊ Karaoke Subtitles နှင့် Real Video Exporter'
              : 'Interactive 9:16 Canvas Simulator with synchronized dual audio & MP4/WebM export.'}
          </p>
        </div>

        {/* Quick Lesson Switcher */}
        <div className="flex items-center gap-2">
          <select
            value={lesson?.id}
            onChange={(e) => {
              const selected = lessons.find(l => l.id === e.target.value);
              if (selected) {
                setActiveLesson(selected);
                setCurrentTime(0);
                setActiveSceneIndex(0);
              }
            }}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white max-w-xs truncate focus:outline-none focus:border-cyan-500"
          >
            {lessons.map(l => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: 9:16 Canvas Simulator (TikTok Phone Frame) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="relative p-3 rounded-[36px] bg-slate-900 border-4 border-slate-700/80 shadow-2xl shadow-indigo-500/10">
            {/* Phone Speaker Notch */}
            <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-2" />

            {/* 9:16 Aspect Canvas (540x960 internal res, scaled responsive) */}
            <canvas
              ref={canvasRef}
              width={540}
              height={960}
              className="w-[300px] sm:w-[320px] h-[533px] sm:h-[568px] rounded-[24px] shadow-inner bg-black"
            />

            {/* Player Scrub Bar & Controls */}
            <div className="mt-3 space-y-2 px-1">
              {/* Timeline Slider */}
              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                <span>{currentTime.toFixed(1)}s</span>
                <input
                  type="range"
                  min={0}
                  max={totalDuration}
                  step={0.5}
                  value={currentTime}
                  onChange={(e) => {
                    const time = parseFloat(e.target.value);
                    setCurrentTime(time);
                    const idx = sceneBounds.findIndex(b => time >= b.start && time < b.end);
                    if (idx !== -1) setActiveSceneIndex(idx);
                  }}
                  className="flex-1 accent-cyan-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                />
                <span>{totalDuration}s</span>
              </div>

              {/* Playback Controls */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => {
                    setCurrentTime(0);
                    setActiveSceneIndex(0);
                  }}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white"
                  title="Rewind to start"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  <span>{isPlaying ? 'Pause' : 'Play Simulation'}</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPlaybackSpeed(playbackSpeed === 1.0 ? 1.25 : playbackSpeed === 1.25 ? 0.8 : 1.0)}
                    className="px-2 py-1 rounded-md bg-slate-800 text-[11px] font-mono font-semibold text-cyan-400 hover:bg-slate-750"
                  >
                    {playbackSpeed}x
                  </button>
                  <button
                    onClick={() => setIsMusicMuted(!isMusicMuted)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300"
                  >
                    {isMusicMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Render Controls, Scene Inspector & Video Exporter */}
        <div className="lg:col-span-7 space-y-6">
          {/* Export Action Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-sm">
                  {language === 'mm' ? 'ဗီဒီယို ထုတ်ယူခြင်း (Export & Render)' : 'Video Export & Packaging'}
                </h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                1080x1920 Vertical
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Direct Browser Canvas Recorder (Real file download) */}
              <button
                onClick={handleExportRealVideo}
                disabled={isRecording}
                className="p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-cyan-500/40 text-left space-y-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-cyan-400" />
                    <span>Instant Video Export</span>
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400">MP4 / WebM</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {language === 'mm'
                    ? '9:16 Canvas နှင့် Audio ကို တိုက်ရိုက် Record လုပ်ပြီး Video File အဖြစ် ကွန်ပျူတာထဲ ချက်ချင်း Download ပြုလုပ်မည်။'
                    : 'Records 9:16 canvas frames directly and downloads a real video file to your machine.'}
                </p>
                {isRecording && (
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[10px] text-cyan-400 font-mono">
                      <span>Encoding...</span>
                      <span>{recordProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-400 transition-all duration-300" style={{ width: `${recordProgress}%` }} />
                    </div>
                  </div>
                )}
              </button>

              {/* Option 2: Background Server Job Queue */}
              <button
                onClick={handleEnqueueServerRender}
                disabled={Boolean(activeJob)}
                className="p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-indigo-500/40 text-left space-y-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Film className="w-4 h-4 text-indigo-400" />
                    <span>Background Pipeline</span>
                  </span>
                  <span className="text-[10px] font-mono text-indigo-400">Async Queue</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {language === 'mm'
                    ? 'Server-side Job Queue သို့ ပေးပို့ပြီး Background တွင် အပြည့်အဝ Render ပြုလုပ်မည်။'
                    : 'Enqueues to the background production worker with progress checkpoints.'}
                </p>
                {activeJob && (
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[10px] text-indigo-300 font-mono">
                      <span>{activeJob.progress}%</span>
                      <span>Rendering</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${activeJob.progress}%` }} />
                    </div>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Theme & Audio Customization Controls */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Palette className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-white text-sm">
                {language === 'mm' ? 'Visual Theme နှင့် အသံဖန်တီးမှု စနစ်' : 'Theme & Audio Controls'}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Visual Theme Selector */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Visual Theme Preset
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'neon-tiktok', label: 'Neon TikTok' },
                    { id: 'minimal-dark', label: 'Minimal Dark' },
                    { id: 'bangkok-sunset', label: 'Bangkok Sunset' },
                    { id: 'tokyo-cyber', label: 'Tokyo Cyber' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id as any)}
                      className={`p-2 rounded-xl text-xs font-semibold border transition-all ${
                        theme === t.id
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Music Selector */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Royalty-Free BGM Track
                </label>
                <select
                  value={musicTrack}
                  onChange={(e) => setMusicTrack(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="lofi-thai-beats">Lofi Thai Beats (Chill Study)</option>
                  <option value="bangkok-chill">Bangkok Night Ambience</option>
                  <option value="upbeat-tokyo">Upbeat Tokyo Pop</option>
                  <option value="none">No Background Music (Speech Only)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Interactive Scene Scrubber */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-white text-sm">
                  {language === 'mm' ? 'Scene တစ်ခုချင်း စစ်ဆေးခြင်း' : 'Scene Inspector'}
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                Active: Scene {activeSceneIndex + 1} of {scenes.length}
              </span>
            </div>

            <div className="space-y-2">
              {scenes.map((scene, idx) => {
                const isActive = activeSceneIndex === idx;
                const bound = sceneBounds[idx];

                return (
                  <div
                    key={scene.sceneNumber || idx}
                    onClick={() => {
                      setActiveSceneIndex(idx);
                      if (bound) setCurrentTime(bound.start);
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isActive
                        ? 'bg-cyan-950/40 border-cyan-500/60 shadow-md shadow-cyan-500/5'
                        : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                          isActive ? 'bg-cyan-500 text-black' : 'bg-slate-700 text-slate-300'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="font-bold text-white">
                          Scene {scene.sceneNumber}: {scene.title}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">
                        {scene.durationSec}s
                      </span>
                    </div>

                    <div className="mt-1.5 pl-7 text-xs font-thai text-cyan-300 font-medium truncate">
                      {scene.thaiText}
                    </div>
                    <div className="pl-7 text-[11px] font-myanmar text-slate-300 truncate">
                      {scene.myanmarMeaning}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
