import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../services/api.ts';
import { 
  CalendarClock, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Globe, 
  Layers, 
  Save, 
  Clock
} from 'lucide-react';

export const SchedulerView: React.FC = () => {
  const { 
    language, 
    settings, 
    refreshData, 
    showToast, 
    triggerDailyAutoRun 
  } = useApp();

  const [dailyLimit, setDailyLimit] = useState(settings?.dailyVideoLimit || 3);
  const [timezone, setTimezone] = useState(settings?.timezone || 'Asia/Tokyo');
  const [autoPipeline, setAutoPipeline] = useState(settings?.autoPipelineEnabled || false);
  const [requireApproval, setRequireApproval] = useState(settings?.requireManualApproval ?? true);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await api.updateSettings({
        dailyVideoLimit: dailyLimit,
        timezone,
        autoPipelineEnabled: autoPipeline,
        requireManualApproval: requireApproval,
      });
      showToast('အလိုအလျောက် ဆက်တင်များ သိမ်းဆည်းပြီးပါပြီ (Scheduler settings saved)', 'success');
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <CalendarClock className="w-6 h-6 text-amber-400" />
            <span>{language === 'mm' ? 'အလိုအလျောက် အချိန်ဇယားနှင့် Scheduler' : 'Automation Pipeline & Scheduler'}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {language === 'mm'
              ? 'နေ့စဉ် TikTok Content ထုတ်လုပ်မှု အလိုအလျောက်လည်ပတ်ရန် Schedule၊ Timezone နှင့် Limit များ'
              : 'Automate daily Thai language video production with safety limits, duplicate checks, and timezone control.'}
          </p>
        </div>

        <button
          onClick={triggerDailyAutoRun}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-semibold text-xs shadow-md transition-all hover:scale-[1.02]"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{language === 'mm' ? 'Manual Run ယခုစတင်မည်' : 'Run Pipeline Now'}</span>
        </button>
      </div>

      {/* Pipeline Stage Architecture Diagram */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Automated Daily Workflow Pipeline (အဆင့်ဆင့် လုပ်ဆောင်ပုံ)</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
          {[
            { step: '1. Topic Selection', desc: 'Duplicate Check & Topic Rotation' },
            { step: '2. Gemini Scripting', desc: 'Thai, Phonetics & Burmese Translation' },
            { step: '3. Quality Gate', desc: 'Pedagogical Accuracy Verification' },
            { step: '4. Voice Synthesis', desc: 'Thai & Myanmar Audio Track Sync' },
            { step: '5. 9:16 Video Render', desc: '1080x1920 Vertical Compositor' },
            { step: '6. TikTok Ready', desc: requireApproval ? 'Held for Manual Approval' : 'Auto-Publish Ready' },
          ].map((s, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
              <div className="font-bold text-cyan-400 text-[11px]">{s.step}</div>
              <div className="text-[10px] text-slate-300 leading-tight">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scheduler Configuration Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3">
          {language === 'mm' ? 'Scheduler စည်းမျဉ်းများနှင့် ကန့်သတ်ချက်များ' : 'Scheduler Rules & Guardrails'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          {/* Daily Limit */}
          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
              Daily Video Generation Limit (တစ်ရက် အများဆုံး ဗီဒီယို အရေအတွက်)
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={dailyLimit}
              onChange={(e) => setDailyLimit(parseInt(e.target.value) || 3)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Default: 3 videos per day (Enforces pacing for TikTok account growth).
            </span>
          </div>

          {/* Timezone */}
          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
              Timezone (အချိန်ဇုန် သတ်မှတ်ချက်)
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="Asia/Tokyo">Asia/Tokyo (Japan Region - JST UTC+9)</option>
              <option value="Asia/Yangon">Asia/Yangon (Myanmar Time - MMT UTC+6:30)</option>
              <option value="Asia/Bangkok">Asia/Bangkok (Thailand Time - ICT UTC+7)</option>
            </select>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Optimized for TikTok Japan peak viewer activity (18:00 - 22:00 JST).
            </span>
          </div>

          {/* Pipeline Switch */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div>
              <div className="font-bold text-white text-xs">
                Auto-Pipeline Enabled (အလိုအလျောက် လည်ပတ်မှု ဖွင့်/ပိတ်)
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Automatically triggers generation on scheduled intervals
              </div>
            </div>
            <button
              onClick={() => setAutoPipeline(!autoPipeline)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                autoPipeline ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                autoPipeline ? 'right-0.5' : 'left-0.5'
              }`} />
            </button>
          </div>

          {/* Require Manual Approval */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div>
              <div className="font-bold text-white text-xs">
                Require Manual Approval (လူကိုယ်တိုင် အတည်ပြုချက် လိုအပ်ခြင်း)
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Mandatory review before videos are marked ready to publish
              </div>
            </div>
            <button
              onClick={() => setRequireApproval(!requireApproval)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                requireApproval ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                requireApproval ? 'right-0.5' : 'left-0.5'
              }`} />
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'သိမ်းဆည်းနေ...' : 'Save Scheduler Rules'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
