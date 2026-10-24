import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { ScheduledPost, PublishingAccount } from '../types/index.ts';
import { api } from '../services/api.ts';
import { 
  Share2, 
  Copy, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Calendar, 
  ShieldCheck, 
  ExternalLink,
  ChevronRight,
  Flame,
  Check
} from 'lucide-react';

export const PublishingHub: React.FC = () => {
  const { 
    language, 
    scheduledPosts, 
    accounts, 
    lessons, 
    activeLesson, 
    refreshData, 
    showToast 
  } = useApp();

  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(scheduledPosts[0] || null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleLessonId, setScheduleLessonId] = useState(activeLesson?.id || (lessons[0]?.id || ''));
  const [scheduleAccountId, setScheduleAccountId] = useState(accounts[0]?.id || '');
  const [scheduleDateTime, setScheduleDateTime] = useState(new Date(Date.now() + 3600000 * 4).toISOString().slice(0, 16));

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmMethod, setConfirmMethod] = useState<'validated_url' | 'manual_declaration'>('validated_url');
  const [confirmUrl, setConfirmUrl] = useState('');
  const [confirmOperatorCheckbox, setConfirmOperatorCheckbox] = useState(false);
  const [confirmNotes, setConfirmNotes] = useState('');

  const jpAccount = accounts.find(a => a.region === 'Japan') || accounts[0];

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} Copy ကူးယူပြီးပါပြီ (Copied to clipboard)`, 'success');
  };

  const handleToggleChecklist = async (postId: string, item: keyof ScheduledPost['checklist'], currentVal: boolean) => {
    try {
      const updated = await api.updateChecklist(postId, item, !currentVal);
      setSelectedPost(updated);
      await refreshData();
      showToast('Checklist updated', 'info');
    } catch (err: any) {
      showToast(err.message || 'Checklist update failed', 'error');
    }
  };

  const handleConfirmPublication = async () => {
    if (!selectedPost) return;

    if (confirmMethod === 'validated_url') {
      const url = confirmUrl.trim();
      const tiktokRegex = /^https?:\/\/(?:[a-zA-Z0-9-]+\.)?tiktok\.com\/[A-Za-z0-9@_./?=&-]+$/i;
      if (!url || !tiktokRegex.test(url)) {
        showToast('ကျေးဇူးပြု၍ မှန်ကန်သော TikTok Video URL ထည့်သွင်းပါ (e.g. https://www.tiktok.com/@thai2myanmar_jp/video/...)', 'warn');
        return;
      }
    } else {
      if (!confirmOperatorCheckbox) {
        showToast('ကျေးဇူးပြု၍ TikTok သို့ အမှန်တကယ် တင်ပြီးစီးကြောင်း အတည်ပြုချက်ပေးပါ', 'warn');
        return;
      }
    }

    try {
      const updated = await api.confirmPublication({
        postId: selectedPost.id,
        confirmationMethod: confirmMethod,
        postUrl: confirmMethod === 'validated_url' ? confirmUrl.trim() : undefined,
        confirmedByOperator: confirmOperatorCheckbox,
        confirmationNotes: confirmNotes.trim() || undefined,
      });

      setSelectedPost(updated);
      await refreshData();
      setConfirmModalOpen(false);
      setConfirmUrl('');
      setConfirmOperatorCheckbox(false);
      showToast('TikTok Post ထုတ်ဝေမှု အမှန်တကယ် အတည်ပြုပြီးပါပြီ (Truthfully Confirmed as Published)', 'success');
    } catch (err: any) {
      showToast(err.message || 'Confirmation failed', 'error');
    }
  };

  const handleRevertPublication = async (postId: string) => {
    try {
      const updated = await api.revertPublication(postId);
      setSelectedPost(updated);
      await refreshData();
      showToast('ထုတ်ဝေမှု အခြေအနေကို ပယ်ဖျက်ပြီး Scheduled သို့ ပြန်လည်သတ်မှတ်ပါသည်', 'info');
    } catch (err: any) {
      showToast(err.message || 'Revert failed', 'error');
    }
  };

  const handleCreateSchedule = async () => {
    if (!scheduleLessonId || !scheduleAccountId || !scheduleDateTime) {
      showToast('လိုအပ်သော အချက်အလက်များ ပြည့်စုံစွာ ဖြည့်သွင်းပါ', 'warn');
      return;
    }

    try {
      const newPost = await api.schedulePost({
        lessonId: scheduleLessonId,
        accountId: scheduleAccountId,
        scheduledTime: new Date(scheduleDateTime).toISOString(),
        autoPublish: false,
      });

      showToast('Schedule သတ်မှတ်ပြီးပါပြီ (Post Scheduled)', 'success');
      setScheduleModalOpen(false);
      await refreshData();
      setSelectedPost(newPost);
    } catch (err: any) {
      showToast(err.message || 'Scheduling failed', 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Share2 className="w-6 h-6 text-cyan-400" />
            <span>{language === 'mm' ? 'TikTok ထုတ်ဝေရေး & အချိန်ဇယား Hub' : 'TikTok Publishing & Social Hub'}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {language === 'mm'
              ? 'TikTok Japan Region Account အတွက် 1-Click Package Export၊ Caption/Hashtags Copy နှင့် Upload Checklist စနစ်'
              : 'TikTok Japan publishing suite with 1-click video packaging, caption copying, and verification.'}
          </p>
        </div>

        <button
          onClick={() => setScheduleModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-semibold text-xs shadow-md transition-all hover:scale-[1.02]"
        >
          <Calendar className="w-4 h-4" />
          <span>{language === 'mm' ? '+ Video Schedule သတ်မှတ်မည်' : '+ Schedule New Post'}</span>
        </button>
      </div>

      {/* Target Account Focus Banner */}
      {jpAccount && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-black border border-slate-700 flex items-center justify-center text-xl font-bold text-white shadow-md">
              🎵
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base">{jpAccount.displayName}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {jpAccount.region} Region
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Ready
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                {jpAccount.handle} • {jpAccount.followersCount.toLocaleString()} followers • Quota: {jpAccount.todayPostedCount}/{jpAccount.dailyPostingQuota} posted today
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 text-[11px]">
              <span className="text-slate-400">Mode:</span>{' '}
              <span className="text-cyan-400 font-semibold">1-Click Manual Package Suite</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Publishing Work Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Scheduled Posts Queue */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-white text-sm">
                {language === 'mm' ? 'Scheduled Posts စာရင်း' : 'Scheduled Posts Queue'}
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">{scheduledPosts.length} posts</span>
          </div>

          {scheduledPosts.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              {language === 'mm' ? 'Schedule သတ်မှတ်ထားသော Post မရှိသေးပါ' : 'No scheduled posts'}
            </div>
          ) : (
            <div className="space-y-2.5">
              {scheduledPosts.map((post) => {
                const isSelected = selectedPost?.id === post.id;
                const isPublished = post.status === 'published';

                return (
                  <div
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-500/10'
                        : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-[10px] text-cyan-400 font-semibold">
                        {post.accountHandle}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                        isPublished ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {post.status.toUpperCase()}
                      </span>
                    </div>

                    <h4 className="font-bold text-white text-xs mt-1.5 line-clamp-1">
                      {post.lessonTitle}
                    </h4>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-indigo-400" />
                        <span>{new Date(post.scheduledTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: 1-Click Publishing Kit & Verification Checklist */}
        <div className="lg:col-span-7 space-y-6">
          {!selectedPost ? (
            <div className="p-16 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-xs">
              {language === 'mm' ? 'စစ်ဆေးရန် Post တစ်ခုကို ဘယ်ဘက်မှ ရွေးချယ်ပါ' : 'Select a post from the queue to open publishing kit.'}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold">
                    TikTok Post Preparation Suite
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5">
                    {selectedPost.lessonTitle}
                  </h3>
                </div>

                <span className={`px-2.5 py-1 rounded text-xs font-mono font-semibold border ${
                  selectedPost.status === 'published'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    : 'bg-amber-950 text-amber-300 border-amber-800'
                }`}>
                  {selectedPost.status.toUpperCase()}
                </span>
              </div>

              {/* 1. Copy Tools */}
              <div className="space-y-3">
                {/* Caption Box */}
                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">
                      TikTok Caption (စာသား)
                    </span>
                    <button
                      onClick={() => handleCopy(selectedPost.caption, 'TikTok Caption')}
                      className="px-2.5 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 text-xs font-semibold flex items-center gap-1 border border-cyan-500/30 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Caption</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-myanmar bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    {selectedPost.caption}
                  </p>
                </div>

                {/* Hashtags Box */}
                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">
                      Hashtags (အဓိက Tags)
                    </span>
                    <button
                      onClick={() => handleCopy(selectedPost.hashtags.join(' '), 'Hashtags')}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold flex items-center gap-1 border border-indigo-500/30 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy All Hashtags</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPost.hashtags.map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 text-xs font-mono border border-slate-700">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2. Mandatory Preparation Checklist (Steps 1 to 4) */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <span>Preparation Checklist (ထုတ်ဝေမှုကြိုတင်ပြင်ဆင်ချက်များ)</span>
                  </h4>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    selectedPost.status === 'published'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : selectedPost.status === 'ready_for_upload'
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}>
                    {selectedPost.status === 'published' 
                      ? '✓ PUBLISHED' 
                      : selectedPost.status === 'ready_for_upload' 
                      ? 'READY FOR UPLOAD' 
                      : 'IN PREPARATION'}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {[
                    { key: 'videoDownloaded' as const, label: '1. Final 9:16 Video File Downloaded (ဗီဒီယို ဖိုင် ရယူပြီးစီးခြင်း)' },
                    { key: 'captionCopied' as const, label: '2. TikTok Caption & Emojis Copied (စာသား ကူးယူပြီးစီးခြင်း)' },
                    { key: 'tagsCopied' as const, label: '3. Viral Thai2Myanmar Hashtags Copied (Hashtag များ ကူးယူပြီးစီးခြင်း)' },
                    { key: 'soundVerified' as const, label: '4. Audio & Thai Pronunciation Verified (ထိုင်း-မြန်မာ အသံထွက် စစ်ဆေးပြီးခြင်း)' },
                  ].map((item) => (
                    <label
                      key={item.key}
                      className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(selectedPost.checklist[item.key])}
                        onChange={() => handleToggleChecklist(selectedPost.id, item.key, Boolean(selectedPost.checklist[item.key]))}
                        className="w-4 h-4 rounded text-cyan-500 accent-cyan-500 cursor-pointer"
                      />
                      <span className={`text-xs ${selectedPost.checklist[item.key] ? 'text-emerald-300 font-semibold' : 'text-slate-300'}`}>
                        {item.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Step 5: Truthful Publication Confirmation / Verification Box */}
              {selectedPost.status === 'published' ? (
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-2.5 text-xs text-emerald-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>Verified Published on TikTok (@thai2myanmar_jp)</span>
                    </div>
                    <button
                      onClick={() => handleRevertPublication(selectedPost.id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold border border-slate-700 transition-colors"
                    >
                      Revert Status
                    </button>
                  </div>

                  <div className="space-y-1 text-slate-300 text-xs pl-7">
                    <div>
                      <span className="text-slate-400">Verification Method:</span>{' '}
                      <span className="font-semibold text-emerald-300">
                        {selectedPost.confirmationMethod === 'validated_url' ? 'Live TikTok Post URL' : 'Certified Operator Declaration'}
                      </span>
                    </div>
                    {selectedPost.publishedPostUrl && (
                      <div className="flex items-center gap-1 font-mono text-cyan-300">
                        <span className="text-slate-400">Post Link:</span>
                        <a href={selectedPost.publishedPostUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-white truncate max-w-md">
                          {selectedPost.publishedPostUrl}
                        </a>
                      </div>
                    )}
                    {selectedPost.confirmedAt && (
                      <div className="text-[11px] text-slate-400 font-mono">
                        Confirmed At: {new Date(selectedPost.confirmedAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-indigo-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Step 5: Truthful Publication Confirmation
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Never falsified. Mark published only after real upload to TikTok Japan account.
                      </p>
                    </div>
                    <button
                      onClick={() => setConfirmModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Confirm Publication</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Explicit Publication Confirmation Modal */}
      {confirmModalOpen && selectedPost && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-sm">Truthful Publication Confirmation</h3>
              </div>
              <button onClick={() => setConfirmModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-myanmar">
              TikTok Japan (@thai2myanmar_jp) သို့ အမှန်တကယ် Publish ပြုလုပ်ပြီးစီးကြောင်း အတည်ပြုရန် ရွေးချယ်ပါ:
            </p>

            <div className="space-y-3 text-xs">
              {/* Option 1: Live URL */}
              <label className={`block p-3 rounded-xl border cursor-pointer transition-colors ${
                confirmMethod === 'validated_url' 
                  ? 'bg-slate-800/80 border-cyan-500/50 text-white' 
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}>
                <div className="flex items-center gap-2 font-bold text-xs mb-1.5">
                  <input
                    type="radio"
                    name="confirmMethod"
                    checked={confirmMethod === 'validated_url'}
                    onChange={() => setConfirmMethod('validated_url')}
                    className="accent-cyan-500"
                  />
                  <span>Option A: Provide Live TikTok Post URL (အကြံပြုချက်)</span>
                </div>
                {confirmMethod === 'validated_url' && (
                  <div className="mt-2 space-y-1">
                    <input
                      type="url"
                      placeholder="https://www.tiktok.com/@thai2myanmar_jp/video/..."
                      value={confirmUrl}
                      onChange={(e) => setConfirmUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                    />
                    <span className="text-[10px] text-slate-400 block font-mono">
                      Must match format: https://www.tiktok.com/@handle/video/...
                    </span>
                  </div>
                )}
              </label>

              {/* Option 2: Operator Declaration */}
              <label className={`block p-3 rounded-xl border cursor-pointer transition-colors ${
                confirmMethod === 'manual_declaration' 
                  ? 'bg-slate-800/80 border-cyan-500/50 text-white' 
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}>
                <div className="flex items-center gap-2 font-bold text-xs mb-1.5">
                  <input
                    type="radio"
                    name="confirmMethod"
                    checked={confirmMethod === 'manual_declaration'}
                    onChange={() => setConfirmMethod('manual_declaration')}
                    className="accent-cyan-500"
                  />
                  <span>Option B: Manual Operator Declaration (Unlinked Upload)</span>
                </div>
                {confirmMethod === 'manual_declaration' && (
                  <div className="mt-2 pl-4">
                    <label className="flex items-start gap-2 text-[11px] text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={confirmOperatorCheckbox}
                        onChange={(e) => setConfirmOperatorCheckbox(e.target.checked)}
                        className="mt-0.5 accent-cyan-500"
                      />
                      <span>
                        I certify as the studio operator that this video package has been manually uploaded and published to @thai2myanmar_jp on TikTok.
                      </span>
                    </label>
                  </div>
                )}
              </label>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Optional Notes (မှတ်ချက်)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Uploaded at 18:00 JST prime time"
                  value={confirmNotes}
                  onChange={(e) => setConfirmNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button onClick={() => setConfirmModalOpen(false)} className="px-3 py-1.5 text-xs text-slate-400 hover:text-white">
                Cancel
              </button>
              <button
                onClick={handleConfirmPublication}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold text-xs shadow-md"
              >
                Confirm Truthful Publication
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {scheduleModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm">Schedule Video for Publishing</h3>
              <button onClick={() => setScheduleModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Select Lesson</label>
                <select
                  value={scheduleLessonId}
                  onChange={(e) => setScheduleLessonId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                >
                  {lessons.map(l => (
                    <option key={l.id} value={l.id}>{l.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Target Account</label>
                <select
                  value={scheduleAccountId}
                  onChange={(e) => setScheduleAccountId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.displayName} ({a.handle})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Scheduled Date & Time (JST)</label>
                <input
                  type="datetime-local"
                  value={scheduleDateTime}
                  onChange={(e) => setScheduleDateTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button onClick={() => setScheduleModalOpen(false)} className="px-3 py-1.5 text-xs text-slate-400 hover:text-white">
                Cancel
              </button>
              <button
                onClick={handleCreateSchedule}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md"
              >
                Schedule Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
