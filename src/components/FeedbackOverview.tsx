import { TrendingUp, Minus, TrendingDown, MessageSquare } from 'lucide-react';
import type { AnalysisResult } from '@/types';

interface OverviewProps {
  result: AnalysisResult;
}

export function FeedbackOverview({ result }: OverviewProps) {
  const { total, positive, neutral, negative, positivePct, neutralPct, negativePct } = result;

  const cards = [
    { label: 'Total Feedback', value: total, icon: MessageSquare, color: 'text-slate-700', bg: 'bg-slate-100' },
    { label: 'Positive', value: positive, pct: positivePct, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Neutral', value: neutral, pct: neutralPct, icon: Minus, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Negative', value: negative, pct: negativePct, icon: TrendingDown, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{c.label}</span>
              <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center`}>
                <c.icon size={16} className={c.color} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{c.value}</span>
              {c.pct !== undefined && <span className="text-sm font-medium text-slate-400">({c.pct}%)</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Sentiment bar chart */}
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Sentiment Distribution</h3>
        <div className="space-y-4">
          <SentimentBar label="Positive" pct={positivePct} count={positive} color="bg-emerald-500" />
          <SentimentBar label="Neutral" pct={neutralPct} count={neutral} color="bg-amber-400" />
          <SentimentBar label="Negative" pct={negativePct} count={negative} color="bg-rose-500" />
        </div>
        {/* Stacked bar */}
        <div className="mt-6">
          <div className="flex h-3 rounded-full overflow-hidden">
            <div className="bg-emerald-500" style={{ width: `${positivePct}%` }} />
            <div className="bg-amber-400" style={{ width: `${neutralPct}%` }} />
            <div className="bg-rose-500" style={{ width: `${negativePct}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SentimentBar({ label, pct, count, color }: { label: string; pct: number; count: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="font-medium text-slate-600">{label}</span>
        <span className="text-slate-400">{count} entries · {pct}%</span>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
