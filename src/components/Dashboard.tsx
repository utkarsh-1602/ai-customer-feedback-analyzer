import { ArrowLeft, RotateCcw, Sparkles, Zap, AlertTriangle } from 'lucide-react';
import { Logo } from './Logo';
import { FeedbackOverview } from './FeedbackOverview';
import { TopProblems } from './TopProblems';
import { AIInsights } from './AIInsights';
import { Prioritization } from './Prioritization';
import { FeedbackExplorer } from './FeedbackExplorer';
import type { AnalysisResult } from '@/types';

interface DashboardProps {
  result: AnalysisResult;
  usedAI: boolean;
  analysisWarning?: string;
  onBack: () => void;
  onReset: () => void;
}

export function Dashboard({ result, usedAI, analysisWarning, onBack, onReset }: DashboardProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-100 bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <ArrowLeft size={18} className="text-slate-600" />
            </button>
            <Logo size="sm" />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <RotateCcw size={15} />
              <span className="hidden sm:inline">New Analysis</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-5 py-8 space-y-8">
        {analysisWarning && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-2">
            <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">AI analysis unavailable — showing local fallback results.</p>
              <p className="mt-0.5 text-amber-700">{analysisWarning}</p>
            </div>
          </div>
        )}
        {/* Section: Overview */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900">Feedback Analysis Dashboard</h1>
              {usedAI ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 text-xs font-medium border border-sky-200">
                  <Sparkles size={12} />
                  AI Analysis
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-xs font-medium border border-slate-200">
                  <Zap size={12} />
                  Local Analysis
                </span>
              )}
            </div>
            <span className="text-sm text-slate-400">{result.total} entries analyzed</span>
          </div>
          <FeedbackOverview result={result} />
        </section>

        {/* Section: Top Problems */}
        <section>
          <TopProblems themeStats={result.themeStats} />
        </section>

        {/* Section: Prioritization */}
        <section>
          <Prioritization prioritized={result.prioritized} />
        </section>

        {/* Section: AI Insights */}
        <section>
          <AIInsights insights={result.insights} />
        </section>

        {/* Section: Explorer */}
        <section>
          <FeedbackExplorer entries={result.entries} />
        </section>

        <footer className="pt-4 pb-8 text-center">
          <p className="text-sm text-slate-400">
            FeedbackIQ — AI-powered customer feedback analysis. Demo data shown for illustration.
          </p>
        </footer>
      </div>
    </div>
  );
}
