import { NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai-client";
import { createClient } from "@/lib/supabase-server-client";


// OpenAI TTS caps at 4096 chars; we strip markdown before counting
const MAX_CHARS = 4000;

const VALID_VOICES = new Set(["alloy", "echo", "fable", "onyx", "nova", "shimmer"]);
const VALID_MODELS = new Set(["tts-1", "tts-1-hd"]);

function stripMarkdown(text) {
  return text
    .replace(/```[\s\S]*?```/g, "code block. ")
    .replace(/`[^`]+`/g, "")
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*•]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\|[^\n]+/g, "")
    .replace(/https?:\/\/\S+/g, "link")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .trim();
}

export const maxDuration = 30; // Vercel: allow up to 30 s for HD voice

export async function POST(req) {
  try {
    // Auth
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let body;
    try { body = await req.json(); }
    catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

    const { text, voice = "nova", model = "tts-1" } = body ?? {};

    if (!text?.trim())          return NextResponse.json({ error: "text is required" },  { status: 400 });
    if (!VALID_VOICES.has(voice)) return NextResponse.json({ error: "Invalid voice" },   { status: 400 });
    if (!VALID_MODELS.has(model)) return NextResponse.json({ error: "Invalid model" },   { status: 400 });

    const cleaned = stripMarkdown(text).slice(0, MAX_CHARS);
    if (!cleaned) return NextResponse.json({ error: "No speakable text after cleaning" }, { status: 400 });

    console.log(`[TTS] user=${user.id} voice=${voice} model=${model} chars=${cleaned.length}`);

    const response = await getOpenAI().audio.speech.create({
      model,
      voice,
      input: cleaned,
      response_format: "mp3",
    });

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    console.log(`[TTS] Generated ${audioBuffer.length} bytes`);

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(audioBuffer.length),
        // Cache 1 h client-side — same text + voice always produces the same audio
        "Cache-Control": "private, max-age=3600, immutable",
      },
    });
  } catch (err) {
    console.error("[TTS] Error:", err?.message ?? err);
    if (err?.status === 401) return NextResponse.json({ error: "Invalid OpenAI API key" },          { status: 500 });
    if (err?.status === 429) return NextResponse.json({ error: "Rate limit — try again shortly" }, { status: 429 });
    if (err?.status === 400) return NextResponse.json({ error: err.message ?? "Bad TTS request" }, { status: 400 });
    return NextResponse.json({ error: "TTS generation failed" }, { status: 500 });
  }
}
