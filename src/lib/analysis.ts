import type {
  AnalyzedFeedback,
  AnalysisResult,
  FeedbackEntry,
  Priority,
  ProductInsight,
  Sentiment,
  ThemeStat,
} from '@/types';

interface ThemeDef {
  name: string;
  keywords: string[];
  impact: 'High' | 'Medium' | 'Low';
  insight: string;
  action: string;
  metric: string;
}

const THEMES: ThemeDef[] = [
  {
    name: 'Checkout Issues',
    keywords: ['checkout', 'pay', 'payment', 'purchase', 'card', 'credit card', 'pay button', 'order'],
    impact: 'High',
    insight:
      'Checkout failures are the largest recurring negative theme and are likely the primary driver of purchase abandonment and lost revenue.',
    action:
      'Audit the checkout and payment flow end-to-end, identify the top failure states from payment logs, and instrument checkout abandonment at each step.',
    metric: 'Checkout completion rate',
  },
  {
    name: 'Delivery Delays',
    keywords: ['delivery', 'delivered', 'tracking', 'courier', 'package', 'arrive', 'shipping', 'estimated'],
    impact: 'High',
    insight:
      'Delivery delays and inaccurate tracking erode customer trust and are a leading cause of churn among repeat buyers.',
    action:
      'Review courier SLA compliance, fix tracking sync latency, and surface more accurate estimated delivery windows to customers.',
    metric: 'On-time delivery rate',
  },
  {
    name: 'Search Experience',
    keywords: ['search', 'filter', 'sort', 'results', 'find products', 'suggestions', 'relevant'],
    impact: 'Medium',
    insight:
      'A poor search experience reduces product discoverability and lowers conversion, especially for first-time buyers who browse by keyword.',
    action:
      'Improve search relevance with synonym matching and typo tolerance, add price and brand filters, and measure search-to-cart conversion.',
    metric: 'Search-to-purchase conversion',
  },
  {
    name: 'Product Quality',
    keywords: ['quality', 'damaged', 'counterfeit', 'broken', 'cracked', 'missing parts', 'description', 'material', 'torn'],
    impact: 'High',
    insight:
      'Product quality complaints indicate gaps in supplier quality control and listing accuracy, which damage brand reputation and increase returns.',
    action:
      'Tighten supplier quality checks, enforce listing photo and description standards, and audit the returns queue for quality-related reasons.',
    metric: 'Quality-related return rate',
  },
  {
    name: 'App Reliability',
    keywords: ['crash', 'freeze', 'laggy', 'slow', 'bug', 'error', 'login', 'logged out', 'logs me out', 'update'],
    impact: 'Medium',
    insight:
      'App reliability issues after recent updates are hurting the core experience and blocking users from completing key flows.',
    action:
      'Prioritize crash-free session rate as a release gate, add regression tests for login and navigation, and roll out hotfixes for top crash traces.',
    metric: 'Crash-free session rate',
  },
  {
    name: 'Account & Notifications',
    keywords: ['notification', 'notifications', 'spam', 'spammy', 'promo', 'promotional', 'wishlist', 'coupon', 'account'],
    impact: 'Low',
    insight:
      'Over-notification and missing account features create friction that pushes users toward churn even when core shopping works.',
    action:
      'Add granular notification preferences, restore missing wishlist data, and validate coupon code handling against active campaigns.',
    metric: 'Notification opt-out rate',
  },
];

const POSITIVE_WORDS = [
  'love', 'loved', 'great', 'amazing', 'best', 'excellent', 'perfect', 'fantastic',
  'beautiful', 'spot on', 'friendly', 'professional', 'resolved', 'fast', 'intuitive',
  'clean', 'enjoy', 'handy', 'recommend', 'five stars', 'good work', 'super',
];

const NEGATIVE_WORDS = [
  'broken', 'fail', 'failed', 'failure', 'crash', 'crashes', 'freeze', 'slow', 'laggy',
  'terrible', 'frustrating', 'frustrated', 'worst', 'useless', 'unhelpful', 'disappointed',
  'damaged', 'cracked', 'counterfeit', 'missing', 'delay', 'delayed', 'late', 'spam',
  'spammy', 'annoying', 'unacceptable', 'poor', 'complaint', 'problem', 'issues', 'error',
  'cannot', "can't", 'unable', 'rejects', 'rejected', 'gone', 'disappeared', 'confusing',
];

const NEUTRAL_HINTS = ['fine', 'okay', 'decent', 'average', 'nothing special', 'functional', 'gets the job done', 'no major complaints', 'occasionally'];

function scoreSentiment(text: string): { sentiment: Sentiment; score: number } {
  const lower = text.toLowerCase();
  let score = 0;
  for (const w of POSITIVE_WORDS) {
    if (lower.includes(w)) score += 1;
  }
  for (const w of NEGATIVE_WORDS) {
    if (lower.includes(w)) score -= 1;
  }
  for (const w of NEUTRAL_HINTS) {
    if (lower.includes(w)) score += 0;
  }
  // Normalize to -1..1
  const normalized = Math.max(-1, Math.min(1, score / 3));
  let sentiment: Sentiment = 'neutral';
  if (normalized > 0.2) sentiment = 'positive';
  else if (normalized < -0.2) sentiment = 'negative';
  // If strong words but score near 0, lean negative for complaints
  if (sentiment === 'neutral') {
    const negHits = NEGATIVE_WORDS.filter((w) => lower.includes(w)).length;
    const posHits = POSITIVE_WORDS.filter((w) => lower.includes(w)).length;
    if (negHits > posHits) sentiment = 'negative';
    else if (posHits > negHits) sentiment = 'positive';
  }
  return { sentiment, score: normalized };
}

