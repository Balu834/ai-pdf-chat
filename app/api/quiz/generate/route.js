import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";
import { getOpenAI } from "@/lib/openai-client";

export const maxDuration = 60;

export async function POST(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { documentId, fileUrl, difficulty = "medium", count = 10 } = await req.json();
    if (!documentId || !fileUrl) {
      return NextResponse.json({ error: "documentId and fileUrl required" }, { status: 400 });
    }

    const safeCount = Math.min(Math.max(parseInt(count) || 10, 5), 15);

    // Verify ownership
    const { data: doc } = await supabase
      .from("documents")
      .select("id")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Fetch context via RAG chunks
    let context = null;
    try {
      const embeddingRes = await getOpenAI().embeddings.create({
        model: "text-embedding-3-small",
        input: "important concepts key facts definitions exam questions topics",
      });
      const { data: chunks } = await supabase.rpc("match_document_chunks", {
        query_embedding: embeddingRes.data[0].embedding,
        match_document_id: documentId,
        match_count: 12,
      });
      if (chunks?.length > 0) {
        context = chunks.map((c, i) => `[${i + 1}] ${c.content}`).join("\n\n").slice(0, 8000);
      }
    } catch {}

    // Fallback: parse PDF directly
    if (!context) {
      try {
        const urlObj = new URL(fileUrl);
        const pathMatch = urlObj.pathname.match(/\/object\/public\/pdfs\/(.+)$/);
        if (pathMatch) {
          const { data: blob } = await supabase.storage.from("pdfs").download(pathMatch[1]);
          if (blob) {
            const pdfParse = (await import("pdf-parse")).default;
            const buf = Buffer.from(await blob.arrayBuffer());
            const pdfData = await pdfParse(buf);
            context = pdfData.text.replace(/\s+/g, " ").trim().slice(0, 8000);
          }
        }
      } catch {}
    }

    if (!context) {
      return NextResponse.json({ error: "Could not read document content" }, { status: 400 });
    }

    const difficultyGuide = {
      easy:   "straightforward recall questions, simple definitions, basic facts",
      medium: "application and understanding questions, cause-effect, compare-contrast",
      hard:   "analysis, inference, multi-step reasoning, edge cases and exceptions",
    }[difficulty] || "application and understanding questions";

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      max_tokens: 2500,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            `You are an expert exam question generator. Generate exactly ${safeCount} MCQ questions at ${difficulty} difficulty (${difficultyGuide}).\n\n` +
            `Return ONLY valid JSON:\n` +
            `{\n` +
            `  "questions": [\n` +
            `    {\n` +
            `      "question": "Clear question text",\n` +
            `      "options": ["A) option", "B) option", "C) option", "D) option"],\n` +
            `      "answer": "A) correct option text",\n` +
            `      "explanation": "Brief 1-2 sentence explanation of why this is correct",\n` +
            `      "topic": "Topic or concept being tested"\n` +
            `    }\n` +
            `  ]\n` +
            `}\n\n` +
            `Rules:\n` +
            `- Every question must have exactly 4 options\n` +
            `- Only one correct answer per question\n` +
            `- Use ONLY information from the document\n` +
            `- Do not repeat questions\n` +
            `- Mix topics across the document`,
        },
        { role: "user", content: `DOCUMENT:\n${context}` },
      ],
    });

    const parsed = JSON.parse(completion.choices[0].message.content);
    const questions = (parsed.questions || []).slice(0, safeCount);

    if (questions.length === 0) {
      return NextResponse.json({ error: "Could not generate questions from this document" }, { status: 400 });
    }

    return NextResponse.json({ questions, difficulty, count: questions.length });
  } catch (err) {
    console.error("[quiz/generate] Error:", err.message);
    return NextResponse.json({ error: "Quiz generation failed" }, { status: 500 });
  }
}
