/**
 * POST /api/demo
 * No-auth streaming demo endpoint.
 * Answers questions against a fixed sample document context.
 * Rate-limited to 5 requests per IP per hour via in-memory counter
 * (good enough for Vercel edge — resets on cold start, no Redis needed).
 */
import { NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai-client";

export const runtime = "edge";


// ── Sample document context (Q4 financial report) ─────────────────────────────
const SAMPLE_CONTEXT = `
INTELLIXY VENTURES — Q4 2024 FINANCIAL REPORT (SAMPLE)

Executive Summary:
Q4 revenue reached ₹4.2 crore, an 18% year-over-year increase driven by strong enterprise adoption.
EBITDA margin improved to 34%, up from 28% in Q3. Net profit was ₹1.1 crore.

Revenue Breakdown:
- SaaS subscriptions: ₹3.1 crore (74% of total)
- Professional services: ₹0.7 crore (17%)
- Marketplace commissions: ₹0.4 crore (9%)

Costs:
- Infrastructure (AWS/Vercel/Supabase): ₹0.38 crore
- Employee salaries: ₹1.2 crore (142 employees)
- Sales & marketing: ₹0.44 crore
- R&D investment: ₹0.8 crore

Key Metrics:
- Monthly Active Users: 28,400 (↑22% QoQ)
- Average Revenue Per User (ARPU): ₹299/month
- Customer Acquisition Cost (CAC): ₹340
- Lifetime Value (LTV): ₹2,100
- Churn rate: 3.8% monthly
- NPS score: 67

Geographic Revenue Split:
- India: 62% (₹2.6 crore)
- Southeast Asia: 28% (₹1.18 crore)
- Rest of World: 10% (₹0.42 crore)

Cash Position:
- Cash reserves: ₹12.8 crore
- Runway: 18 months at current burn rate
- Burn rate: ₹0.71 crore/month

Outlook:
Q1 2025 guidance: ₹5.0–5.4 crore revenue (forecast range).
Planned headcount additions: 18 engineers and 4 sales staff.
New product launches: AI Agents marketplace (January), Workflow automation (February).
`.trim();

// ── Simple in-memory rate limiter ─────────────────────────────────────────────
const ipHits = new Map(); // ip → { count, resetAt }
const LIMIT   = 8;         // max requests per window
const WINDOW  = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip) {
  const now   = Date.now();
  const entry = ipHits.get(ip);
  if (!entry || now > entry.resetAt) {
    ipHits.set(ip, { count: 1, resetAt: now + WINDOW });
    return true;
  }
  if (entry.count >= LIMIT) return false;
  entry.count++;
  return true;
}

// ── Handler ───────────────────────────────────────────────────────────────────
export async function POST(req) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many demo requests. Sign up for unlimited access." },
      { status: 429 }
    );
  }

  let question;
  try {
    ({ question } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!question?.trim() || question.length > 300) {
    return NextResponse.json({ error: "Invalid question" }, { status: 400 });
  }

  const response = await getOpenAI().chat.completions.create({
    model:      "gpt-4o-mini",
    stream:     true,
    max_tokens: 280,
    messages: [
      {
        role:    "system",
        content: `You are an AI assistant answering questions about the document below.
Answer only from the document. Be concise and direct (2-4 sentences max).
If the answer isn't in the document, say so briefly.

Document:
${SAMPLE_CONTEXT}`,
      },
      { role: "user", content: question.trim() },
    ],
  });

  const encoder = new TextEncoder();
  const stream  = new ReadableStream({
    async start(controller) {
      for await (const chunk of response) {
        const text = chunk.choices[0]?.delta?.content ?? "";
        if (text) controller.enqueue(encoder.encode(text));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
