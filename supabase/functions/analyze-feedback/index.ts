// Edge function: analyze-feedback
// Calls an AI provider to analyze customer feedback entries.
// Supports Google Gemini (free tier) and OpenAI.
// Provider priority: GEMINI_API_KEY first, then OPENAI_API_KEY.
// Keys are read from Deno.env — never exposed to the frontend.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface FeedbackEntryInput {
  id: string;
  text: string;
  source: string;
  date: string;
}

interface AIEntryResult {
  id: string;
  sentiment: "positive" | "neutral" | "negative";
  sentimentScore: number;
  theme: string;
  priority: "P0" | "P1" | "P2";
  summary: string;
  problem: string;
}

interface AIInsightResult {
  theme: string;
  problem: string;
  impact: "High" | "Medium" | "Low";
  evidence: string;
  aiInsight: string;
  recommendedAction: string;
  successMetric: string;
}

interface AIResponse {
  entries: AIEntryResult[];
  insights: AIInsightResult[];
}

const VALID_SENTIMENTS = new Set(["positive", "neutral", "negative"]);
const VALID_PRIORITIES = new Set(["P0", "P1", "P2"]);
const VALID_IMPACTS = new Set(["High", "Medium", "Low"]);

const SYSTEM_PROMPT = `You are an expert product manager analyzing customer feedback for an e-commerce/mobile app.
Analyze each feedback entry and return structured results.

For each entry, determine:
- sentiment: "positive", "neutral", or "negative"
- sentimentScore: a number from -1 (very negative) to 1 (very positive)
- theme: a short theme name (e.g. "Checkout Issues", "Delivery Delays", "Search Experience", "Product Quality", "App Reliability", "Account & Notifications", "Pricing", "Customer Support", "UI/UX")
- priority: "P0" (critical/blocking), "P1" (important), or "P2" (minor)
- summary: a one-sentence summary of the feedback
- problem: the specific customer problem in a few words, or empty string if positive

Then generate product insights for each distinct theme that appears in negative or critical feedback:
- theme: the theme name
- problem: a short problem name
- impact: "High", "Medium", or "Low"
- evidence: a sentence citing how many entries mention this theme and their sentiment
- aiInsight: a key insight about why this matters for the product
- recommendedAction: a specific action the product team should take
- successMetric: a metric to track improvement

Return ONLY valid JSON in this exact shape:
{
  "entries": [
    { "id": "<id>", "sentiment": "...", "sentimentScore": 0, "theme": "...", "priority": "...", "summary": "...", "problem": "..." }
  ],
  "insights": [
    { "theme": "...", "problem": "...", "impact": "...", "evidence": "...", "aiInsight": "...", "recommendedAction": "...", "successMetric": "..." }
  ]
}`;

function sanitizeEntry(raw: Record<string, unknown>, fallback: FeedbackEntryInput): AIEntryResult {
  const sentiment = VALID_SENTIMENTS.has(raw.sentiment as string)
    ? (raw.sentiment as "positive" | "neutral" | "negative")
    : "neutral";
  const priority = VALID_PRIORITIES.has(raw.priority as string)
    ? (raw.priority as "P0" | "P1" | "P2")
    : "P2";
  let score = typeof raw.sentimentScore === "number" ? raw.sentimentScore : 0;
  score = Math.max(-1, Math.min(1, score));
  return {
    id: typeof raw.id === "string" ? raw.id : fallback.id,
    sentiment,
    sentimentScore: score,
    theme: typeof raw.theme === "string" && raw.theme.trim() ? raw.theme.trim() : "Other",
    priority,
    summary: typeof raw.summary === "string" ? raw.summary.trim() : "",
    problem: typeof raw.problem === "string" ? raw.problem.trim() : "",
  };
}

function sanitizeInsight(raw: Record<string, unknown>): AIInsightResult | null {
  if (!raw.theme || typeof raw.theme !== "string") return null;
  const impact = VALID_IMPACTS.has(raw.impact as string) ? (raw.impact as "High" | "Medium" | "Low") : "Medium";
  return {
    theme: String(raw.theme).trim(),
    problem: typeof raw.problem === "string" ? String(raw.problem).trim() : String(raw.theme).trim(),
    impact,
    evidence: typeof raw.evidence === "string" ? String(raw.evidence).trim() : "",
    aiInsight: typeof raw.aiInsight === "string" ? String(raw.aiInsight).trim() : "",
    recommendedAction: typeof raw.recommendedAction === "string" ? String(raw.recommendedAction).trim() : "",
    successMetric: typeof raw.successMetric === "string" ? String(raw.successMetric).trim() : "",
  };
}

