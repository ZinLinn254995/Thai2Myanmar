import React, { useState, useEffect } from 'react';
import { QualityAuditRecord } from '../types/index.ts';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  RefreshCw, 
  Check, 
  Flame,
  FileCheck,
  Video,
  Info,
  Layers,
  Sparkles
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
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Pedagogical & Technical Quality Gate</h3>
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
            <span>Auditing pedagogical structure, media streams, and linguistic heuristics...</span>
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
                    {audit.passed ? '✓ PASSED QUALITY CRITERIA' : '⚠️ ATTENTION / VERIFICATION NEEDED'}
                  </div>
                  <div className="text-xs opacity-80">
                    {audit.passed ? 'Eligible for production rendering and scheduled publishing' : 'Flags detected that should be reviewed prior to release'}
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

            {/* Tier 1: Structural Completeness */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Tier 1: Structural & Format Completeness</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  { label: 'Target Duration >= 60s (Creator Rewards)', ok: audit.checks.durationOver60s },
                  { label: 'Thai Unicode Characters Present', ok: audit.checks.thaiScriptValid },
                  { label: 'Burmese Phonetics Guidance Present', ok: audit.checks.burmesePronunciationPresent },
                  { label: 'Burmese Translation Meaning Present', ok: audit.checks.burmeseTranslationPresent },
                  { label: '3-Second Retention Hook Structure', ok: audit.checks.viralHookPresent },
                  { label: 'Interactive Quiz Challenge Structure', ok: audit.checks.quizInteractive },
                  { label: 'Curriculum Repetition Check', ok: !audit.checks.repetitionDetected },
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
            </div>

            {/* Tier 2: Technical Media Verification */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider">
                <Video className="w-3.5 h-3.5 text-indigo-400" />
                <span>Tier 2: Technical Video Stream Integrity (ffprobe)</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Rendered Video File Status:</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                    audit.checks.videoIntegrityVerified 
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}>
                    {audit.checks.videoIntegrityVerified ? 'VALIDATED (1080x1920 MP4)' : 'NOT YET RENDERED / PENDING'}
                  </span>
                </div>
                {audit.mediaChecks && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px] text-slate-400">
                    <div>Video: <span className="text-slate-200">{audit.mediaChecks.videoCodecValid ? 'H.264' : 'N/A'}</span></div>
                    <div>Audio: <span className="text-slate-200">{audit.mediaChecks.audioCodecValid ? 'AAC' : 'N/A'}</span></div>
                    <div>Duration: <span className="text-slate-200">{audit.mediaChecks.actualVideoDurationSec?.toFixed(1) || '0'}s</span></div>
                    <div>Format: <span className="text-slate-200">{audit.mediaChecks.isVerticalPortrait ? '9:16 Vertical' : 'Unknown'}</span></div>
                  </div>
                )}
              </div>
            </div>

            {/* Tier 3: Linguistic Accuracy Transparency Notice */}
            <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-xs space-y-1.5 text-indigo-200">
              <div className="flex items-center gap-1.5 font-bold text-cyan-300 text-[11px] uppercase tracking-wider">
                <Info className="w-3.5 h-3.5" />
                <span>Linguistic Accuracy Transparency Notice</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300">
                {audit.linguisticVerification?.disclaimer || 
                  'Automated checks verify script encoding, phonetic presence, and structural syntax. Deep tone contours and colloquial semantics (e.g. ครับ/ค่ะ particles) should receive native speaker review.'}
              </p>
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
