import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase-server-client";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// How many chunks to sample per document when insights aren't cached
const CHUNKS_PER_DOC = 4;
const MAX_CONTEXT_PER_DOC = 1800;
const MAX_DOCS_TO_ANALYZE = 10;

export async function POST(req) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ── Prevent duplicate runs: skip if a job ran in the last 30 seconds ──
  const thirtySecondsAgo = new Date(Date.now() - 30_000).toISOString();
  const { data: recent } = await supabase
    .from("ai_jobs")
    .select("id, status, created_at")
    .eq("user_id", user.id)
    .in("status", ["running", "done"])
    .gte("created_at", thirtySecondsAgo)
    .limit(1)
    .single();
  if (recent) return NextResponse.json({ jobId: recent.id, skipped: true });

  // ── Create job record ──────────────────────────────────────────────
  const { data: job, error: jobErr } = await supabase
    .from("ai_jobs")
    .insert({ user_id: user.id, status: "running" })
    .select("id")
    .single();
  if (jobErr) return NextResponse.json({ error: "Could not create job" }, { status: 500 });

  const jobId = job.id;

  try {
    // ── Fetch all user documents ──────────────────────────────────────
    const { data: docs } = await supabase
      .from("documents")
      .select("id, name, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(MAX_DOCS_TO_ANALYZE);

    if (!docs?.length) {
      await supabase.from("ai_jobs").update({ status: "failed", error: "No documents found" }).eq("id", jobId);
      return NextResponse.json({ error: "No documents found" }, { status: 400 });
    }

    if (docs.length < 2) {
      await supabase.from("ai_jobs").update({ status: "failed", error: "Upload at least 2 documents for cross-document analysis" }).eq("id", jobId);
      return NextResponse.json({ error: "Need at least 2 documents" }, { status: 400 });
    }

    // ── Build context: prefer cached insights, fall back to raw chunks ─
    const docContexts = await Promise.all(
      docs.map(async (doc) => {
        // Try cached insights first (fast, already computed)
        const { data: insight } = await supabase
          .from("insights")
          .select("summary, key_points, suggested_questions")
          .eq("document_id", doc.id)
          .single();

        if (insight?.summary) {
          const points = (insight.key_points || []).slice(0, 5).map((p) => `  • ${p}`).join("\n");
          return {
            name: doc.name,
            context:
              `Summary: ${insight.summary}\n` +
              (points ? `Key Points:\n${points}` : ""),
          };
        }

        // Fall back to raw chunks if no insights cached
        const { data: chunks } = await supabase
          .from("document_chunks")
          .select("content")
          .eq("document_id", doc.id)
          .limit(CHUNKS_PER_DOC);

        if (!chunks?.length) return null;

        return {
          name: doc.name,
          context: chunks.map((c) => c.content).join("\n\n").slice(0, MAX_CONTEXT_PER_DOC),
        };
      })
    );

    const validContexts = docContexts.filter(Boolean);
    if (validContexts.length < 2) {
      await supabase.from("ai_jobs").update({
        status: "failed",
        error: "Not enough document content. Re-upload PDFs to generate embeddings.",
      }).eq("id", jobId);
      return NextResponse.json({ error: "Insufficient document content" }, { status: 400 });
    }

    // ── Build formatted context for GPT ──────────────────────────────
    const formattedContext = validContexts
      .map((d, i) => `DOCUMENT ${i + 1} — "${d.name}":\n${d.context}`)
      .join("\n\n---\n\n");

    const docNames = validContexts.map((d) => d.name);

    // ── Call GPT for cross-document synthesis ─────────────────────────
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      max_tokens: 1200,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an expert AI analyst. Analyze multiple documents together and return a JSON object with:\n" +
            "{\n" +
            '  "overview": "2-3 sentence summary covering what all documents are about",\n' +
            '  "themes": ["common theme 1", "common theme 2", "common theme 3"],\n' +
            '  "key_differences": ["difference 1", "difference 2", "difference 3"],\n' +
            '  "document_summaries": [{ "name": "doc name", "one_liner": "one sentence summary" }],\n' +
            '  "action_items": ["actionable insight 1", "actionable insight 2", "actionable insight 3"],\n' +
            '  "suggested_questions": ["cross-doc question 1", "cross-doc question 2", "cross-doc question 3"]\n' +
            "}\n" +
            "Be precise. Only use information present in the provided documents.",
        },
        {
          role: "user",
          content:
            `Analyze these ${validContexts.length} documents together:\n\n${formattedContext}\n\n` +
            "Extract cross-document patterns, key differences, and actionable insights.",
        },
      ],
    });

    const raw = JSON.parse(completion.choices[0].message.content);

    // ── Save result ───────────────────────────────────────────────────
    await supabase.from("ai_jobs").update({
      status: "done",
      doc_count: validContexts.length,
      result: {
        overview: raw.overview || "",
        themes: raw.themes || [],
        key_differences: raw.key_differences || [],
        document_summaries: raw.document_summaries || [],
        action_items: raw.action_items || [],
        suggested_questions: raw.suggested_questions || [],
        doc_names: docNames,
      },
      completed_at: new Date().toISOString(),
    }).eq("id", jobId);

    return NextResponse.json({ jobId, status: "done" });
  } catch (err) {
    console.error("[agent/run]", err.message);
    await supabase.from("ai_jobs").update({ status: "failed", error: err.message }).eq("id", jobId);
    return NextResponse.json({ error: "Agent failed" }, { status: 500 });
  }
}
