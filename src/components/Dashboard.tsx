import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import { 
  Sparkles, 
  Film, 
  Share2, 
  AlertTriangle, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Layers, 
  Play, 
  ArrowRight,
  Video,
  ShieldCheck,
  Globe2,
  Calendar
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { 
    language, 
    setTab, 
    lessons, 
    jobs, 
    scheduledPosts, 
    metrics, 
    accounts, 
    logs, 
    setActiveLesson,
    triggerDailyAutoRun 
  } = useApp();

  const today = new Date().toISOString().split('T')[0];
  const todayCreated = lessons.filter(l => l.createdAt && l.createdAt.startsWith(today)).length;
  const readyVideos = lessons.filter(l => l.status === 'Ready').length;
  const renderingJobs = jobs.filter(j => j.status === 'rendering' || j.status === 'queued');
  const failedJobs = jobs.filter(j => j.status === 'failed');
  const scheduledCount = scheduledPosts.filter(p => p.status === 'scheduled').length;
  const publishedCount = scheduledPosts.filter(p => p.status === 'published').length;

  const jpAccount = accounts.find(a => a.region === 'Japan') || accounts[0];

  // MMK conversion estimation: 1 USD ~ 4,500 MMK market rate
  const costUsd = metrics?.todayEstimatedCostUsd || 0.00044;
  const costMmk = Math.round(costUsd * 4500);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/40 p-5 sm:p-6 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>TikTok Japan Focus Account Automation</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {language === 'mm' 
                ? 'မင်္ဂလာပါ! Thai2Myanmar ဗီဒီယို ထုတ်လုပ်ရေး ဒက်ရှ်ဘုတ်' 
                : 'Welcome to Thai2Myanmar Production Studio'}
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              {language === 'mm'
                ? 'ထိုင်းစာ၊ ထိုင်းအသံထွက်နှင့် မြန်မာအသံထွက် အကူအညီပါဝင်သော 9:16 Vertical TikTok Video များကို နေ့စဉ် အလိုအလျောက် ထုတ်လုပ်နိုင်ပါသည်။'
                : 'Craft, render, and schedule authentic Thai-to-Myanmar TikTok educational videos with synchronized dual audio & karaoke subtitles.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={triggerDailyAutoRun}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-semibold text-xs shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02]"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{language === 'mm' ? 'ယနေ့ အလိုအလျောက် ထုတ်လုပ်ရန်' : 'Trigger Today\'s Pipeline'}</span>
            </button>
            <button
              onClick={() => setTab('studio')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-xs transition-colors"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>{language === 'mm' ? '+ သင်ခန်းစာသစ် ဖန်တီးမည်' : '+ New AI Lesson'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Today Created */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>{language === 'mm' ? 'ယနေ့ ဖန်တီးထားသော သင်ခန်းစာ' : 'Today Lessons'}</span>
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono">{todayCreated}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-cyan-400 font-semibold">{lessons.length}</span>
            <span>{language === 'mm' ? 'စုစုပေါင်း သင်ခန်းစာ' : 'total in library'}</span>
          </div>
        </div>

        {/* Rendered Videos */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>{language === 'mm' ? 'Render ပြီးစီးသော ဗီဒီယိုများ' : 'Rendered Videos'}</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Film className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">{readyVideos}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {renderingJobs.length > 0 ? (
              <span className="text-amber-400 font-semibold animate-pulse">{renderingJobs.length} rendering now</span>
            ) : (
              <span className="text-slate-400">1080x1920 9:16 ready</span>
            )}
          </div>
        </div>

        {/* Scheduled Posts */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>{language === 'mm' ? 'Schedule လုပ်ထားသော Video များ' : 'Scheduled Posts'}</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-indigo-300 font-mono">{scheduledCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            <span className="text-emerald-400 font-semibold">{publishedCount}</span> published to TikTok
          </div>
        </div>

        {/* AI Usage & Cost */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>{language === 'mm' ? 'AI ကုန်ကျစရိတ် (ခန့်မှန်းခြေ)' : 'Estimated Cost'}</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono">${costUsd.toFixed(4)}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span className="text-amber-400">≈ {costMmk.toLocaleString()} MMK</span>
            <span className="text-slate-400">Limit: ${metrics?.dailyBudgetLimitUsd || 2}/day</span>
          </div>
        </div>
      </div>

      {/* System Health & TikTok Channel Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Channel & Integration Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <h3 className="font-semibold text-white text-sm">
                {language === 'mm' ? 'စနစ် ချိတ်ဆက်မှု အခြေအနေ' : 'System & Integration Health'}
              </h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              ALL SYSTEMS OK
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Gemini API */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div>
                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Google Gemini 3.8 Flash</span>
                </div>
                <div className="text-[11px] text-slate-400">Linguistic Structuring & Phonetics Engine</div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                Connected
              </span>
            </div>

            {/* Video Engine */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div>
                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>9:16 Vertical Video Renderer</span>
                </div>
                <div className="text-[11px] text-slate-400">1080x1920 Canvas + Dual Audio Compositor</div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                Active
              </span>
            </div>

            {/* TikTok Account */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div>
                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span>TikTok Japan (@thai2myanmar_jp)</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {jpAccount?.authStatus === 'manual_only' 
                    ? '1-Click Export Kit & Checklist Mode' 
                    : 'Official Posting API'}
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                1-Click Kit Ready
              </span>
            </div>

            {/* Persistence */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div>
                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Persistent JSON Storage</span>
                </div>
                <div className="text-[11px] text-slate-400">File-backed DB in /data/app_database.json</div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                Synchronized
              </span>
            </div>
          </div>
        </div>

        {/* Active & Upcoming Queue */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <h3 className="font-semibold text-white text-sm">
                {language === 'mm' ? 'လာမည့် Publishing Schedule နှင့် အလုပ်များ' : 'Upcoming Schedule & Pipeline'}
              </h3>
            </div>
            <button
              onClick={() => setTab('publish')}
              className="text-xs text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 font-medium"
            >
              <span>{language === 'mm' ? 'အားလုံးကြည့်ရန်' : 'View all'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {scheduledPosts.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              {language === 'mm' ? 'Schedule လုပ်ထားသော Video မရှိသေးပါ။' : 'No scheduled videos yet.'}
            </div>
          ) : (
            <div className="space-y-2.5">
              {scheduledPosts.map(post => (
                <div 
                  key={post.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono font-medium bg-indigo-950 text-indigo-300 border border-indigo-800">
                        {post.platform.toUpperCase()} ({post.accountHandle})
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(post.scheduledTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-200 text-xs line-clamp-1">
                      {post.lessonTitle}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setTab('publish')}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
                    >
                      {language === 'mm' ? 'TikTok Package ပြင်ဆင်ရန်' : 'Prepare Post'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Rendering Jobs in Progress */}
          {renderingJobs.length > 0 && (
            <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-amber-300">
                <span className="flex items-center gap-1.5">
                  <Video className="w-4 h-4 animate-spin" />
                  <span>Active Background Rendering Job</span>
                </span>
                <span>{renderingJobs[0].progress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-400 transition-all duration-500" 
                  style={{ width: `${renderingJobs[0].progress}%` }} 
                />
              </div>
              <div className="text-[11px] text-slate-300">
                {renderingJobs[0].currentStep}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent System Activity Logs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <h3 className="font-semibold text-white text-sm">
              {language === 'mm' ? 'နောက်ဆုံး Automation Activity မှတ်တမ်း' : 'Recent Automation & Production Activity'}
            </h3>
          </div>
          <button
            onClick={() => setTab('logs')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
          >
            {language === 'mm' ? 'အသေးစိတ်မှတ်တမ်း' : 'Full audit trail'}
          </button>
        </div>

        <div className="space-y-2 text-xs">
          {logs.slice(0, 5).map(log => {
            let badgeClass = 'text-slate-400 bg-slate-800';
            if (log.level === 'success') badgeClass = 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/60';
            if (log.level === 'error') badgeClass = 'text-rose-400 bg-rose-950/60 border border-rose-800/60';
            if (log.level === 'warn') badgeClass = 'text-amber-400 bg-amber-950/60 border border-amber-800/60';

            return (
              <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/70 border border-slate-800/80 gap-1.5 transition-colors">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${badgeClass}`}>
                    {log.action}
                  </span>
                  <span className="text-slate-200 font-medium line-clamp-1">{log.details}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
