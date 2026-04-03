import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Service-role client — bypasses RLS so we can read all users' data
function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY  // must be set in Vercel env vars
  );
}

const MAX_USERS_PER_RUN = 20;   // safety cap so we never time out
const CONTEXT_PER_DOC   = 1000; // chars of insight summary per document
const MIN_DOCS_REQUIRED = 1;    // analyse even single-doc users

// ── helpers ─────────────────────────────────────────────────────────────────

async function buildUserContext(supabase, userId) {
  // Use cached per-doc insights (already computed — fast and cheap)
  const { data: insights } = await supabase
    .from("insights")
    .select("summary, key_points, document_id")
    .in(
      "document_id",
      (
        await supabase
          .from("documents")
          .select("id")
          .eq("user_id", userId)
          .then((r) => (r.data || []).map((d) => d.id))
      )
    );

  if (!insights?.length) return null;

  // Fetch doc names for labelling
  const { data: docs } = await supabase
    .from("documents")
    .select("id, name")
    .eq("user_id", userId);

  const nameMap = Object.fromEntries((docs || []).map((d) => [d.id, d.name]));

  return {
    docCount: insights.length,
    context: insights
      .map((ins) => {
        const name = nameMap[ins.document_id] || "Document";
        const points = (ins.key_points || []).slice(0, 4).join("; ");
        return `"${name}": ${ins.summary || ""} ${points ? `| Key points: ${points}` : ""}`;
      })
      .join("\n")
      .slice(0, CONTEXT_PER_DOC * insights.length),
  };
}

async function runGptAnalysis(context, docCount) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    max_tokens: 600,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are an AI analyst. Analyze the provided document summaries and return JSON:\n" +
          "{\n" +
          '  "summary": "2-sentence overall summary",\n' +
          '  "key_findings": ["finding 1", "finding 2", "finding 3"],\n' +
          '  "risks": ["risk 1", "risk 2"],\n' +
          '  "financial_values": ["any $ amounts or figures mentioned"],\n' +
          '  "alerts": [\n' +
          '    { "message": "alert text", "type": "info|warning|success" }\n' +
          "  ]\n" +
          "}\n" +
          "alerts should only be created for genuinely important findings (risks, large financial values, critical changes). Max 3 alerts.",
      },
      {
        role: "user",
        content: `Analyze ${docCount} document(s):\n\n${context}`,
      },
    ],
  });
  return JSON.parse(completion.choices[0].message.content);
}

function detectChanges(prev, next) {
  // Returns alert messages for significant changes between two analyses
  const changes = [];

  // New documents were added
  if (next.doc_count > (prev?.doc_count || 0)) {
    const added = next.doc_count - (prev?.doc_count || 0);
    changes.push({
      message: `${added} new document${added > 1 ? "s" : ""} added to your workspace`,
      type: "info",
    });
  }

  // Risks appeared that weren't there before
  const prevRisks  = prev?.data?.risks || [];
  const nextRisks  = next.data?.risks  || [];
  const newRisks   = nextRisks.filter((r) => !prevRisks.includes(r));
  if (newRisks.length > 0) {
    changes.push({
      message: `New risk detected: ${newRisks[0]}`,
      type: "warning",
    });
  }

  // Financial values changed
  const prevFinancial = (prev?.data?.financial_values || []).join(" ");
  const nextFinancial = (next.data?.financial_values  || []).join(" ");
  if (nextFinancial && nextFinancial !== prevFinancial) {
    changes.push({
      message: `Financial data updated in your documents`,
      type: "info",
    });
  }

  return changes;
}

// ── route handler ────────────────────────────────────────────────────────────

export async function GET(req) {
  // Vercel passes CRON_SECRET in the Authorization header for scheduled invocations
  const authHeader = req.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = adminClient();
  const startedAt = Date.now();
  const results = { processed: 0, skipped: 0, alerts_created: 0, errors: [] };

  try {
    // ── Get all users who have at least one document ──────────────────
    const { data: userRows } = await supabase
      .from("documents")
      .select("user_id")
      .limit(MAX_USERS_PER_RUN * 5); // over-fetch then dedupe

    const userIds = [...new Set((userRows || []).map((r) => r.user_id))].slice(
      0,
      MAX_USERS_PER_RUN
    );

    if (!userIds.length) {
      return NextResponse.json({ message: "No users with documents", ...results });
    }

    // ── Process each user sequentially to stay within memory limits ───
    for (const userId of userIds) {
      try {
        // Skip if already analyzed in the last 5 hours (cron runs every 6h)
        const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();
        const { data: recentInsight } = await supabase
          .from("ai_insights")
          .select("id")
          .eq("user_id", userId)
          .gte("created_at", fiveHoursAgo)
          .limit(1)
          .single();

        if (recentInsight) { results.skipped++; continue; }

        // Build context from cached per-document insights
        const ctx = await buildUserContext(supabase, userId);
        if (!ctx || ctx.docCount < MIN_DOCS_REQUIRED) { results.skipped++; continue; }

        // Run GPT analysis
        const gptResult = await runGptAnalysis(ctx.context, ctx.docCount);

        // Fetch the previous insight for change detection
        const { data: prevInsight } = await supabase
          .from("ai_insights")
          .select("data, doc_count")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        // Save new insight snapshot
        await supabase.from("ai_insights").insert({
          user_id:   userId,
          summary:   gptResult.summary || "",
          data:      gptResult,
          doc_count: ctx.docCount,
        });

        // Collect alerts: GPT-generated + change-detected
        const alertsToCreate = [
          ...(gptResult.alerts || []),
          ...detectChanges(prevInsight, { data: gptResult, doc_count: ctx.docCount }),
        ].slice(0, 5); // cap at 5 per user per run

        if (alertsToCreate.length > 0) {
          await supabase.from("alerts").insert(
            alertsToCreate.map((a) => ({
              user_id: userId,
              message: a.message,
              type:    a.type || "info",
            }))
          );
          results.alerts_created += alertsToCreate.length;
        }

        results.processed++;
      } catch (userErr) {
        results.errors.push({ userId, error: userErr.message });
      }
    }

    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
    console.log("[cron/analyze] done in", elapsed + "s", results);
    return NextResponse.json({ ok: true, elapsed, ...results });
  } catch (err) {
    console.error("[cron/analyze] fatal:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
