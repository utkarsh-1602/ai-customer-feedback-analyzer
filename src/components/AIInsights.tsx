import { Lightbulb, TrendingUp, Wrench, Gauge, type LucideIcon } from 'lucide-react';
import type { ProductInsight } from '@/types';
import { PriorityBadge, ImpactBadge } from './PriorityBadge';

interface AIInsightsProps {
  insights: ProductInsight[];
}

export function AIInsights({ insights }: AIInsightsProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <Lightbulb size={20} className="text-amber-500" />
        <h2 className="text-lg font-bold text-slate-900">AI Product Insights</h2>
      </div>
      <div className="space-y-4">
        {insights.map((insight) => (
          <div key={insight.theme} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <h3 className="font-semibold text-slate-900">{insight.problem}</h3>
              <PriorityBadge priority={insight.priority} />
              <ImpactBadge impact={insight.impact} />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <InsightBlock label="Evidence" icon={TrendingUp}>
                {insight.evidence}
              </InsightBlock>
              <InsightBlock label="AI Insight" icon={Lightbulb}>
                {insight.aiInsight}
              </InsightBlock>
              <InsightBlock label="Recommended Action" icon={Wrench}>
                {insight.recommendedAction}
              </InsightBlock>
              <InsightBlock label="Suggested Success Metric" icon={Gauge}>
                {insight.successMetric}
              </InsightBlock>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InsightBlock({ label, icon: Icon, children }: { label: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon size={14} className="text-slate-400" />
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-sm text-slate-700 leading-relaxed">{children}</p>
    </div>
  );
}
