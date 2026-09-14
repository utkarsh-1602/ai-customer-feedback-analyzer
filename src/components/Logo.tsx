import { MessageSquareText } from 'lucide-react';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dims = size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-10 h-10' : 'w-8 h-8';
  const text = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-xl';
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 22 : 18;
  return (
    <div className="flex items-center gap-2">
      <div className={`${dims} rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-sm`}>
        <MessageSquareText size={iconSize} className="text-white" strokeWidth={2.5} />
      </div>
      <span className={`${text} font-bold tracking-tight text-slate-800`}>
        Feedback<span className="text-sky-600">IQ</span>
      </span>
    </div>
  );
}
