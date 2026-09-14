import { useState, useRef } from 'react';
import { ArrowLeft, FileUp, Sparkles, Upload, FileText, Loader2, AlertCircle } from 'lucide-react';
import { Logo } from './Logo';
import { parseCsv, parsePastedFeedback } from '@/lib/analysis';
import { demoFeedback } from '@/data/demoFeedback';
import type { FeedbackEntry } from '@/types';

interface FeedbackInputProps {
  onBack: () => void;
  onAnalyzed: (entries: FeedbackEntry[]) => Promise<void>;
}

export function FeedbackInput({ onBack, onAnalyzed }: FeedbackInputProps) {
  const [pasted, setPasted] = useState('');
  const [fileName, setFileName] = useState('');
  const [csvEntries, setCsvEntries] = useState<FeedbackEntry[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const entries = parseCsv(text);
        if (entries.length === 0) {
          setError('No feedback entries found in the CSV file.');
          return;
        }
        setCsvEntries(entries);
        setFileName(file.name);
      } catch {
        setError('Could not parse the CSV file. Please check the format.');
      }
    };
    reader.onerror = () => setError('Could not read the file.');
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith('.csv')) handleFile(file);
    else setError('Please drop a .csv file.');
  };

  const handleAnalyze = async (entries: FeedbackEntry[]) => {
    setLoading(true);
    setError('');
    try {
      await onAnalyzed(entries);
    } catch {
      setError('Something went wrong during analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pastedEntries = parsePastedFeedback(pasted);
  const activeCount = csvEntries.length || pastedEntries.length;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-100 bg-white">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <ArrowLeft size={18} className="text-slate-600" />
            </button>
            <Logo size="sm" />
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-5 py-10">
        <h1 className="text-2xl font-bold text-slate-900">Analyze Your Feedback</h1>
        <p className="text-slate-600 mt-1">Upload a CSV, paste feedback entries, or try the demo dataset to see insights instantly.</p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {loading && (
          <div className="mt-4 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 text-sm px-4 py-3 flex items-center gap-2">
            <Loader2 size={16} className="animate-spin shrink-0" />
            <span>AI is analyzing your feedback…</span>
          </div>
        )}

        {/* Upload CSV */}
        <div className="mt-8">
          <label className="text-sm font-semibold text-slate-700 mb-2 block flex items-center gap-2">
            <FileUp size={16} className="text-sky-600" />
            Upload CSV File
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-sky-400 hover:bg-sky-50/30 transition-colors"
          >
            <Upload size={28} className="text-slate-400 mx-auto mb-2" />
            {fileName ? (
              <p className="text-sm text-slate-700">
                <span className="font-medium">{fileName}</span> — {csvEntries.length} entries loaded
              </p>
            ) : (
              <>
                <p className="text-sm text-slate-600 font-medium">Click to upload or drag & drop</p>
                <p className="text-xs text-slate-400 mt-1">CSV with a feedback text column</p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>

        {/* Paste feedback */}
        <div className="mt-6">
          <label className="text-sm font-semibold text-slate-700 mb-2 block flex items-center gap-2">
            <FileText size={16} className="text-sky-600" />
            Paste Feedback Entries
          </label>
          <p className="text-xs text-slate-400 mb-2">One feedback entry per line.</p>
          <textarea
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            placeholder="The checkout button doesn't work on mobile…&#10;My delivery was 5 days late with no tracking updates…&#10;Great app, love the new recommendations feature!…"
            className="w-full h-32 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
          />
          {pastedEntries.length > 0 && (
            <p className="text-xs text-slate-500 mt-1">{pastedEntries.length} entries detected</p>
          )}
        </div>

        {/* Demo dataset */}
        <div className="mt-6 rounded-xl border border-sky-200 bg-sky-50/50 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
              <Sparkles size={20} className="text-sky-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-800 text-sm">Load Demo Dataset</h3>
              <p className="text-xs text-slate-500">{demoFeedback.length} realistic e-commerce feedback entries ready to analyze.</p>
            </div>
            <button
              onClick={() => handleAnalyze(demoFeedback)}
              disabled={loading}
              className="text-sm font-semibold text-sky-700 bg-white border border-sky-200 hover:bg-sky-50 px-4 py-2 rounded-lg transition-colors shrink-0 disabled:opacity-50"
            >
              Load & Analyze
            </button>
          </div>
        </div>

        {/* Analyze button */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
          <button
            disabled={activeCount === 0 || loading}
            onClick={() => handleAnalyze(csvEntries.length ? csvEntries : pastedEntries)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold transition-colors"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Analyzing…
              </>
            ) : (
              <>Analyze Feedback</>
            )}
          </button>
          {activeCount > 0 && !loading && (
            <span className="text-sm text-slate-500">{activeCount} entries ready to analyze</span>
          )}
        </div>
      </div>
    </div>
  );
}
