import { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import type { AnalyzedFeedback, Sentiment } from '@/types';
import { SentimentDot } from './SentimentDot';
import { PriorityBadge } from './PriorityBadge';

interface ExplorerProps {
  entries: AnalyzedFeedback[];
}

type FilterKey = 'all' | 'positive' | 'neutral' | 'negative' | 'high';

const filters: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'positive', label: 'Positive' },
  { key: 'neutral', label: 'Neutral' },
  { key: 'negative', label: 'Negative' },
  { key: 'high', label: 'High Priority' },
];

const sentimentStyles: Record<Sentiment, string> = {
  positive: 'text-emerald-600',
  neutral: 'text-amber-600',
  negative: 'text-rose-600',
};

export function FeedbackExplorer({ entries }: ExplorerProps) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');

  const filtered = entries.filter((e) => {
    if (activeFilter === 'positive') return e.sentiment === 'positive';
    if (activeFilter === 'neutral') return e.sentiment === 'neutral';
    if (activeFilter === 'negative') return e.sentiment === 'negative';
    if (activeFilter === 'high') return e.priority === 'P0';
    if (search && !e.text.toLowerCase().includes(search.toLowerCase()) && !e.theme.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).filter((e) => {
    if (!search) return true;
    return e.text.toLowerCase().includes(search.toLowerCase()) || e.theme.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Search size={18} className="text-sky-600" />
        <h2 className="text-lg font-bold text-slate-900">Feedback Explorer</h2>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search feedback or theme…"
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <Filter size={15} className="text-slate-400" />
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === f.key
                ? 'bg-sky-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="text-xs text-slate-400 ml-auto">{filtered.length} results</span>
      </div>

      {/* Cards */}
      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((entry) => (
          <div key={entry.id} className="rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <SentimentDot sentiment={entry.sentiment} />
                <span className={`text-xs font-medium capitalize ${sentimentStyles[entry.sentiment]}`}>{entry.sentiment}</span>
              </div>
              <PriorityBadge priority={entry.priority} />
            </div>
            <p className="text-sm text-slate-700 leading-relaxed mb-3">{entry.text}</p>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium text-slate-500">{entry.theme}</span>
              <span>{entry.source} · {entry.date}</span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100">
              <p className="text-xs text-slate-500 italic">{entry.summary}</p>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-10 text-slate-400 text-sm">No feedback matches this filter.</div>
      )}
    </div>
  );
}
