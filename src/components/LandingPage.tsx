import { ArrowRight, BarChart3, Sparkles, Target, Zap } from 'lucide-react';
import { Logo } from './Logo';

interface LandingPageProps {
  onAnalyze: () => void;
  onDemo: () => void;
}

const steps = [
  { label: 'Customer Feedback', icon: MessageIcon },
  { label: 'AI Analysis', icon: Sparkles },
  { label: 'Pain Points', icon: Target },
  { label: 'Prioritization', icon: BarChart3 },
  { label: 'Product Actions', icon: Zap },
];

const features = [
  {
    title: 'Sentiment Analysis',
    desc: 'Automatically classify every piece of feedback as positive, neutral, or negative.',
    icon: BarChart3,
  },
  {
    title: 'Theme Clustering',
    desc: 'AI groups feedback into recurring themes like checkout, delivery, and search.',
    icon: Target,
  },
  {
    title: 'AI Product Insights',
    desc: 'Get evidence-backed insights, recommended actions, and success metrics for each problem.',
    icon: Sparkles },
];

function MessageIcon({ className }: { className?: string }) {
  return <span className={className}>💬</span>;
}

export function LandingPage({ onAnalyze, onDemo }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            <button
              onClick={onDemo}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Try Demo
            </button>
            <button
              onClick={onAnalyze}
              className="text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 px-4 py-2 rounded-lg transition-colors"
            >
              Analyze Feedback
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-5 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-medium mb-6">
          <Sparkles size={14} />
          AI-Powered Feedback Intelligence
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
          Turn Customer Feedback Into<br className="hidden sm:block" /> Product Decisions
        </h1>
        <p className="mt-5 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          FeedbackIQ uses AI to identify customer pain points, prioritize product problems,
          and turn feedback into actionable insights.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onAnalyze}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-base shadow-sm transition-all hover:shadow-md"
          >
            Analyze Feedback
            <ArrowRight size={18} />
          </button>
          <button
            onClick={onDemo}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-base transition-colors"
          >
            Try Demo
          </button>
        </div>
        <p className="mt-4 text-sm text-slate-400">No login required. No setup. Works instantly.</p>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-5 py-16 border-t border-slate-100">
        <h2 className="text-center text-2xl font-bold text-slate-900 mb-12">How It Works</h2>
        <div className="flex flex-col md:flex-row items-stretch gap-3">
          {steps.map((step, i) => (
            <div key={step.label} className="flex items-center gap-3 md:flex-1">
              <div className="flex-1 rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm">
                <div className="text-2xl mb-2">
                  <step.icon className="inline" />
                </div>
                <div className="text-sm font-semibold text-slate-700">{step.label}</div>
              </div>
              {i < steps.length - 1 && (
                <ArrowRight size={20} className="text-slate-300 hidden md:block shrink-0" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-5 py-16 border-t border-slate-100">
        <h2 className="text-center text-2xl font-bold text-slate-900 mb-12">What You Get</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-sky-50 flex items-center justify-center mb-4">
                <f.icon size={22} className="text-sky-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-5 py-16">
        <div className="rounded-3xl bg-gradient-to-br from-sky-600 to-blue-700 p-10 text-center text-white">
          <h2 className="text-2xl font-bold mb-3">Ready to see it in action?</h2>
          <p className="text-sky-100 mb-6">Load the demo dataset and get insights in seconds.</p>
          <button
            onClick={onDemo}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-sky-700 font-semibold shadow-sm hover:bg-sky-50 transition-colors"
          >
            Try Demo Data
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      <footer className="border-t border-slate-100 py-8">
        <div className="max-w-6xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Logo size="sm" />
          <p className="text-sm text-slate-400">AI-powered customer feedback analyzer for product teams.</p>
        </div>
      </footer>
    </div>
  );
}
