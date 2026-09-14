export type Sentiment = 'positive' | 'neutral' | 'negative';

export type Priority = 'P0' | 'P1' | 'P2';

export interface FeedbackEntry {
  id: string;
  text: string;
  source: string;
  date: string;
}

export interface AnalyzedFeedback extends FeedbackEntry {
  sentiment: Sentiment;
  sentimentScore: number; // -1 to 1
  theme: string;
  priority: Priority;
  summary: string;
}

export interface ThemeStat {
  theme: string;
  count: number;
  percentage: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  sentiment: Sentiment;
  priority: Priority;
  impact: 'High' | 'Medium' | 'Low';
}

export interface ProductInsight {
  problem: string;
  theme: string;
  impact: 'High' | 'Medium' | 'Low';
  evidence: string;
  aiInsight: string;
  recommendedAction: string;
  successMetric: string;
  priority: Priority;
}

export interface AnalysisResult {
  total: number;
  positive: number;
  neutral: number;
  negative: number;
  positivePct: number;
  neutralPct: number;
  negativePct: number;
  themeStats: ThemeStat[];
  insights: ProductInsight[];
  prioritized: ProductInsight[];
  entries: AnalyzedFeedback[];
}
