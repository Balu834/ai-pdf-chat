import { NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai-client";
import { createClient } from "@/lib/supabase-server-client";
import { checkQuestionLimit, recordQuestion, FREE_PLAN } from "@/lib/limits";


const TOP_K   = 3;
const MAX_CTX = 4000;

const SSE_HEADERS = {
  "Content-Type":        "text/event-stream; charset=utf-8",
  "Cache-Control":       "no-cache, no-transform",
  "X-Accel-Buffering":   "no",
  "X-Content-Type-Options": "nosniff",
};

function sseChunk(text) {
  return `data: ${text.replace(/\n/g, "\\n")}\n\n`;
}

// ── Voice rules (universal — apply regardless of agent mode) ─────────────────
const VOICE_RULES = `
Your responses are spoken aloud via text-to-speech. Follow these rules exactly:
- Write in natural conversational English only — as if speaking face to face
- NEVER use bullet points, numbered lists, markdown, asterisks, pound signs, or dashes
- NEVER use emojis or special characters that would sound odd when read aloud
- Keep responses to 2–5 sentences maximum
- Be direct — skip filler phrases like "Great question!", "Sure!", "Of course!"
- If listing items, weave them into a sentence: "There are three things: first… second… and third…"
- Spell out numbers at the start of sentences`.trim();

// ── Per-mode personas ─────────────────────────────────────────────────────────
const MODE_PERSONAS = {
  general: `You are Intellixy, a friendly and knowledgeable AI voice assistant.
Answer any question clearly and conversationally.
${VOICE_RULES}`,

  document: `You are Intellixy, an expert AI document analyst speaking via voice.
You specialise in extracting insights, key data, and answering questions about documents precisely.
${VOICE_RULES}`,

  assistant: `You are Intellixy, a focused executive AI assistant.
You give concise, action-oriented answers. Prioritise accuracy and brevity.
${VOICE_RULES}`,

  creative: `You are Intellixy, a creative and expressive AI voice companion.
Be warm, imaginative, and conversational. Use vivid language but keep responses short.
${VOICE_RULES}`,
};

function buildSystemPrompt(docContext, agentMode = "general") {
  const persona = MODE_PERSONAS[agentMode] ?? MODE_PERSONAS.general;

  const docSection = docContext
    ? `\n\nDOCUMENT CONTEXT — use this as your primary knowledge source for this conversation:\n${docContext}`
    : agentMode === "document"
      ? "\n\nNo document has been loaded. Let the user know they can upload a PDF to ask document-specific questions."
      : "";

  return persona + docSection;
}

// ── RAG: vector search for document context ───────────────────────────────────
async function fetchDocContext(supabase, fileUrl, query) {
  try {
    const { data: doc } = await supabase
      .from("documents")
      .select("id")
      .eq("file_url", fileUrl)
      .maybeSingle();

    if (!doc?.id) return null;

    const embRes = await getOpenAI().embeddings.create({
      model: "text-embedding-3-small",
      input:  query,
    });
    const embedding = embRes.data[0].embedding;

    const { data: chunks } = await supabase.rpc("match_document_chunks", {
      query_embedding:   embedding,
      match_document_id: doc.id,
      match_count:       TOP_K,
    });

    if (!chunks?.length) return null;

    let ctx = "";
    for (const chunk of chunks) {
      if ((ctx + chunk.content).length > MAX_CTX) break;
      ctx += chunk.content + "\n\n";
    }
    return ctx.trim() || null;
  } catch {
    return null;
  }
}

// ── POST /api/voice-chat ──────────────────────────────────────────────────────
export async function POST(req) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try { body = await req.json(); }
    catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

    const {
      message,
      fileUrl    = null,
      history    = [],        // [{role:"user"|"assistant", content:"..."}]
      voice      = "nova",
      agentMode  = "general", // "general" | "document" | "assistant" | "creative"
    } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    // ── Rate check ───────────────────────────────────────────────────────────
    const { exceeded, count } = await checkQuestionLimit(supabase, user.id);
    if (exceeded) {
      const encoder = new TextEncoder();
      return new Response(
        new ReadableStream({
          start(controller) {
            const msg = `You have reached your question limit of ${FREE_PLAN.maxQuestions}. Please upgrade to continue.`;
            controller.enqueue(encoder.encode(sseChunk(msg)));
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          },
        }),
        { headers: SSE_HEADERS }
      );
    }

    // ── Document context via RAG ──────────────────────────────────────────────
    const docContext = fileUrl ? await fetchDocContext(supabase, fileUrl, message) : null;

    // ── Record usage ──────────────────────────────────────────────────────────
    await recordQuestion(supabase, user.id);

    // ── Build messages ────────────────────────────────────────────────────────
    const messages = [
      { role: "system", content: buildSystemPrompt(docContext, agentMode) },
      ...history.slice(-8).map(({ role, content }) => ({ role, content })),
      { role: "user", content: message.trim() },
    ];

    // ── Stream from OpenAI ────────────────────────────────────────────────────
    // Document / assistant modes may need slightly longer responses
    const maxTokens = (agentMode === "document" || agentMode === "assistant") ? 280 : 220;

    const stream = await getOpenAI().chat.completions.create({
      model:       "gpt-4o-mini",
      stream:       true,
      temperature:  agentMode === "creative" ? 0.8 : 0.5,
      max_tokens:   maxTokens,
      messages,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const token = chunk.choices[0]?.delta?.content;
            if (token) controller.enqueue(encoder.encode(sseChunk(token)));
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch {
          controller.enqueue(encoder.encode("data: [ERROR]\n\n"));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, { headers: SSE_HEADERS });

  } catch (err) {
    console.error("[voice-chat] Unexpected:", err?.message ?? err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
