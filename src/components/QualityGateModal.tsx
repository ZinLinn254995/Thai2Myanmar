import React, { useState, useEffect } from 'react';
import { QualityAuditRecord } from '../../server/db.ts';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  RefreshCw, 
  Check, 
  Flame,
  FileCheck,
  Video
} from 'lucide-react';

interface Props {
  lessonId: string;
  lessonTitle: string;
  onClose: () => void;
}

export const QualityGateModal: React.FC<Props> = ({ lessonId, lessonTitle, onClose }) => {
  const [audit, setAudit] = useState<QualityAuditRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuditing, setIsAuditing] = useState(false);

  const fetchAudit = async () => {
    try {
      const res = await fetch(`/api/quality/audit/${lessonId}`);
      const data = await res.json();
      if (data.success && data.data) {
        setAudit(data.data);
      } else {
        // Trigger audit now
        await runAudit();
      }
    } catch {
      await runAudit();
    } finally {
      setLoading(false);
    }
  };

  const runAudit = async () => {
    setIsAuditing(true);
    try {
      const res = await fetch(`/api/quality/audit/${lessonId}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setAudit(data.data);
      }
    } catch (err) {
      console.error('Audit failed:', err);
    } finally {
      setIsAuditing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit();
  }, [lessonId]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Pedagogical Quality Gate Audit</h3>
              <p className="text-xs text-slate-400 font-myanmar line-clamp-1">{lessonTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
            <span>Auditing linguistic rules and video integrity...</span>
          </div>
        ) : !audit ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            <span>Audit unavailable. Click below to run.</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Score Banner */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
              audit.passed 
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
                : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
            }`}>
              <div className="flex items-center gap-3">
                <div className="text-3xl font-black font-mono">{audit.score}%</div>
                <div>
                  <div className="font-bold text-sm">
                    {audit.passed ? '✓ PASSED QUALITY GATE' : '⚠️ ATTENTION NEEDED'}
                  </div>
                  <div className="text-xs opacity-80">
                    {audit.passed ? 'Eligible for production and TikTok publishing' : 'Issues detected before publication'}
                  </div>
                </div>
              </div>

              <button
                onClick={runAudit}
                disabled={isAuditing}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-white border border-slate-700 flex items-center gap-1.5 font-medium disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
                <span>Re-Audit</span>
              </button>
            </div>

            {/* Checklist Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {[
                { label: 'TikTok Duration > 60s Check', ok: audit.checks.durationOver60s },
                { label: 'Authentic Thai Script Validated', ok: audit.checks.thaiScriptValid },
                { label: 'Burmese Phonetics Guide (မြန်မာအသံထွက်)', ok: audit.checks.burmesePronunciationPresent },
                { label: 'Burmese Translation Complete (မြန်မာဘာသာပြန်)', ok: audit.checks.burmeseTranslationPresent },
                { label: '3-Second Retention Hook', ok: audit.checks.viralHookPresent },
                { label: 'Interactive Practice Quiz', ok: audit.checks.quizInteractive },
                { label: 'No Duplicate Vocabulary Detected', ok: !audit.checks.repetitionDetected },
                { label: 'Video Media Integrity Verified', ok: audit.checks.videoIntegrityVerified },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border flex items-center justify-between ${
                    item.ok 
                      ? 'bg-slate-800/40 border-slate-800 text-slate-200' 
                      : 'bg-rose-950/20 border-rose-800/40 text-rose-300'
                  }`}
                >
                  <span className="truncate pr-2">{item.label}</span>
                  {item.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                </div>
              ))}
            </div>

            {/* Recommendations */}
            {audit.recommendationsMm && audit.recommendationsMm.length > 0 && (
              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs space-y-1.5">
                <div className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                  Quality Gate Recommendations:
                </div>
                <ul className="space-y-1 font-myanmar text-slate-300 list-disc list-inside">
                  {audit.recommendationsMm.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
