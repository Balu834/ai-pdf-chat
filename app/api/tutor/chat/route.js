import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";
import { getOpenAI } from "@/lib/openai-client";

export const maxDuration = 30;

const SYSTEM_PROMPTS = {
  normal: `You are Lexi, a friendly and encouraging AI study tutor.
You help students understand topics from their documents.
Keep responses concise (2-4 sentences), conversational, and engaging.
Always end with a short follow-up question to check understanding.
Use simple analogies when explaining complex concepts.`,

  simple: `You are Lexi, a patient AI tutor who explains everything in very simple terms.
Avoid jargon. Use short sentences. Explain like the student is new to the topic.
Keep responses to 2-3 sentences max. Always check if they understood.`,

  eli5: `You are Lexi, an AI tutor explaining things like the student is 10 years old.
Use fun analogies, everyday examples, and very simple words.
Keep it short, energetic, and encouraging. Max 3 sentences.`,

  exam: `You are Lexi, a focused exam preparation tutor.
Give precise, exam-ready answers with key terms highlighted.
Structure answers as: Definition → Key Point → Example.
Keep to 3-4 sentences. Note if this topic is commonly tested.`,

  hinglish: `Aap Lexi hain, ek friendly AI tutor jo Hinglish mein padhate hain.
Explain topics in a mix of Hindi and English (Hinglish).
Keep it conversational, encouraging, aur simple.
Max 3-4 sentences. Student ko encourage karo.`,
};

export async function POST(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { message, fileUrl, documentId, history = [], mode = "normal" } = await req.json();
    if (!message?.trim()) return NextResponse.json({ error: "message required" }, { status: 400 });

    const systemPrompt = SYSTEM_PROMPTS[mode] ?? SYSTEM_PROMPTS.normal;

    // Build document context via RAG
    let context = "";
    if (documentId) {
      try {
        const embeddingRes = await getOpenAI().embeddings.create({
          model: "text-embedding-3-small",
          input: message,
        });
        const { data: chunks } = await supabase.rpc("match_document_chunks", {
          query_embedding: embeddingRes.data[0].embedding,
          match_document_id: documentId,
          match_count: 5,
        });
        if (chunks?.length > 0) {
          context = chunks.map(c => c.content).join("\n\n").slice(0, 3000);
        }
      } catch {}
    }

    // Build messages array: system + last 6 history turns + context + question
    const contextMsg = context
      ? `\n\nDocument context (use this to answer):\n${context}`
      : "";

    const messages = [
      { role: "system", content: systemPrompt + contextMsg },
      ...history.slice(-6),
      { role: "user", content: message },
    ];

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.6,
      max_tokens: 300,
      messages,
    });

    const text = completion.choices[0].message.content ?? "";
    return NextResponse.json({ text });
  } catch (err) {
    console.error("[tutor/chat]", err.message);
    return NextResponse.json({ error: "Tutor unavailable" }, { status: 500 });
  }
}
