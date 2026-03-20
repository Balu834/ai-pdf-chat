import { NextResponse } from "next/server";
import OpenAI from "openai";
import supabase from "@/lib/supabase";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { question } = await req.json();

    if (!question) {
      return NextResponse.json({ error: "No question provided" }, { status: 400 });
    }

    // ✅ Call OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: question,
        },
      ],
    });

    const answer = response.choices[0].message.content;

    // ✅ Save to Supabase
    await supabase.from("chat_history").insert([
      {
        question,
        answer,
      },
    ]);

    return NextResponse.json({ answer });

  } catch (error) {
    console.error("ERROR:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}