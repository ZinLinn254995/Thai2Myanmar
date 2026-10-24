import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { LessonScript, DifficultyLevel, LessonStatus } from '../types/index.ts';
import { api } from '../services/api.ts';
import { 
  Sparkles, 
  Save, 
  Volume2, 
  RefreshCw, 
  Play, 
  Clapperboard, 
  Wand2, 
  Check, 
  Flame, 
  Layers, 
  MessageSquare, 
  HelpCircle, 
  Share2, 
  Sliders,
  ChevronDown,
  CheckCircle2
} from 'lucide-react';

export const ScriptStudio: React.FC = () => {
  const { 
    language, 
    activeLesson, 
    setActiveLesson, 
    refreshData, 
    showToast, 
    setTab 
  } = useApp();

  // Generator form state
  const [showGenerateModal, setShowGenerateModal] = useState(!activeLesson);
  const [topicInput, setTopicInput] = useState('');
  const [difficultyInput, setDifficultyInput] = useState<DifficultyLevel>('Beginner');
  const [categoryInput, setCategoryInput] = useState('Daily Conversation');
  const [durationInput, setDurationInput] = useState<number>(65);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Active editable lesson state
  const [editedLesson, setEditedLesson] = useState<LessonScript | null>(activeLesson);
  const [isSaving, setIsSaving] = useState(false);

  // Section Rewrite State
  const [rewriteSection, setRewriteSection] = useState<string | null>(null);
  const [rewriteInstruction, setRewriteInstruction] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);

  // Audio Playback Preview State
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  useEffect(() => {
    if (activeLesson) {
      setEditedLesson(JSON.parse(JSON.stringify(activeLesson)));
    }
  }, [activeLesson]);

  const handleGenerate = async () => {
    if (!topicInput.trim()) {
      showToast('သင်ခန်းစာ Topic အကြောင်းအရာ ရိုက်ထည့်ပါ', 'warn');
      return;
    }

    setIsGenerating(true);
    showToast('Gemini 3.8 Flash ဖြင့် ထိုင်း-မြန်မာ သင်ခန်းစာ ထုတ်လုပ်နေပါသည်...', 'info');

    try {
      const generated = await api.generateLesson({
        topic: topicInput,
        difficulty: difficultyInput,
        targetDurationSec: durationInput,
        category: categoryInput,
        customInstructions: customPrompt,
      });

      showToast(`"${generated.title}" သင်ခန်းစာ ထုတ်လုပ်ပြီးပါပြီ!`, 'success');
      await refreshData();
      setActiveLesson(generated);
      setEditedLesson(generated);
      setShowGenerateModal(false);
      setTopicInput('');
    } catch (err: any) {
      showToast(err.message || 'Generation failed', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!editedLesson) return;
    setIsSaving(true);
    try {
      const saved = await api.saveLesson(editedLesson);
      showToast('ဇာတ်ညွှန်း အောင်မြင်စွာ သိမ်းဆည်းပြီးပါပြီ (Script saved)', 'success');
      await refreshData();
      setActiveLesson(saved);
      setEditedLesson(saved);
    } catch (err: any) {
      showToast(err.message || 'Failed to save', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: LessonStatus) => {
    if (!editedLesson) return;
    const updated = { ...editedLesson, status: newStatus };
    setEditedLesson(updated);
    try {
      await api.saveLesson(updated);
      showToast(`Status changed to ${newStatus}`, 'info');
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Status update failed', 'error');
    }
  };

  const handleRewriteSection = async (section: string) => {
    if (!editedLesson || !rewriteInstruction.trim()) {
      showToast('ပြန်လည်ပြင်ဆင်လိုသော ညွှန်ကြားချက် ရိုက်ထည့်ပါ', 'warn');
      return;
    }

    setIsRewriting(true);
    try {
      const updated = await api.rewriteSection(editedLesson.id, section, rewriteInstruction);
      setEditedLesson(updated);
      setActiveLesson(updated);
      showToast(`"${section}" အပိုင်းကို Gemini ဖြင့် ပြန်လည်ရေးသားပြီးပါပြီ`, 'success');
      setRewriteSection(null);
      setRewriteInstruction('');
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Rewrite failed', 'error');
    } finally {
      setIsRewriting(false);
    }
  };

  const playVoicePreview = async (text: string, lang: 'th-TH' | 'my-MM', id: string) => {
    setPlayingAudioId(id);
    try {
      // First try browser native speech synthesis for immediate response
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.95;
        utterance.onend = () => setPlayingAudioId(null);
        utterance.onerror = () => setPlayingAudioId(null);
        window.speechSynthesis.speak(utterance);
      } else {
        // Fallback to server audio synthesis endpoint
        const res = await api.generateVoice(text, lang);
        if (res.data?.audioBase64) {
          const audio = new Audio(`data:${res.data.mimeType};base64,${res.data.audioBase64}`);
          audio.onended = () => setPlayingAudioId(null);
          audio.play();
        } else {
          setPlayingAudioId(null);
        }
      }
    } catch (err) {
      console.error(err);
      setPlayingAudioId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-cyan-400" />
            <span>{language === 'mm' ? 'AI ဇာတ်ညွှန်း ဖန်တီးခန်း' : 'AI Script Studio'}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {language === 'mm'
              ? 'ထိုင်းစာလုံး၊ တိကျသော မြန်မာအသံထွက်၊ မြန်မာဘာသာပြန်နှင့် 5-Scene TikTok ဇာတ်ညွှန်းများ ဖန်တီးပြင်ဆင်ခြင်း'
              : 'Architect, polish, and synthesize authentic Thai lessons with Burmese phonetics.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowGenerateModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>{language === 'mm' ? 'AI အသစ်ဖန်တီးမည်' : 'New AI Generation'}</span>
          </button>

          {editedLesson && (
            <>
              {/* Status Selector */}
              <div className="relative">
                <select
                  value={editedLesson.status}
                  onChange={(e) => handleStatusChange(e.target.value as LessonStatus)}
                  className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Draft">Status: Draft</option>
                  <option value="Approved">Status: Approved</option>
                  <option value="Ready">Status: Ready</option>
                  <option value="Scheduled">Status: Scheduled</option>
                  <option value="Published">Status: Published</option>
                </select>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'သိမ်းဆည်းနေ...' : 'Save Script'}</span>
              </button>

              {/* Go to Video Renderer */}
              <button
                onClick={() => {
                  if (editedLesson) {
                    setActiveLesson(editedLesson);
                    setTab('production');
                  }
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-xs font-semibold text-white shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.02]"
              >
                <Clapperboard className="w-3.5 h-3.5" />
                <span>{language === 'mm' ? '9:16 Video ထုတ်လုပ်မည်' : 'Open in Video Studio'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {!editedLesson ? (
        <div className="p-16 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white">
            {language === 'mm' ? 'မည်သည့် သင်ခန်းစာမျှ ရွေးချယ်မထားပါ' : 'No Lesson Selected'}
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {language === 'mm'
              ? 'Gemini 3.8 Flash AI ဖြင့် စတင်ဖန်တီးပါ သို့မဟုတ် သင်ခန်းစာစာကြည့်တိုက်မှ တစ်ခုခုကို ရွေးချယ်ပါ။'
              : 'Generate a new lesson with Gemini AI or pick an existing one from the library.'}
          </p>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-semibold text-xs shadow-lg transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>{language === 'mm' ? 'ယခုပင် ဖန်တီးမည်' : 'Generate Now'}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: Full Script Breakdown */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Metadata Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-cyan-400 font-semibold">{editedLesson.difficulty} • {editedLesson.category}</span>
                <span className="flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Target: {editedLesson.targetDurationSec}s (TikTok Rewards Check ✓)</span>
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Lesson Title (မြန်မာခေါင်းစဉ်)
                </label>
                <input
                  type="text"
                  value={editedLesson.title}
                  onChange={(e) => setEditedLesson({ ...editedLesson, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm font-bold text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Lesson Objective (သင်ခန်းစာ ရည်ရွယ်ချက်)
                </label>
                <textarea
                  rows={2}
                  value={editedLesson.objectiveMm}
                  onChange={(e) => setEditedLesson({ ...editedLesson, objectiveMm: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* 1. Viral TikTok Hook Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 text-[10px] font-mono font-bold">
                    SCENE 1 (HOOK)
                  </div>
                  <h3 className="text-sm font-bold text-white">
                    {language === 'mm' ? '3-Second Viral Hook (အာရုံဖမ်းစားမှု)' : '3-Second Retention Hook'}
                  </h3>
                </div>
                <button
                  onClick={() => setRewriteSection('hook')}
                  className="text-xs text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 font-medium"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>AI Rewrite</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 uppercase font-mono">Thai Hook Line</span>
                    <button
                      onClick={() => playVoicePreview(editedLesson.hook.hookThai, 'th-TH', 'hook-th')}
                      className="p-1 text-slate-400 hover:text-cyan-400"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="font-thai text-base text-cyan-300 font-semibold">{editedLesson.hook.hookThai}</div>
                  <div className="text-[11px] text-slate-400 font-mono">{editedLesson.hook.hookRoman}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 uppercase font-mono">Myanmar Viral Hook</span>
                    <button
                      onClick={() => playVoicePreview(editedLesson.hook.hookMm, 'my-MM', 'hook-mm')}
                      className="p-1 text-slate-400 hover:text-emerald-400"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="font-myanmar text-sm text-slate-200">{editedLesson.hook.hookMm}</div>
                  <div className="text-[10px] text-amber-400/90 font-mono">Retention: {editedLesson.hook.retentionAngle}</div>
                </div>
              </div>
            </div>

            {/* 2. Core Vocabulary & Phonetic Tones */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[10px] font-mono font-bold">
                    VOCABULARY & PHONETICS
                  </div>
                  <h3 className="text-sm font-bold text-white">
                    {language === 'mm' ? 'ထိုင်းစာလုံးနှင့် မြန်မာအသံထွက်များ' : 'Vocabulary & Burmese Phonetic Guide'}
                  </h3>
                </div>
                <button
                  onClick={() => setRewriteSection('vocabulary')}
                  className="text-xs text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 font-medium"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>AI Rewrite</span>
                </button>
              </div>

              <div className="space-y-3">
                {editedLesson.vocabulary.map((vocab, index) => (
                  <div 
                    key={vocab.id || index}
                    className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 hover:border-slate-600 transition-colors space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-indigo-950 text-indigo-300 text-xs font-mono font-bold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <div>
                          <span className="font-thai text-lg font-bold text-white mr-2">
                            {vocab.thai}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            ({vocab.roman})
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {vocab.toneDescription && (
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-cyan-400 border border-slate-700">
                            {vocab.toneDescription}
                          </span>
                        )}
                        <button
                          onClick={() => playVoicePreview(vocab.thai, 'th-TH', `v-${index}`)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 transition-colors"
                          title="Listen to Thai pronunciation"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-800/80 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-amber-400 font-semibold uppercase">မြန်မာအသံထွက်:</span>
                        <span className="font-myanmar font-semibold text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                          {vocab.myanmarPronounce}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 uppercase">ဘာသာပြန်:</span>
                        <span className="font-myanmar text-slate-200">
                          {vocab.myanmarMeaning}
                        </span>
                      </div>
                    </div>

                    {vocab.usageTip && (
                      <div className="text-[11px] text-slate-400 bg-slate-800/30 p-2 rounded-lg font-myanmar">
                        💡 {vocab.usageTip}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Daily Dialogue in Action */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-[10px] font-mono font-bold">
                    DAILY DIALOGUE
                  </div>
                  <h3 className="text-sm font-bold text-white">
                    {language === 'mm' ? 'နေ့စဉ်သုံး စကားပြောခန်း' : 'Real-Life Context Dialogue'}
                  </h3>
                </div>
                <button
                  onClick={() => setRewriteSection('dialogue')}
                  className="text-xs text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 font-medium"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>AI Rewrite</span>
                </button>
              </div>

              <div className="space-y-3">
                {editedLesson.dialogue.map((line, idx) => (
                  <div 
                    key={line.id || idx}
                    className={`p-3.5 rounded-xl border space-y-2 ${
                      line.speaker === 'A' 
                        ? 'bg-slate-800/70 border-cyan-500/30' 
                        : 'bg-slate-800/40 border-purple-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-cyan-300 font-mono">
                        Speaker {line.speaker} {line.speakerLabelMm ? `(${line.speakerLabelMm})` : ''}
                      </span>
                      <button
                        onClick={() => playVoicePreview(line.thai, 'th-TH', `d-${idx}`)}
                        className="p-1 text-slate-400 hover:text-cyan-300"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="font-thai text-base text-white font-medium">
                      {line.thai}
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      {line.roman}
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row gap-2 text-xs">
                      <div className="text-amber-300 font-myanmar">
                        🗣️ <span className="font-semibold">{line.myanmarPronounce}</span>
                      </div>
                      <div className="text-slate-300 font-myanmar">
                        ➡️ {line.myanmarMeaning}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Interactive Quiz Challenge */}
            {editedLesson.exercise && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold">
                      QUIZ & ENGAGEMENT
                    </div>
                    <h3 className="text-sm font-bold text-white">
                      {language === 'mm' ? 'လေ့ကျင့်ခန်း ဉာဏ်စမ်း' : 'Interactive Practice Quiz'}
                    </h3>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-3 text-xs">
                  <div className="font-bold text-white text-sm font-myanmar">
                    ❓ {editedLesson.exercise.questionMm}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {editedLesson.exercise.options.map((opt, i) => (
                      <div
                        key={i}
                        className={`p-2.5 rounded-lg border flex items-center justify-between ${
                          i === editedLesson.exercise.correctAnswerIndex
                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                            : 'bg-slate-800 border-slate-700 text-slate-300'
                        }`}
                      >
                        <span>{opt}</span>
                        {i === editedLesson.exercise.correctAnswerIndex && (
                          <Check className="w-4 h-4 text-emerald-400" />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="text-[11px] text-slate-400 bg-slate-800/40 p-2.5 rounded-lg font-myanmar">
                    💡 ရှင်းလင်းချက်: {editedLesson.exercise.explanationMm}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: TikTok Metadata & 5-Scene Plan */}
          <div className="space-y-6">
            {/* TikTok Publishing Metadata Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">TikTok Metadata</h3>
                </div>
                <button
                  onClick={() => setRewriteSection('tiktokCaption')}
                  className="text-xs text-cyan-400 hover:text-cyan-300"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  TikTok Caption (စာသား)
                </label>
                <textarea
                  rows={3}
                  value={editedLesson.tiktokCaption}
                  onChange={(e) => setEditedLesson({ ...editedLesson, tiktokCaption: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Hashtags
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {editedLesson.hashtags.map((tag, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-mono text-cyan-300 border border-slate-700">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* 5-Scene Video Production Storyboard */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <Clapperboard className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white">
                    {language === 'mm' ? '9:16 Video Scenes (၅ ခန်း)' : '9:16 Video Storyboard'}
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-cyan-400">
                  {editedLesson.scenes?.length || 5} Scenes
                </span>
              </div>

              <div className="space-y-2.5">
                {editedLesson.scenes?.map((scene) => (
                  <div
                    key={scene.sceneNumber}
                    className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-cyan-400">
                        Scene {scene.sceneNumber}: {scene.title}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {scene.durationSec}s
                      </span>
                    </div>

                    <div className="font-thai text-xs text-white font-medium line-clamp-1">
                      {scene.thaiText}
                    </div>
                    <div className="text-[11px] text-slate-300 font-myanmar line-clamp-1">
                      {scene.myanmarMeaning}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  setActiveLesson(editedLesson);
                  setTab('production');
                }}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <Clapperboard className="w-4 h-4" />
                <span>{language === 'mm' ? 'ဗီဒီယို စတူဒီယိုတွင် စမ်းသပ်ကြည့်ရှုမည်' : 'Open in Video Studio'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {language === 'mm' ? 'Gemini AI ဖြင့် သင်ခန်းစာသစ် ဖန်တီးမည်' : 'Generate New Thai Lesson'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Model: Google Gemini 3.8 Flash (Server-side)
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowGenerateModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                  Topic / ခေါင်းစဉ် <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. ထိုင်းစားသောက်ဆိုင်မှာ ဟင်းမှာနည်း၊ ဈေးဆစ်နည်း၊ အလုပ်ခွင်သုံး စကားစုများ"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                    Difficulty Level
                  </label>
                  <select
                    value={difficultyInput}
                    onChange={(e) => setDifficultyInput(e.target.value as DifficultyLevel)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Beginner">Beginner (အခြေခံ)</option>
                    <option value="Intermediate">Intermediate (အလယ်အလတ်)</option>
                    <option value="Advanced">Advanced (အဆင့်မြင့်)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                    Target Duration (Seconds)
                  </label>
                  <input
                    type="number"
                    min={60}
                    max={120}
                    value={durationInput}
                    onChange={(e) => setDurationInput(parseInt(e.target.value) || 65)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-[10px] text-emerald-400 mt-1 block">
                    ✓ &gt;60s qualifies for TikTok Creator Rewards
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                  Additional Instructions / စိတ်ကြိုက်ညွှန်ကြားချက်
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. ဂျပန်ရောက် မြန်မာများအတွက်ပါ အသုံးဝင်မည့် အကြံပြုချက်များ ထည့်ပေးပါ၊ အသံထွက်ကို လွယ်ကူရိုးရှင်းစွာ ရေးပေးပါ..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                မလုပ်တော့ပါ (Cancel)
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Gemini AI ထုတ်လုပ်နေပါသည်...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>ထုတ်လုပ်မည် (Generate Lesson)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Section Rewrite Modal */}
      {rewriteSection && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">
                  AI Rewrite: Section "{rewriteSection}"
                </h3>
              </div>
              <button onClick={() => setRewriteSection(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                ညွှန်ကြားချက် ရိုက်ထည့်ပါ (Rewrite Prompt)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. ပိုမိုဆွဲဆောင်မှုရှိသော Hook ဖြစ်အောင် ပြင်ပေးပါ၊ ဈေးဆစ်သည့် စကားစု ပိုထည့်ပေးပါ..."
                value={rewriteInstruction}
                onChange={(e) => setRewriteInstruction(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRewriteSection(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRewriteSection(rewriteSection)}
                disabled={isRewriting}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {isRewriting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                <span>ပြန်လည်ရေးသားမည် (Rewrite)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
