import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { LessonScript, DifficultyLevel, LessonStatus } from '../types/index.ts';
import { api } from '../services/api.ts';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Sparkles, 
  Copy, 
  Trash2, 
  Play, 
  Clapperboard, 
  Edit3, 
  Clock, 
  CheckCircle2, 
  Flame,
  Plus
} from 'lucide-react';

export const LessonLibrary: React.FC = () => {
  const { 
    language, 
    lessons, 
    setTab, 
    setActiveLesson, 
    refreshData, 
    showToast 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredLessons = lessons.filter(lesson => {
    const matchesSearch = 
      lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lesson.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lesson.tiktokCaption.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDiff = selectedDifficulty === 'all' || lesson.difficulty === selectedDifficulty;
    const matchesStatus = selectedStatus === 'all' || lesson.status === selectedStatus;

    return matchesSearch && matchesDiff && matchesStatus;
  });

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsProcessing(true);
    try {
      const dup = await api.duplicateLesson(id);
      showToast('သင်ခန်းစာ မိတ္တူပွားပြီးပါပြီ (Lesson duplicated)', 'success');
      await refreshData();
      setActiveLesson(dup);
    } catch (err: any) {
      showToast(err.message || 'Duplicate failed', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`သင်ခန်းစာ "${title}" ကို အပြီးတိုင် ဖျက်ရန် သေချာပါသလား?`)) return;

    try {
      await api.deleteLesson(id);
      showToast('ဖျက်ပြီးပါပြီ (Deleted successfully)', 'info');
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Delete failed', 'error');
    }
  };

  const handleStartRender = async (lesson: LessonScript, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.renderVideo(lesson.id);
      showToast(`"${lesson.title}" ဗီဒီယို Rendering စတင်ပါပြီ (Render started)`, 'success');
      await refreshData();
      setActiveLesson(lesson);
      setTab('production');
    } catch (err: any) {
      showToast(err.message || 'Render failed', 'error');
    }
  };

  const getStatusBadge = (status: LessonStatus) => {
    switch (status) {
      case 'Published':
        return 'bg-emerald-950 text-emerald-300 border-emerald-800';
      case 'Scheduled':
        return 'bg-indigo-950 text-indigo-300 border-indigo-800';
      case 'Ready':
        return 'bg-cyan-950 text-cyan-300 border-cyan-800';
      case 'Rendering':
        return 'bg-amber-950 text-amber-300 border-amber-800 animate-pulse';
      case 'Approved':
        return 'bg-blue-950 text-blue-300 border-blue-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-cyan-400" />
            <span>{language === 'mm' ? 'သင်ခန်းစာ စာကြည့်တိုက်' : 'Lesson Library'}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {language === 'mm'
              ? 'ဖန်တီးထားသော ထိုင်း-မြန်မာ သင်ခန်းစာများကို ပြင်ဆင်ခြင်း၊ စီမံခြင်းနှင့် Video Render ပြုလုပ်ခြင်း'
              : 'Browse, edit, duplicate, and render your Thai-Myanmar language lessons.'}
          </p>
        </div>

        <button
          onClick={() => setTab('studio')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'mm' ? '+ သင်ခန်းစာသစ် ဖန်တီးမည်' : '+ Create New Lesson'}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-slate-900 border border-slate-800 p-3 rounded-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={language === 'mm' ? 'သင်ခန်းစာ ခေါင်းစဉ် သို့မဟုတ် အကြောင်းအရာ ရှာရန်...' : 'Search by title, topic, keyword...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Difficulty Filter */}
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">{language === 'mm' ? 'အဆင့် အားလုံး' : 'All Levels'}</option>
            <option value="Beginner">Beginner (အခြေခံ)</option>
            <option value="Intermediate">Intermediate (အလယ်အလတ်)</option>
            <option value="Advanced">Advanced (အဆင့်မြင့်)</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">{language === 'mm' ? 'အခြေအနေ အားလုံး' : 'All Status'}</option>
            <option value="Draft">Draft</option>
            <option value="Approved">Approved</option>
            <option value="Rendering">Rendering</option>
            <option value="Ready">Ready</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Published">Published</option>
          </select>
        </div>
      </div>

      {/* Lessons List */}
      {filteredLessons.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">
            {language === 'mm' ? 'ရှာဖွေမှုနှင့် ကိုက်ညီသော သင်ခန်းစာ မရှိပါ' : 'No lessons found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {language === 'mm' ? 'စကားလုံးအသစ်ဖြင့် ရှာဖွေပါ သို့မဟုတ် AI ဖြင့် သင်ခန်းစာအသစ် ထုတ်လုပ်ပါ။' : 'Try adjusting filters or generate a fresh lesson with Gemini AI.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLessons.map((lesson) => {
            const hasRewardsCheck = (lesson.targetDurationSec || 60) >= 60;

            return (
              <div
                key={lesson.id}
                onClick={() => {
                  setActiveLesson(lesson);
                  setTab('studio');
                }}
                className="group cursor-pointer bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 shadow-sm hover:shadow-cyan-500/5 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Badges row */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">
                      {lesson.category || 'Lesson'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getStatusBadge(lesson.status)}`}>
                      {lesson.status}
                    </span>
                  </div>

                  {/* Title & Topic */}
                  <div>
                    <h3 className="font-bold text-white text-sm group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug">
                      {lesson.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                      {lesson.topic}
                    </p>
                  </div>

                  {/* Hook preview */}
                  {lesson.hook && (
                    <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-[11px] space-y-1">
                      <div className="text-cyan-400 font-thai font-medium line-clamp-1">
                        "{lesson.hook.hookThai}"
                      </div>
                      <div className="text-slate-300 line-clamp-1 font-myanmar">
                        {lesson.hook.hookMm}
                      </div>
                    </div>
                  )}

                  {/* Meta stats */}
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 border-t border-slate-800 pt-3">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{lesson.targetDurationSec || 64}s</span>
                    </span>

                    {hasRewardsCheck && (
                      <span className="flex items-center gap-1 text-emerald-400 font-mono text-[10px]">
                        <Flame className="w-3 h-3 text-amber-400" />
                        <span>Rewards &gt;60s ✓</span>
                      </span>
                    )}

                    <span className="text-slate-500">|</span>
                    <span>{lesson.vocabulary?.length || 0} vocab</span>
                    <span>{lesson.dialogue?.length || 0} dialogue</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => handleDuplicate(lesson.id, e)}
                      title="Duplicate Lesson"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(lesson.id, lesson.title, e)}
                      title="Delete Lesson"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveLesson(lesson);
                        setTab('production');
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition-colors"
                    >
                      <Clapperboard className="w-3.5 h-3.5 text-cyan-400" />
                      <span>9:16 Preview</span>
                    </button>

                    <button
                      onClick={(e) => handleStartRender(lesson, e)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-xs font-semibold text-white shadow-sm transition-all"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Render</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