function extractJson(text: string): Record<string, unknown> {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```$/, "");
  }
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    cleaned = cleaned.slice(first, last + 1);
  }
  return JSON.parse(cleaned);
}

// --- Provider: Google Gemini ---
async function callGemini(
  apiKey: string,
  userPrompt: string,
): Promise<{ content: string } | { error: string; status: number }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: 0.3,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Gemini API error:", response.status, errText);
    let message = `Gemini API error (${response.status}).`;
    if (response.status === 429) {
      message = "Gemini free-tier rate limit reached. Wait a minute and try again, or add a paid key.";
    } else if (response.status === 400 || response.status === 403) {
      message = "Gemini API key is invalid or not authorized. Verify the key in Supabase Edge Function Secrets.";
    }
    return { error: message, status: response.status };
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) {
    return { error: "Gemini returned an empty response.", status: 502 };
  }
  return { content };
}

// --- Provider: OpenAI ---
async function callOpenAI(
  apiKey: string,
  userPrompt: string,
): Promise<{ content: string } | { error: string; status: number }> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("OpenAI API error:", response.status, errText);
    let message = `AI analysis failed (${response.status}). Please try again.`;
    if (response.status === 429) {
      message = "OpenAI rate limit or quota exceeded. Check your API usage and billing at platform.openai.com.";
    } else if (response.status === 401) {
      message = "OpenAI API key is invalid or unauthorized. Verify the key in Supabase Edge Function Secrets.";
    }
    return { error: message, status: response.status };
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    return { error: "OpenAI returned an empty response.", status: 502 };
  }
  return { content };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!geminiKey && !openaiKey) {
      return new Response(
        JSON.stringify({ error: "No AI API key configured. Add GEMINI_API_KEY (free) or OPENAI_API_KEY in Supabase Edge Function Secrets." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json();
    const entries: FeedbackEntryInput[] = body.entries;
    if (!Array.isArray(entries) || entries.length === 0) {
      return new Response(
        JSON.stringify({ error: "No feedback entries provided." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Cap to 100 entries to stay within token limits
    const capped = entries.slice(0, 100);
    const feedbackText = capped
      .map((e, i) => `[${i + 1}] (id: ${e.id}) ${e.text}`)
      .join("\n");
    const userPrompt = `Analyze these ${capped.length} customer feedback entries:\n\n${feedbackText}`;

    // Try Gemini first (free tier), fall back to OpenAI
    let result: { content: string } | { error: string; status: number };

    if (geminiKey) {
      result = await callGemini(geminiKey, userPrompt);
      // If Gemini fails with a key-specific error and OpenAI is available, try it
      if ("error" in result && openaiKey) {
        console.log("Gemini failed, falling back to OpenAI:", result.error);
        result = await callOpenAI(openaiKey, userPrompt);
      }
    } else {
      result = await callOpenAI(openaiKey!, userPrompt);
    }

    if ("error" in result) {
      return new Response(
        JSON.stringify({ error: result.error }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = extractJson(result.content);
    } catch {
      return new Response(
        JSON.stringify({ error: "AI returned malformed JSON." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const rawEntries = Array.isArray(parsed.entries) ? parsed.entries : [];
    const rawInsights = Array.isArray(parsed.insights) ? parsed.insights : [];

    const idToFallback = new Map(capped.map((e) => [e.id, e]));
    const aiEntries: AIEntryResult[] = rawEntries.map((r: Record<string, unknown>) => {
      const id = typeof r.id === "string" ? r.id : "";
      const fallback = idToFallback.get(id) ?? capped[0];
      return sanitizeEntry(r, fallback);
    });

    // Ensure every input entry has a result
    const resultIds = new Set(aiEntries.map((e) => e.id));
    for (const entry of capped) {
      if (!resultIds.has(entry.id)) {
        aiEntries.push({
          id: entry.id,
          sentiment: "neutral",
          sentimentScore: 0,
          theme: "Other",
          priority: "P2",
          summary: "",
          problem: "",
        });
      }
    }

    const aiInsights: AIInsightResult[] = rawInsights
      .map((r: Record<string, unknown>) => sanitizeInsight(r))
      .filter((i): i is AIInsightResult => i !== null);

    const aiResponse: AIResponse = { entries: aiEntries, insights: aiInsights };

    return new Response(JSON.stringify(aiResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred during analysis." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
