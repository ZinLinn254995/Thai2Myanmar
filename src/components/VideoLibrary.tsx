import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../services/api.ts';
import { 
  Film, 
  Download, 
  Play, 
  Share2, 
  RotateCcw, 
  Clock, 
  Flame, 
  CheckCircle2, 
  AlertCircle,
  FileVideo
} from 'lucide-react';

export const VideoLibrary: React.FC = () => {
  const { 
    language, 
    jobs, 
    lessons, 
    setTab, 
    setActiveLesson, 
    refreshData, 
    showToast 
  } = useApp();

  const handleRetry = async (jobId: string) => {
    try {
      await api.retryJob(jobId);
      showToast('Rendering job retried', 'info');
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Retry failed', 'error');
    }
  };

  const handleSchedulePost = (lessonId: string) => {
    const lesson = lessons.find(l => l.id === lessonId);
    if (lesson) {
      setActiveLesson(lesson);
      setTab('publish');
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Film className="w-6 h-6 text-cyan-400" />
            <span>{language === 'mm' ? 'ထုတ်လုပ်ပြီး ဗီဒီယိုများ (Rendered Videos)' : 'Rendered Videos & Exports'}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {language === 'mm'
              ? 'Render ပြီးစီးသော 1080x1920 9:16 Vertical Video များကို ကြည့်ရှုခြင်း၊ Download ပြုလုပ်ခြင်းနှင့် TikTok သို့ Schedule သတ်မှတ်ခြင်း'
              : 'Completed production jobs ready for direct MP4 download and social media publishing.'}
          </p>
        </div>

        <button
          onClick={() => setTab('production')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-semibold text-xs shadow-md transition-all hover:scale-[1.02]"
        >
          <Film className="w-4 h-4" />
          <span>{language === 'mm' ? 'ဗီဒီယို အသစ် Render ပြုလုပ်မည်' : 'Render New Video'}</span>
        </button>
      </div>

      {jobs.length === 0 ? (
        <div className="p-16 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
          <FileVideo className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">
            {language === 'mm' ? 'Render ပြုလုပ်ထားသော ဗီဒီယို မရှိသေးပါ' : 'No Rendered Videos Yet'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {language === 'mm' ? 'သင်ခန်းစာတစ်ခုကို ရွေးချယ်ပြီး 9:16 Video ထုတ်လုပ်လိုက်ပါ။' : 'Pick a lesson from library and start the 9:16 vertical render pipeline.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {jobs.map((job) => {
            const lesson = lessons.find(l => l.id === job.lessonId);
            const isCompleted = job.status === 'completed';
            const isFailed = job.status === 'failed';
            const isRendering = job.status === 'rendering' || job.status === 'queued';

            return (
              <div
                key={job.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Status row */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[10px] text-slate-400">
                      ID: {job.id.substring(0, 16)}...
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                      isCompleted ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                      isFailed ? 'bg-rose-950 text-rose-300 border-rose-800' :
                      'bg-amber-950 text-amber-300 border-amber-800 animate-pulse'
                    }`}>
                      {job.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-white text-sm line-clamp-2">
                    {job.lessonTitle}
                  </h3>

                  {/* Specs */}
                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Resolution:</span>
                      <span className="font-mono text-cyan-400">{job.renderSettings.resolution} (9:16)</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Duration:</span>
                      <span className="font-mono text-white flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{job.durationSec}s</span>
                        {job.durationSec >= 60 && (
                          <span className="text-emerald-400 text-[10px]">(&gt;60s ✓)</span>
                        )}
                      </span>
                    </div>
                    {job.fileSizeBytes && (
                      <div className="flex items-center justify-between text-slate-300">
                        <span>File Size:</span>
                        <span className="font-mono text-slate-400">
                          {(job.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Progress bar if rendering */}
                  {isRendering && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-amber-400 font-mono">
                        <span>{job.currentStep}</span>
                        <span>{job.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 transition-all duration-300" style={{ width: `${job.progress}%` }} />
                      </div>
                    </div>
                  )}

                  {isFailed && (
                    <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/50 text-[11px] text-rose-300">
                      {job.error || 'Rendering job encountered an error.'}
                    </div>
                  )}
                </div>

                  {/* Action buttons */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  {isCompleted && (
                    <>
                      <button
                        onClick={() => {
                          if (lesson) {
                            setActiveLesson(lesson);
                            setTab('production');
                          }
                        }}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1"
                      >
                        <Play className="w-3.5 h-3.5 text-cyan-400 fill-current" />
                        <span>Preview</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <a
                          href={`/api/production/video/${job.id}`}
                          download={`Thai2Myanmar_${job.id}.mp4`}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-cyan-400 text-xs font-semibold flex items-center gap-1 border border-cyan-500/30 transition-colors"
                          title="Download genuine 1080x1920 MP4 video file"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>MP4</span>
                        </a>

                        <button
                          onClick={() => handleSchedulePost(job.lessonId)}
                          className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 shadow-sm"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Publish</span>
                        </button>
                      </div>
                    </>
                  )}

                  {isFailed && (
                    <button
                      onClick={() => handleRetry(job.id)}
                      className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Retry Render</span>
                    </button>
                  )}

                  {isRendering && (
                    <div className="w-full text-center text-xs text-slate-400 py-1 font-mono">
                      Processing in background queue...
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
