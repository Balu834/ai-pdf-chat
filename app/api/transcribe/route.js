import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase-server-client";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const audio = formData.get("audio");
    if (!audio) return NextResponse.json({ error: "No audio provided" }, { status: 400 });

    // Whisper needs the file with a proper extension so it detects the codec
    const ext = audio.type?.includes("mp4") ? "mp4" : "webm";
    const file = new File([audio], `recording.${ext}`, { type: audio.type });

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
    });

    return NextResponse.json({ text: transcription.text });
  } catch (err) {
    console.error("[transcribe]", err.message);
    return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
  }
}
