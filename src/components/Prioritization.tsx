import { ListOrdered } from 'lucide-react';
import type { ProductInsight } from '@/types';
import { PriorityBadge } from './PriorityBadge';

interface PrioritizationProps {
  prioritized: ProductInsight[];
}

const impactDesc: Record<string, string> = {
  High: 'high potential business impact',
  Medium: 'medium impact',
  Low: 'low impact',
};

export function Prioritization({ prioritized }: PrioritizationProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        <ListOrdered size={20} className="text-sky-600" />
        <h2 className="text-lg font-bold text-slate-900">What Should We Fix First?</h2>
      </div>

      <div className="space-y-3">
        {prioritized.map((item, i) => (
          <div
            key={item.theme}
            className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors"
          >
            <div className="shrink-0 mt-0.5">
              <PriorityBadge priority={item.priority} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 text-sm">{item.problem}</span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                {item.priority === 'P0' ? 'High frequency' : item.priority === 'P1' ? 'High frequency' : 'Medium frequency'} + {impactDesc[item.impact]}
              </p>
            </div>
            <span className="text-2xl font-bold text-slate-200 shrink-0">{i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
