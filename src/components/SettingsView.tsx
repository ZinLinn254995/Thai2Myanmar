import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../services/api.ts';
import { 
  Settings, 
  Save, 
  Globe, 
  Flame, 
  ShieldCheck, 
  Volume2, 
  Key,
  CheckCircle2
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { language, settings, refreshData, showToast } = useApp();

  const [timezone, setTimezone] = useState(settings?.timezone || 'Asia/Tokyo');
  const [dailyLimit, setDailyLimit] = useState(settings?.dailyVideoLimit || 3);
  const [thaiVoice, setThaiVoice] = useState(settings?.defaultThaiVoice || 'female-polite');
  const [mmVoice, setMmVoice] = useState(settings?.defaultMyanmarVoice || 'female-clear');
  const [rewardsCheck, setRewardsCheck] = useState(settings?.creatorRewardsDurationCheck ?? true);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.updateSettings({
        timezone,
        dailyVideoLimit: dailyLimit,
        defaultThaiVoice: thaiVoice,
        defaultMyanmarVoice: mmVoice,
        creatorRewardsDurationCheck: rewardsCheck,
      });
      showToast('ဆက်တင်များ သိမ်းဆည်းပြီးပါပြီ (Settings saved)', 'success');
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Save failed', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-400" />
          <span>{language === 'mm' ? 'စနစ် ဆက်တင်များနှင့် စည်းမျဉ်းများ' : 'Platform Settings & Policies'}</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          {language === 'mm'
            ? 'TikTok Creator Rewards သတ်မှတ်ချက်များ၊ အသံပုံစံများနှင့် အချိန်ဇုန်များ ပြင်ဆင်ခြင်း'
            : 'Configure regional posting parameters, default TTS personas, and policy constraints.'}
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          {/* Timezone */}
          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
              Timezone (Primary Publishing Timezone)
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="Asia/Tokyo">Asia/Tokyo (Japan - JST UTC+9)</option>
              <option value="Asia/Yangon">Asia/Yangon (Myanmar - MMT UTC+6:30)</option>
              <option value="Asia/Bangkok">Asia/Bangkok (Thailand - ICT UTC+7)</option>
            </select>
          </div>

          {/* Daily Limit */}
          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
              Daily Video Production Cap
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={dailyLimit}
              onChange={(e) => setDailyLimit(parseInt(e.target.value) || 3)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Default Thai Voice Persona */}
          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
              Default Thai Voice Style
            </label>
            <select
              value={thaiVoice}
              onChange={(e) => setThaiVoice(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="female-polite">Female Polite (Standard Paiboon/Kha tone)</option>
              <option value="male-formal">Male Formal (Khrap polite tone)</option>
              <option value="casual-modern">Casual Modern (Conversational)</option>
            </select>
          </div>

          {/* Default Myanmar Voice Persona */}
          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
              Default Myanmar Teacher Voice Style
            </label>
            <select
              value={mmVoice}
              onChange={(e) => setMmVoice(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="female-clear">Female Encouraging Teacher (အသံကြည်လင်ပြတ်သား)</option>
              <option value="male-calm">Male Calm Instructor (တည်ငြိမ်သော ဆရာအသံ)</option>
            </select>
          </div>
        </div>

        {/* Creator Rewards Checkbox Card */}
        <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-white text-xs">
                TikTok Creator Rewards Duration Check (&gt; 60 seconds)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Enforces a minimum script duration of 60 seconds so all produced vertical videos qualify for the TikTok Creator Rewards monetizable video threshold.
            </p>
          </div>

          <button
            onClick={() => setRewardsCheck(!rewardsCheck)}
            className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
              rewardsCheck ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
          >
            <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
              rewardsCheck ? 'right-0.5' : 'left-0.5'
            }`} />
          </button>
        </div>

        {/* Security & Secrets Info Banner */}
        <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-800/40 space-y-2">
          <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Security & API Key Isolation (Server-Side)</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            All API calls to Google Gemini and Voice Synthesis are executed strictly on the backend Node.js runtime. No API keys, credentials, or tokens are exposed to the client-side browser bundle.
          </p>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'သိမ်းဆည်းနေ...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
