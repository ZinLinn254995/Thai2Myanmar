import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { 
  ScrollText, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

export const ActivityLogsView: React.FC = () => {
  const { language, logs, refreshData } = useApp();
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  const filteredLogs = logs.filter(log => {
    const matchCat = filterCategory === 'all' || log.category === filterCategory;
    const matchLvl = filterLevel === 'all' || log.level === filterLevel;
    const matchSearch = 
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchLvl && matchSearch;
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <ScrollText className="w-6 h-6 text-cyan-400" />
            <span>{language === 'mm' ? 'စနစ် လုပ်ဆောင်ချက် မှတ်တမ်းများ (Activity Logs)' : 'System Audit Trail & Activity Logs'}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {language === 'mm'
              ? 'AI Generative Calls၊ 9:16 Video Rendering အဆင့်များ၊ Social Posting နှင့် System Event အားလုံး၏ အသေးစိတ်မှတ်တမ်း'
              : 'Complete audit trail of all background jobs, AI calls, and TikTok production operations.'}
          </p>
        </div>

        <button
          onClick={() => refreshData()}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-900 border border-slate-800 p-3 rounded-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={language === 'mm' ? 'မှတ်တမ်းများထဲတွင် ရှာဖွေရန်...' : 'Search logs by keywords...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200"
          >
            <option value="all">All Categories</option>
            <option value="ai_generation">AI Generation</option>
            <option value="video_render">Video Render</option>
            <option value="publish">Publishing</option>
            <option value="scheduler">Scheduler</option>
            <option value="system">System</option>
          </select>

          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200"
          >
            <option value="all">All Levels</option>
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="warn">Warning</option>
            <option value="error">Error</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No logs found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  let levelBadge = 'text-slate-400 bg-slate-800';
                  if (log.level === 'success') levelBadge = 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/60';
                  if (log.level === 'error') levelBadge = 'text-rose-400 bg-rose-950/60 border border-rose-800/60';
                  if (log.level === 'warn') levelBadge = 'text-amber-400 bg-amber-950/60 border border-amber-800/60';

                  return (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${levelBadge}`}>
                          {log.level}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-cyan-400 uppercase whitespace-nowrap">
                        {log.category}
                      </td>
                      <td className="px-4 py-3 font-semibold text-white whitespace-nowrap">
                        {log.action}
                      </td>
                      <td className="px-4 py-3 text-slate-200">
                        {log.details}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
