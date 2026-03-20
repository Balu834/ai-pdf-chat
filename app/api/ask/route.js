import { NextResponse } from "next/server";
import supabase from "@/lib/supabase";

export async function POST(req) {
  try {
    const { question } = await req.json();

    if (!question) {
      return NextResponse.json({ error: "No question" }, { status: 400 });
    }

    // 🤖 FAKE AI RESPONSE (replace later with OpenAI)
    const answer = "This is a sample answer for: " + question;

    // ✅ SAVE TO chat_history (CORRECT TABLE)
    const { error } = await supabase
      .from("chat_history")
      .insert([{ question, answer }]);

    if (error) {
      console.error("Supabase error:", error.message);
    }

    return NextResponse.json({ answer });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}