function detectTheme(text: string): ThemeDef {
  const lower = text.toLowerCase();
  let best: ThemeDef | null = null;
  let bestScore = 0;
  for (const theme of THEMES) {
    let score = 0;
    for (const kw of theme.keywords) {
      if (lower.includes(kw)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = theme;
    }
  }
  return best ?? THEMES[0];
}

function generateSummary(text: string, sentiment: Sentiment, theme: string): string {
  const trimmed = text.length > 120 ? text.slice(0, 117) + '...' : text;
  if (sentiment === 'positive') {
    return `Positive feedback highlighting a strong aspect of the ${theme.toLowerCase()} experience.`;
  }
  if (sentiment === 'negative') {
    return `Customer reports a ${theme.toLowerCase()} problem: "${trimmed}"`;
  }
  return `Neutral feedback related to ${theme.toLowerCase()}. No strong sentiment detected.`;
}

function priorityFor(percentage: number, sentiment: Sentiment, impact: 'High' | 'Medium' | 'Low'): Priority {
  const negWeight = sentiment === 'negative' ? 2 : sentiment === 'neutral' ? 1 : 0;
  const impactWeight = impact === 'High' ? 2 : impact === 'Medium' ? 1 : 0;
  const score = percentage + negWeight * 5 + impactWeight * 5;
  if (score >= 25) return 'P0';
  if (score >= 14) return 'P1';
  return 'P2';
}

export function analyzeFeedback(entries: FeedbackEntry[]): AnalysisResult {
  const analyzed: AnalyzedFeedback[] = entries.map((e) => {
    const { sentiment, score } = scoreSentiment(e.text);
    const theme = detectTheme(e.text);
    const themeStat = theme;
    const pct = 0;
    void pct;
    void themeStat;
    const priority = priorityFor(0, sentiment, theme.impact);
    return {
      ...e,
      sentiment,
      sentimentScore: score,
      theme: theme.name,
      priority,
      summary: generateSummary(e.text, sentiment, theme.name),
    };
  });

  // Recompute theme stats with real counts
  const themeMap = new Map<string, ThemeStat>();
  for (const a of analyzed) {
    const existing = themeMap.get(a.theme);
    if (existing) {
      existing.count += 1;
      if (a.sentiment === 'positive') existing.positiveCount += 1;
      else if (a.sentiment === 'neutral') existing.neutralCount += 1;
      else existing.negativeCount += 1;
    } else {
      const stat: ThemeStat = {
        theme: a.theme,
        count: 1,
        percentage: 0,
        positiveCount: a.sentiment === 'positive' ? 1 : 0,
        neutralCount: a.sentiment === 'neutral' ? 1 : 0,
        negativeCount: a.sentiment === 'negative' ? 1 : 0,
        sentiment: 'neutral',
        priority: 'P2',
        impact: THEMES.find((t) => t.name === a.theme)?.impact ?? 'Medium',
      };
      themeMap.set(a.theme, stat);
    }
  }

  const total = analyzed.length;
  const themeStats: ThemeStat[] = Array.from(themeMap.values())
    .map((s) => {
      s.percentage = Math.round((s.count / total) * 100);
      const negRatio = s.negativeCount / s.count;
      const posRatio = s.positiveCount / s.count;
      s.sentiment = negRatio > posRatio ? 'negative' : posRatio > negRatio ? 'positive' : 'neutral';
      s.priority = priorityFor(s.percentage, s.sentiment, s.impact);
      return s;
    })
    .sort((a, b) => b.count - a.count);

  // Update each entry's priority based on its theme's priority
  const themePriority = new Map(themeStats.map((s) => [s.theme, s.priority]));
  for (const a of analyzed) {
    const tp = themePriority.get(a.theme);
    if (tp) a.priority = tp;
  }

  const positive = analyzed.filter((a) => a.sentiment === 'positive').length;
  const neutral = analyzed.filter((a) => a.sentiment === 'neutral').length;
  const negative = analyzed.filter((a) => a.sentiment === 'negative').length;

  const insights: ProductInsight[] = themeStats.map((s) => {
    const def = THEMES.find((t) => t.name === s.theme)!;
    return {
      problem: s.theme,
      theme: s.theme,
      impact: s.impact,
      evidence: `${s.count} of ${total} feedback entries mention ${s.theme.toLowerCase()}. ${s.negativeCount} are negative, ${s.positiveCount} positive.`,
      aiInsight: def.insight,
      recommendedAction: def.action,
      successMetric: def.metric,
      priority: s.priority,
    };
  });

  const prioritized = [...insights].sort((a, b) => {
    const order = { P0: 0, P1: 1, P2: 2 };
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

export function parseCsv(csvText: string): FeedbackEntry[] {
  const lines = csvText.trim().split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];
  const hasHeader = /text|feedback|comment|review|source|date/i.test(lines[0]);
  const startIdx = hasHeader ? 1 : 0;
  const entries: FeedbackEntry[] = [];
  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i];
    // simple split — support quoted fields minimally
    const cols = parseCsvLine(line);
    const text = cols[0] || line;
    if (!text.trim()) continue;
    entries.push({
      id: `csv-${i}`,
      text: text.trim(),
      source: cols[1]?.trim() || 'CSV Upload',
      date: cols[2]?.trim() || new Date().toISOString().slice(0, 10),
    });
  }
  return entries;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

export function parsePastedFeedback(text: string): FeedbackEntry[] {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim());
  return lines.map((line, i) => ({
    id: `paste-${i}`,
    text: line.trim(),
    source: 'Pasted Input',
    date: new Date().toISOString().slice(0, 10),
  }));
}

export const analyzeFeedbackLocally = analyzeFeedback;
