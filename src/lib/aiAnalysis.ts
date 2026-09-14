import type {
  AnalyzedFeedback,
  AnalysisResult,
  FeedbackEntry,
  Priority,
  ProductInsight,
  Sentiment,
  ThemeStat,
} from '@/types';
import { analyzeFeedbackLocally } from './analysis';

export interface AIBatchEntry {
  id: string;
  sentiment: Sentiment;
  sentimentScore: number;
  theme: string;
  priority: Priority;
  summary: string;
  problem: string;
}

export interface AIBatchInsight {
  theme: string;
  problem: string;
  impact: 'High' | 'Medium' | 'Low';
  evidence: string;
  aiInsight: string;
  recommendedAction: string;
  successMetric: string;
}

interface AIBatchResponse {
  entries: AIBatchEntry[];
  insights: AIBatchInsight[];
}

/**
 * Calls the server-side edge function to analyze feedback with OpenAI.
 * Returns a structured AnalysisResult that the dashboard can render directly.
 * Falls back to local analysis if the API key is not configured or the call fails.
 */
export async function analyzeWithAI(
  entries: FeedbackEntry[],
  onError?: (msg: string) => void,
): Promise<{ result: AnalysisResult; usedAI: boolean; error?: string }> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    const result = analyzeFeedbackLocally(entries);
    return { result, usedAI: false };
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/analyze-feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ entries }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      const message = errBody.error || `Analysis failed (${response.status})`;
      // 503 = key not configured → fall back silently; other errors surface
      if (response.status === 503) {
        const result = analyzeFeedbackLocally(entries);
        return { result, usedAI: false };
      }
      onError?.(message);
      const result = analyzeFeedbackLocally(entries);
      return { result, usedAI: false, error: message };
    }

    const data: AIBatchResponse = await response.json();

    if (!data.entries || !Array.isArray(data.entries) || data.entries.length === 0) {
      const result = analyzeFeedbackLocally(entries);
      return { result, usedAI: false };
    }

    const result = buildResultFromAI(entries, data);
    return { result, usedAI: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error during analysis.';
    onError?.(message);
    const result = analyzeFeedbackLocally(entries);
    return { result, usedAI: false };
  }
}

function buildResultFromAI(entries: FeedbackEntry[], data: AIBatchResponse): AnalysisResult {
  const entryMap = new Map(entries.map((e) => [e.id, e]));

  const analyzed: AnalyzedFeedback[] = data.entries.map((ai) => {
    const original = entryMap.get(ai.id);
    return {
      id: ai.id,
      text: original?.text ?? '',
      source: original?.source ?? 'Feedback',
      date: original?.date ?? new Date().toISOString().slice(0, 10),
      sentiment: ai.sentiment,
      sentimentScore: ai.sentimentScore,
      theme: ai.theme,
      priority: ai.priority,
      summary: ai.summary,
    };
  });

  const total = analyzed.length;
  const positive = analyzed.filter((a) => a.sentiment === 'positive').length;
  const neutral = analyzed.filter((a) => a.sentiment === 'neutral').length;
  const negative = analyzed.filter((a) => a.sentiment === 'negative').length;

  // Build theme stats from analyzed entries
  const themeMap = new Map<string, ThemeStat>();
  for (const a of analyzed) {
    const existing = themeMap.get(a.theme);
    if (existing) {
      existing.count += 1;
      if (a.sentiment === 'positive') existing.positiveCount += 1;
      else if (a.sentiment === 'neutral') existing.neutralCount += 1;
      else existing.negativeCount += 1;
    } else {
      themeMap.set(a.theme, {
        theme: a.theme,
        count: 1,
        percentage: 0,
        positiveCount: a.sentiment === 'positive' ? 1 : 0,
        neutralCount: a.sentiment === 'neutral' ? 1 : 0,
        negativeCount: a.sentiment === 'negative' ? 1 : 0,
        sentiment: a.sentiment,
        priority: a.priority,
        impact: 'Medium',
      });
    }
  }

  // Enrich theme stats with impact + priority from AI insights
  const insightByTheme = new Map(data.insights.map((i) => [i.theme, i]));
  const themeStats: ThemeStat[] = Array.from(themeMap.values())
    .map((s) => {
      s.percentage = Math.round((s.count / total) * 100);
      const negRatio = s.negativeCount / s.count;
      const posRatio = s.positiveCount / s.count;
      s.sentiment = negRatio > posRatio ? 'negative' : posRatio > negRatio ? 'positive' : 'neutral';
      const insight = insightByTheme.get(s.theme);
      if (insight) {
        s.impact = insight.impact;
      }
      // Determine priority: use highest priority among entries in this theme
      const themeEntries = analyzed.filter((a) => a.theme === s.theme);
      const hasP0 = themeEntries.some((a) => a.priority === 'P0');
      const hasP1 = themeEntries.some((a) => a.priority === 'P1');
      s.priority = hasP0 ? 'P0' : hasP1 ? 'P1' : 'P2';
      return s;
    })
    .sort((a, b) => b.count - a.count);

  // Build insights — use AI-generated insights where available, construct from stats otherwise
  const insights: ProductInsight[] = themeStats.map((s) => {
    const ai = insightByTheme.get(s.theme);
    return {
      problem: ai?.problem ?? s.theme,
      theme: s.theme,
      impact: s.impact,
      evidence:
        ai?.evidence ??
        `${s.count} of ${total} feedback entries mention ${s.theme.toLowerCase()}. ${s.negativeCount} are negative, ${s.positiveCount} positive.`,
      aiInsight: ai?.aiInsight ?? `This theme appears in ${s.percentage}% of feedback and warrants product attention.`,
      recommendedAction: ai?.recommendedAction ?? `Investigate ${s.theme.toLowerCase()} issues and prioritize fixes based on frequency.`,
      successMetric: ai?.successMetric ?? 'Customer satisfaction score',
      priority: s.priority,
    };
  });

  const prioritized = [...insights].sort((a, b) => {
    const order: Record<Priority, number> = { P0: 0, P1: 1, P2: 2 };
    if (order[a.priority] !== order[b.priority]) return order[a.priority] - order[b.priority];
    const impactOrder = { High: 0, Medium: 1, Low: 2 };
    return impactOrder[a.impact] - impactOrder[b.impact];
  });

  return {
    total,
    positive,
    neutral,
    negative,
    positivePct: Math.round((positive / total) * 100),
    neutralPct: Math.round((neutral / total) * 100),
    negativePct: Math.round((negative / total) * 100),
    themeStats,
    insights,
    prioritized,
    entries: analyzed,
  };
}
