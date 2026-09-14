import type { Sentiment } from '@/types';

const colors: Record<Sentiment, string> = {
  positive: 'bg-emerald-500',
  neutral: 'bg-amber-400',
  negative: 'bg-rose-500',
};

export function SentimentDot({ sentiment }: { sentiment: Sentiment }) {
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${colors[sentiment]}`} />;
}
