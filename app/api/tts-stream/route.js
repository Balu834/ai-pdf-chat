import { NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai-client";
import { createClient } from "@/lib/supabase-server-client";


const MAX_CHARS    = 400;    // short phrases only — long text belongs in /api/tts
const VALID_VOICES = new Set(["alloy", "echo", "fable", "onyx", "nova", "shimmer"]);

function stripMarkdown(text) {
  return text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]+`/g, "")
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*•]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\|[^\n]+/g, "")
    .replace(/https?:\/\/\S+/g, "link")
    .replace(/\n+/g, " ")
    .trim();
}

export const maxDuration = 20;

/* ─── POST /api/tts-stream ────────────────────────────────────────────────────
   Pipes the OpenAI audio stream DIRECTLY to the client — no server-side
   buffering.  The client gets the first audio bytes within ~100-200 ms of
   the request, so it can start decoding before the full clip arrives.
────────────────────────────────────────────────────────────────────────────── */
export async function POST(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let body;
    try { body = await req.json(); }
    catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

    const { text, voice = "nova" } = body ?? {};

    if (!text?.trim())             return NextResponse.json({ error: "text required" },  { status: 400 });
    if (!VALID_VOICES.has(voice))  return NextResponse.json({ error: "Invalid voice" },  { status: 400 });

    const cleaned = stripMarkdown(text).slice(0, MAX_CHARS);
    if (!cleaned) return NextResponse.json({ error: "No speakable text" }, { status: 400 });

    // tts-1 is 3-4× faster to generate than tts-1-hd — always use it for real-time
    const ttsResponse = await getOpenAI().audio.speech.create({
      model:           "tts-1",
      voice,
      input:           cleaned,
      response_format: "mp3",
    });

    // Pipe the OpenAI ReadableStream directly to the HTTP response.
    // The client starts receiving audio bytes the instant OpenAI starts sending them,
    // rather than waiting for the entire clip to be buffered on the server.
    return new Response(ttsResponse.body, {
      status:  200,
      headers: {
        "Content-Type":           "audio/mpeg",
        "Cache-Control":          "no-store",
        "X-Accel-Buffering":      "no",
        "Transfer-Encoding":      "chunked",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error("[tts-stream]", err?.message ?? err);
    if (err?.status === 429) return NextResponse.json({ error: "Rate limited" },  { status: 429 });
    return NextResponse.json({ error: "TTS failed" }, { status: 500 });
  }
}
