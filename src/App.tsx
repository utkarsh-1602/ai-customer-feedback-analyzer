import { useState, useMemo } from 'react';
import { LandingPage } from '@/components/LandingPage';
import { FeedbackInput } from '@/components/FeedbackInput';
import { Dashboard } from '@/components/Dashboard';
import { analyzeWithAI } from '@/lib/aiAnalysis';
import { demoFeedback } from '@/data/demoFeedback';
import type { AnalysisResult, FeedbackEntry } from '@/types';

type View = 'landing' | 'input' | 'dashboard';

function App() {
  const [view, setView] = useState<View>('landing');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [usedAI, setUsedAI] = useState(false);
  const [analysisWarning, setAnalysisWarning] = useState('');

  const handleAnalyzed = async (entries: FeedbackEntry[]) => {
    const { result: res, usedAI: ai, error } = await analyzeWithAI(entries);
    setResult(res);
    setUsedAI(ai);
    setAnalysisWarning(error ?? '');
    setView('dashboard');
  };

  const handleDemo = async () => {
    const { result: res, usedAI: ai, error } = await analyzeWithAI(demoFeedback);
    setResult(res);
    setUsedAI(ai);
    setAnalysisWarning(error ?? '');
    setView('dashboard');
  };

  const handleAnalyze = () => setView('input');

  const dashboard = useMemo(() => {
    if (!result) return null;
    return (
      <Dashboard
        result={result}
        usedAI={usedAI}
        analysisWarning={analysisWarning}
        onBack={() => setView('input')}
        onReset={() => {
          setResult(null);
          setAnalysisWarning('');
          setView('input');
        }}
      />
    );
  }, [result, usedAI]);

  if (view === 'landing') {
    return <LandingPage onAnalyze={handleAnalyze} onDemo={handleDemo} />;
  }

  if (view === 'input') {
    return <FeedbackInput onBack={() => setView('landing')} onAnalyzed={handleAnalyzed} />;
  }

  return dashboard;
}

export default App;
