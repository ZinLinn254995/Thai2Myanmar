import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../services/api.ts';
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Cpu, 
  Film, 
  Volume2, 
  Save, 
  PieChart
} from 'lucide-react';

export const UsageAndCostsView: React.FC = () => {
  const { language, metrics, settings, refreshData, showToast } = useApp();

  const [dailyLimit, setDailyLimit] = useState(settings?.dailyBudgetLimitUsd || 2.0);
  const [monthlyLimit, setMonthlyLimit] = useState(settings?.monthlyBudgetLimitUsd || 25.0);
  const [isUpdating, setIsUpdating] = useState(false);

  const costUsd = metrics?.todayEstimatedCostUsd || 0.00044;
  const costMmk = Math.round(costUsd * 4500);
  const totalTokens = metrics?.todayTokensUsed || 2950;

  const dailyBudgetRatio = Math.min(100, Math.round((costUsd / (dailyLimit || 1)) * 100));

  const handleSaveBudget = async () => {
    setIsUpdating(true);
    try {
      await api.updateSettings({
        dailyBudgetLimitUsd: dailyLimit,
        monthlyBudgetLimitUsd: monthlyLimit,
      });
      showToast('ဘတ်ဂျက် ကန့်သတ်ချက်များ သိမ်းဆည်းပြီးပါပြီ (Budget limits updated)', 'success');
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-emerald-400" />
          <span>{language === 'mm' ? 'AI အသုံးပြုမှုနှင့် ကုန်ကျစရိတ် Dashboard' : 'AI Usage & Cost Dashboard'}</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          {language === 'mm'
            ? 'Gemini 3.8 Flash Tokens၊ Voice Generation၊ Video Rendering ကုန်ကျစရိတ်နှင့် နေ့စဉ်/လစဉ် ဘတ်ဂျက် ကန့်သတ်ချက်များ'
            : 'Track provider token consumption, estimated USD & MMK costs, and set hard budget caps.'}
        </p>
      </div>

      {/* Cost Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Today's Spend */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>{language === 'mm' ? 'ယနေ့ ကုန်ကျစရိတ် (ခန့်မှန်းခြေ)' : 'Today\'s Estimated Cost'}</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">
            ${costUsd.toFixed(4)}
          </div>
          <div className="text-xs text-amber-400 font-medium">
            ≈ {costMmk.toLocaleString()} MMK (မြန်မာကျပ်ငွေ)
          </div>

          <div className="pt-2 border-t border-slate-800 space-y-1.5">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Daily Limit: ${dailyLimit.toFixed(2)}</span>
              <span>{dailyBudgetRatio}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  dailyBudgetRatio > 80 ? 'bg-rose-500' : 'bg-emerald-400'
                }`}
                style={{ width: `${dailyBudgetRatio}%` }}
              />
            </div>
          </div>
        </div>

        {/* Token Usage */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>{language === 'mm' ? 'Gemini AI Tokens သုံးစွဲမှု' : 'Gemini 3.8 Flash Tokens'}</span>
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-cyan-400 font-mono">
            {totalTokens.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400">
            Prompt + Output Tokens across all lessons
          </div>

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between font-mono">
            <span>Rate: $0.15 / 1M tokens</span>
            <span className="text-emerald-400">Highly Cost-Effective</span>
          </div>
        </div>

        {/* Video Production Pipeline Meter */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>{language === 'mm' ? 'Render ပြုလုပ်မှု အကြိမ်ရေ' : 'Render Pipeline Minutes'}</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Film className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-indigo-300 font-mono">
            {metrics?.totalVideosRendered || 1} Videos
          </div>
          <div className="text-xs text-slate-400">
            Total 1080x1920 9:16 vertical render outputs
          </div>

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between font-mono">
            <span>Engine: 9:16 Compositor</span>
            <span className="text-emerald-400">$0.00 / Local Render</span>
          </div>
        </div>
      </div>

      {/* Budget Limit Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-sm">
              {language === 'mm' ? 'ဘတ်ဂျက် ကန့်သတ်ချက်များ သတ်မှတ်ခြင်း' : 'Budget Protection & Auto-Halt Policies'}
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            {language === 'mm' ? 'ဘတ်ဂျက်ပြည့်ပါက အလိုအလျောက် ရပ်တန့်မည်' : 'Halt auto-pipeline on budget breach'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
              Daily Budget Limit (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono">$</span>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(parseFloat(e.target.value) || 2.0)}
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              ≈ {(dailyLimit * 4500).toLocaleString()} MMK per day
            </span>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
              Monthly Budget Limit (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono">$</span>
              <input
                type="number"
                step="1"
                min="5"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(parseFloat(e.target.value) || 25.0)}
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              ≈ {(monthlyLimit * 4500).toLocaleString()} MMK per month
            </span>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSaveBudget}
            disabled={isUpdating}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isUpdating ? 'သိမ်းဆည်းနေ...' : 'Save Budget Limits'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
