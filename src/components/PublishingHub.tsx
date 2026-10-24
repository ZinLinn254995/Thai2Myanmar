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

  const jpAccount = accounts.find(a => a.region === 'Japan') || accounts[0];

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} Copy ကူးယူပြီးပါပြီ (Copied to clipboard)`, 'success');
  };

  const [realUrlInput, setRealUrlInput] = useState('');

  const handleToggleChecklist = async (postId: string, item: keyof ScheduledPost['checklist'], currentVal: boolean) => {
    try {
      const updated = await api.updateChecklist(postId, item, !currentVal, realUrlInput.trim() || undefined);
      setSelectedPost(updated);
      await refreshData();
      if (item === 'manualUploadCompleted' && !currentVal) {
        showToast('TikTok Post တင်ပြီးကြောင်း အတည်ပြုပြီးပါပြီ! (Truthfully Marked as Published)', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Checklist update failed', 'error');
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

              {/* 2. Mandatory Verification Checklist */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Publishing Verification Checklist (စစ်ဆေးချက်များ)</span>
                </h4>

                <div className="space-y-2 text-xs">
                  {[
                    { key: 'videoDownloaded' as const, label: '1. Final 9:16 Video File Downloaded (ဗီဒီယို ဖိုင် ရယူပြီးစီးခြင်း)' },
                    { key: 'captionCopied' as const, label: '2. TikTok Caption & Emojis Copied (စာသား ကူးယူပြီးစီးခြင်း)' },
                    { key: 'tagsCopied' as const, label: '3. Viral Thai2Myanmar Hashtags Copied (Hashtag များ ကူးယူပြီးစီးခြင်း)' },
                    { key: 'soundVerified' as const, label: '4. Audio & Thai Pronunciation Verified (ထိုင်း-မြန်မာ အသံထွက် စစ်ဆေးပြီးခြင်း)' },
                    { key: 'manualUploadCompleted' as const, label: '5. Uploaded to TikTok Japan Account & Published (TikTok သို့ အမှန်တကယ် တင်ပြီးစီးခြင်း)' },
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

              {/* Real URL input when completing upload */}
              {!selectedPost.checklist.manualUploadCompleted && (
                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                  <label className="text-[11px] font-bold text-slate-300 block">
                    TikTok Post URL (ရရှိလာသော အမှန်တကယ် Post Link ထည့်သွင်းပါ - Optional):
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.tiktok.com/@thai2myanmar_jp/video/..."
                    value={realUrlInput}
                    onChange={(e) => setRealUrlInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-[10px] text-slate-400 block">
                    Never fabricated. If left blank, it is truthfully marked as "Manual Package Uploaded".
                  </span>
                </div>
              )}

              {/* Status summary */}
              {selectedPost.checklist.manualUploadCompleted && (
                <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-1.5 text-xs text-emerald-300">
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Post marked as Published on TikTok Japan (@thai2myanmar_jp).</span>
                  </div>
                  {selectedPost.publishedPostUrl ? (
                    <div className="pl-6 text-[11px] flex items-center gap-1 font-mono text-cyan-400">
                      <span>Real URL:</span>
                      <a href={selectedPost.publishedPostUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-white truncate">
                        {selectedPost.publishedPostUrl}
                      </a>
                    </div>
                  ) : (
                    <div className="pl-6 text-[11px] text-slate-300">
                      Mode: Manually Uploaded via 1-Click Verification Package.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

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
