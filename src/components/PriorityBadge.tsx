import type { Priority } from '@/types';

const styles: Record<Priority, string> = {
  P0: 'bg-rose-50 text-rose-700 border-rose-200',
  P1: 'bg-amber-50 text-amber-700 border-amber-200',
  P2: 'bg-sky-50 text-sky-700 border-sky-200',
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${styles[priority]}`}>
      {priority}
    </span>
  );
}

const impactStyles: Record<string, string> = {
  High: 'bg-rose-50 text-rose-700',
  Medium: 'bg-amber-50 text-amber-700',
  Low: 'bg-slate-100 text-slate-600',
};

export function ImpactBadge({ impact }: { impact: 'High' | 'Medium' | 'Low' }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${impactStyles[impact]}`}>
      {impact} impact
    </span>
  );
}
