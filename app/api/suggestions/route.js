import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase-server-client";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ suggestions: [] }, { status: 401 });

    const { recentMessages } = await req.json();
    if (!recentMessages?.length) return NextResponse.json({ suggestions: [] });

    const conversationText = recentMessages
      .map((m) => `${m.role === "assistant" ? "AI" : "User"}: ${m.content}`)
      .join("\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 200,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            'Based on this conversation about a PDF document, suggest 3 short helpful follow-up questions. ' +
            'Return JSON: { "suggestions": ["question 1", "question 2", "question 3"] }. ' +
            'Keep each question under 60 characters. Make them specific and useful.',
        },
        {
          role: "user",
          content: `Conversation:\n${conversationText}`,
        },
      ],
    });

    const parsed = JSON.parse(completion.choices[0].message.content);
    return NextResponse.json({ suggestions: parsed.suggestions || [] });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
