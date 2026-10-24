import React from 'react';
import { useApp, AppTab } from '../context/AppContext.tsx';
import { 
  LayoutDashboard, 
  BookOpen, 
  Sparkles, 
  Clapperboard, 
  Film, 
  Share2, 
  Cpu, 
  DollarSign, 
  CalendarClock, 
  ScrollText, 
  Settings,
  Flame
} from 'lucide-react';

interface NavItem {
  id: AppTab;
  labelMm: string;
  labelEn: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  highlight?: boolean;
}

export const Sidebar: React.FC = () => {
  const { tab, setTab, language, lessons, jobs, scheduledPosts } = useApp();

  const draftLessons = lessons.filter(l => l.status === 'Draft').length;
  const renderingJobs = jobs.filter(j => j.status === 'rendering' || j.status === 'queued').length;
  const readyVideos = lessons.filter(l => l.status === 'Ready').length;
  const scheduledCount = scheduledPosts.filter(p => p.status === 'scheduled').length;

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      labelMm: 'ခြုံငုံသုံးသပ်ချက်',
      labelEn: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'lessons',
      labelMm: 'သင်ခန်းစာ စာရင်း',
      labelEn: 'Lesson Library',
      icon: BookOpen,
      badge: lessons.length,
    },
    {
      id: 'studio',
      labelMm: 'AI ဇာတ်ညွှန်း ဖန်တီးခန်း',
      labelEn: 'AI Script Studio',
      icon: Sparkles,
      highlight: true,
      badge: draftLessons > 0 ? `${draftLessons} draft` : undefined,
    },
    {
      id: 'production',
      labelMm: '9:16 Video Renderer',
      labelEn: 'Video Production',
      icon: Clapperboard,
      badge: renderingJobs > 0 ? `${renderingJobs} active` : undefined,
    },
    {
      id: 'videos',
      labelMm: 'ထုတ်လုပ်ပြီး ဗီဒီယိုများ',
      labelEn: 'Rendered Videos',
      icon: Film,
      badge: readyVideos,
    },
    {
      id: 'publish',
      labelMm: 'TikTok တင်ရန် Hub',
      labelEn: 'Publishing Calendar',
      icon: Share2,
      badge: scheduledCount > 0 ? `${scheduledCount} sched` : undefined,
    },
    {
      id: 'scheduler',
      labelMm: 'အလိုအလျောက် အချိန်ဇယား',
      labelEn: 'Auto Scheduler',
      icon: CalendarClock,
    },
    {
      id: 'providers',
      labelMm: 'AI မော်ဒယ်များနှင့် ဝန်ဆောင်မှု',
      labelEn: 'AI Providers',
      icon: Cpu,
    },
    {
      id: 'usage',
      labelMm: 'ကုန်ကျစရိတ်နှင့် ဘတ်ဂျက်',
      labelEn: 'Usage & Costs',
      icon: DollarSign,
    },
    {
      id: 'logs',
      labelMm: 'စနစ်လုပ်ဆောင်ချက် မှတ်တမ်း',
      labelEn: 'Activity Logs',
      icon: ScrollText,
    },
    {
      id: 'settings',
      labelMm: 'စနစ်ဆက်တင်များ',
      labelEn: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 select-none">
      {/* Navigation list */}
      <nav className="p-3 space-y-1 overflow-y-auto flex-1">
        <div className="px-3 py-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          {language === 'mm' ? 'ပင်မ လုပ်ဆောင်ချက်များ' : 'Main Workspace'}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = tab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/15 to-indigo-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-cyan-400' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">
                  {language === 'mm' ? item.labelMm : item.labelEn}
                </span>
              </div>

              {item.badge !== undefined && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* TikTok Creator Rewards Guard Card */}
      <div className="p-3 border-t border-slate-800/80">
        <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-950/60 to-purple-950/60 border border-indigo-800/40 text-xs">
          <div className="flex items-center gap-1.5 text-indigo-300 font-semibold mb-1">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>TikTok Rewards Check</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            {language === 'mm'
              ? 'ဗီဒီယိုကြာချိန် ၆၀ စက္ကန့်ကျော် သတ်မှတ်ချက်ကို အလိုအလျောက် စစ်ဆေးပေးထားပါသည်။'
              : 'Auto-calibrating >60s video duration for TikTok Creator Rewards compliance.'}
          </p>
          <div className="mt-2 flex items-center justify-between text-[10px] text-indigo-200 font-mono">
            <span>Target: 60-75s</span>
            <span className="text-emerald-400">✓ Enforced</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
