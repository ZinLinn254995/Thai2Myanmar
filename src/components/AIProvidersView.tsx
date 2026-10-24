import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../services/api.ts';
import { 
  Cpu, 
  CheckCircle2, 
  AlertCircle, 
  Settings2, 
  DollarSign, 
  Layers, 
  RefreshCw,
  Power,
  ShieldCheck
} from 'lucide-react';

export const AIProvidersView: React.FC = () => {
  const { language, providers, refreshData, showToast } = useApp();

  const handleToggle = async (id: string, current: boolean) => {
    try {
      await api.updateProvider(id, { enabled: !current });
      showToast('Provider status updated', 'info');
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Update failed', 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Cpu className="w-6 h-6 text-cyan-400" />
          <span>{language === 'mm' ? 'AI Provider Architecture & Model Adapters' : 'AI Providers & Service Adapters'}</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          {language === 'mm'
            ? 'Modular Adapter Interface ဖြင့် တည်ဆောက်ထားသော Text Generation၊ Voice/TTS၊ Image နှင့် Video Engine များ စီမံခန့်ခွဲမှု'
            : 'Configure decoupled AI adapters, model endpoints, retry policies, and tracking status.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {providers.map((p) => {
          const isReal = p.isRealConnected;

          return (
            <div
              key={p.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                    p.enabled ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {p.category.toUpperCase().slice(0, 3)}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{p.name}</h3>
                    <div className="font-mono text-[11px] text-slate-400">{p.modelName}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                    p.status === 'active' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                    p.status === 'not_configured' ? 'bg-slate-800 text-slate-400 border-slate-700' :
                    'bg-amber-950 text-amber-300 border-amber-800'
                  }`}>
                    {p.status.toUpperCase()}
                  </span>

                  <button
                    onClick={() => handleToggle(p.id, p.enabled)}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      p.enabled 
                        ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/20' 
                        : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'
                    }`}
                    title={p.enabled ? 'Disable Provider' : 'Enable Provider'}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-myanmar bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                {p.notes}
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-800 text-slate-400">
                <div>
                  <span className="text-[10px] uppercase font-mono block text-slate-500">Unit Cost:</span>
                  <span className="font-mono text-white font-medium">
                    ${p.costPerUnitUsd} / {p.unitType}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono block text-slate-500">Retry Policy:</span>
                  <span className="font-mono text-slate-300">
                    Max {p.retryPolicy.maxRetries} retries ({p.retryPolicy.backoffMs}ms)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-400">
                  Usage count: <span className="font-mono text-cyan-400">{p.usageCount}</span> calls
                </span>
                <span className={`text-[11px] font-mono ${isReal ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {isReal ? '✓ Real API Active' : '○ Standby Adapter'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
