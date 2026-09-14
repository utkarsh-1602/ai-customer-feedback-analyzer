import { AlertCircle } from 'lucide-react';
import type { ThemeStat } from '@/types';
import { PriorityBadge } from './PriorityBadge';
import { SentimentDot } from './SentimentDot';

interface TopProblemsProps {
  themeStats: ThemeStat[];
}

export function TopProblems({ themeStats }: TopProblemsProps) {
  const sorted = [...themeStats].sort((a, b) => b.count - a.count);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        <AlertCircle size={18} className="text-sky-600" />
        <h3 className="font-semibold text-slate-800">Top Customer Problems</h3>
      </div>

      <div className="space-y-1">
        {/* Header row */}
        <div className="hidden md:grid grid-cols-12 gap-3 text-xs font-medium text-slate-400 uppercase tracking-wide px-3 pb-2">
          <div className="col-span-4">Theme</div>
          <div className="col-span-2">Feedback</div>
          <div className="col-span-2">Mentions</div>
          <div className="col-span-2">Sentiment</div>
          <div className="col-span-2 text-right">Priority</div>
        </div>

        {sorted.map((stat, i) => (
          <div
            key={stat.theme}
            className="grid grid-cols-12 gap-3 items-center px-3 py-3 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <div className="col-span-12 md:col-span-4 flex items-center gap-2">
              <span className="text-sm font-bold text-slate-300 w-5">{i + 1}</span>
              <span className="font-medium text-slate-800 text-sm">{stat.theme}</span>
            </div>
            <div className="col-span-4 md:col-span-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden max-w-[80px]">
                  <div className="h-full bg-sky-500 rounded-full" style={{ width: `${Math.min(stat.percentage * 2, 100)}%` }} />
                </div>
                <span className="text-sm font-medium text-slate-600">{stat.percentage}%</span>
              </div>
            </div>
            <div className="col-span-4 md:col-span-2 text-sm text-slate-600">{stat.count}</div>
            <div className="col-span-4 md:col-span-2 flex items-center gap-2">
              <SentimentDot sentiment={stat.sentiment} />
              <span className="text-sm text-slate-600 capitalize">{stat.sentiment}</span>
            </div>
            <div className="col-span-12 md:col-span-2 md:text-right">
              <PriorityBadge priority={stat.priority} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
