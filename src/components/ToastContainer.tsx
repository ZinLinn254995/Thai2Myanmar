import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4 sm:px-0">
      {toasts.map(toast => {
        let Icon = Info;
        let borderClass = 'border-slate-700 bg-slate-900 text-slate-100';

        if (toast.type === 'success') {
          Icon = CheckCircle2;
          borderClass = 'border-emerald-500/50 bg-slate-900 text-emerald-300 shadow-emerald-500/10';
        } else if (toast.type === 'error') {
          Icon = AlertCircle;
          borderClass = 'border-rose-500/50 bg-slate-900 text-rose-300 shadow-rose-500/10';
        } else if (toast.type === 'warn') {
          Icon = AlertTriangle;
          borderClass = 'border-amber-500/50 bg-slate-900 text-amber-300 shadow-amber-500/10';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-2 duration-200 ${borderClass}`}
          >
            <Icon className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs font-medium leading-relaxed">
              {toast.text}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
