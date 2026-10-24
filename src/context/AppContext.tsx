import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  LessonScript, 
  ProductionJob, 
  AIProviderConfig, 
  PublishingAccount, 
  ScheduledPost, 
  SystemSettings, 
  ActivityLog 
} from '../types/index.ts';
import { api } from '../services/api.ts';

export type AppTab = 
  | 'dashboard'
  | 'lessons'
  | 'studio'
  | 'production'
  | 'videos'
  | 'publish'
  | 'providers'
  | 'usage'
  | 'scheduler'
  | 'logs'
  | 'settings';

export type AppLanguage = 'mm' | 'en';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warn';
  text: string;
}

interface AppContextType {
  tab: AppTab;
  setTab: (tab: AppTab) => void;
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  lessons: LessonScript[];
  jobs: ProductionJob[];
  accounts: PublishingAccount[];
  scheduledPosts: ScheduledPost[];
  providers: AIProviderConfig[];
  metrics: any;
  settings: SystemSettings | null;
  logs: ActivityLog[];
  activeLesson: LessonScript | null;
  setActiveLesson: (lesson: LessonScript | null) => void;
  activeJob: ProductionJob | null;
  setActiveJob: (job: ProductionJob | null) => void;
  isLoading: boolean;
  refreshData: () => Promise<void>;
  toasts: ToastMessage[];
  showToast: (text: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;
  triggerDailyAutoRun: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tab, setTab] = useState<AppTab>('dashboard');
  const [language, setLanguage] = useState<AppLanguage>('mm'); // Default Burmese as requested
  const [lessons, setLessons] = useState<LessonScript[]>([]);
  const [jobs, setJobs] = useState<ProductionJob[]>([]);
  const [accounts, setAccounts] = useState<PublishingAccount[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [providers, setProviders] = useState<AIProviderConfig[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [activeLesson, setActiveLesson] = useState<LessonScript | null>(null);
  const [activeJob, setActiveJob] = useState<ProductionJob | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((text: string, type: ToastMessage['type'] = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const refreshData = useCallback(async () => {
    try {
      const [l, j, a, s, p, m, set, lg] = await Promise.all([
        api.getLessons(),
        api.getJobs(),
        api.getAccounts(),
        api.getScheduledPosts(),
        api.getProviders(),
        api.getMetrics(),
        api.getSettings(),
        api.getLogs(),
      ]);

      setLessons(l);
      setJobs(j);
      setAccounts(a);
      setScheduledPosts(s);
      setProviders(p);
      setMetrics(m);
      setSettings(set);
      setLogs(lg);

      // Auto-select active lesson if none
      if (l.length > 0 && !activeLesson) {
        setActiveLesson(l[0]);
      }
    } catch (err: any) {
      console.error('Failed to load platform data:', err);
      showToast('ဒေတာ ရယူရာတွင် အခက်အခဲရှိနေပါသည် (Error loading data)', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [activeLesson, showToast]);

  useEffect(() => {
    refreshData();
    // Auto-poll jobs status every 4 seconds if any job is rendering
    const interval = setInterval(() => {
      api.getJobs().then(updatedJobs => {
        setJobs(updatedJobs);
        // check if any active job progressed
        const rendering = updatedJobs.some(j => j.status === 'rendering' || j.status === 'queued');
        if (rendering) {
          api.getLessons().then(setLessons);
          api.getMetrics().then(setMetrics);
        }
      }).catch(() => {});
    }, 4000);

    return () => clearInterval(interval);
  }, [refreshData]);

  const triggerDailyAutoRun = async () => {
    showToast('နေ့စဉ် အလိုအလျောက် Content ထုတ်လုပ်မှု စတင်နေပါပြီ... (Starting Auto-Production)', 'info');
    try {
      const res = await api.runDailyAutomation();
      if (res.success) {
        showToast(res.message, 'success');
        await refreshData();
        if (res.lesson) {
          setActiveLesson(res.lesson);
          setTab('studio');
        }
      } else {
        showToast(res.message, 'warn');
      }
    } catch (err: any) {
      showToast(err.message || 'Auto-run failed', 'error');
    }
  };

  return (
    <AppContext.Provider
      value={{
        tab,
        setTab,
        language,
        setLanguage,
        lessons,
        jobs,
        accounts,
        scheduledPosts,
        providers,
        metrics,
        settings,
        logs,
        activeLesson,
        setActiveLesson,
        activeJob,
        setActiveJob,
        isLoading,
        refreshData,
        toasts,
        showToast,
        removeToast,
        triggerDailyAutoRun,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
