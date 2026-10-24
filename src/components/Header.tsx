import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import { 
  Sparkles, 
  Play, 
  Globe, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Video
} from 'lucide-react';

export const Header: React.FC = () => {
  const { 
    language, 
    setLanguage, 
    setTab, 
    triggerDailyAutoRun, 
    metrics, 
    refreshData,
    accounts,
    jobs
  } = useApp();

  const activeJobsCount = jobs.filter(j => j.status === 'rendering' || j.status === 'queued').length;
  const jpAccount = accounts.find(a => a.region === 'Japan') || accounts[0];

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Brand & Subtitle */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-black text-lg">
          🇹🇭🇲🇲
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-slate-100 text-base sm:text-lg tracking-tight">
              Thai2Myanmar <span className="text-cyan-400">AI Studio</span>
            </h1>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800/60">
              v1.0 Production
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden md:block">
            {language === 'mm' 
              ? 'ထိုင်းစကားပြော TikTok ဗီဒီယို ဖန်တီး၊ ထုတ်လုပ်နှင့် အလိုအလျောက် စီမံခန့်ခွဲရေး ပလက်ဖောင်း' 
              : 'AI Video Production & TikTok Automation Engine'}
          </p>
        </div>
      </div>

      {/* Integration Badges & Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Active TikTok Account Badge */}
        {jpAccount && (
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-slate-200">TikTok JP:</span>
            <span className="text-cyan-400 font-mono">{jpAccount.handle}</span>
            <span className="text-slate-400 text-[10px]">({jpAccount.followersCount.toLocaleString()} followers)</span>
          </div>
        )}

        {/* Rendering Queue indicator */}
        {activeJobsCount > 0 && (
          <button 
            onClick={() => setTab('videos')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 hover:bg-amber-500/20 transition-colors animate-pulse"
          >
            <Video className="w-3.5 h-3.5" />
            <span>{activeJobsCount} Rendering</span>
          </button>
        )}

        {/* Language Switcher */}
        <button
          onClick={() => setLanguage(language === 'mm' ? 'en' : 'mm')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-medium text-slate-200 transition-colors"
          title="Toggle Language"
        >
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          <span>{language === 'mm' ? 'မြန်မာ' : 'English'}</span>
        </button>

        {/* Refresh Data */}
        <button
          onClick={() => refreshData()}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors"
          title="Refresh Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Daily Auto-Run Button */}
        <button
          onClick={triggerDailyAutoRun}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition-colors"
          title="Trigger Daily Automation Pipeline"
        >
          <Play className="w-3.5 h-3.5 text-amber-400" />
          <span>{language === 'mm' ? 'အလိုအလျောက် ထုတ်လုပ်ရန်' : 'Auto Run'}</span>
        </button>

        {/* Create with AI Button */}
        <button
          onClick={() => setTab('studio')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-xs font-semibold text-white shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{language === 'mm' ? '+ သင်ခန်းစာသစ်' : '+ New Lesson'}</span>
        </button>
      </div>
    </header>
  );
};
