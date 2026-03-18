import { NextResponse } from "next/server";
import OpenAI from "openai";
import supabase from "@/lib/supabase"; // ✅ FIXED IMPORT (NO {})

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { question, context } = await req.json();

    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    // 🤖 Ask OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Answer only from the provided PDF content.",
        },
        {
          role: "user",
          content: `Context:\n${context}\n\nQuestion:\n${question}`,
        },
      ],
    });

    const answer = completion.choices[0].message.content;

    // 💾 OPTIONAL: Save to Supabase (safe)
    try {
      await supabase.from("chat_history").insert([
        {
          question,
          answer,
        },
      ]);
    } catch (err) {
      console.log("Supabase save skipped:", err.message);
    }

    return NextResponse.json({ answer });

  } catch (err) {
    console.error("Chat error:", err);

    return NextResponse.json(
      { error: "Chat failed" },
      { status: 500 }
    );
  }
}