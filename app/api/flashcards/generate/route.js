import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";
import { getOpenAI } from "@/lib/openai-client";

export const maxDuration = 60;

export async function POST(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { documentId, fileUrl, count = 15 } = await req.json();
    if (!documentId || !fileUrl) {
      return NextResponse.json({ error: "documentId and fileUrl required" }, { status: 400 });
    }

    const safeCount = Math.min(Math.max(parseInt(count) || 15, 5), 20);

    // Verify ownership + get doc name
    const { data: doc } = await supabase
      .from("documents")
      .select("id, file_name")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Fetch context via RAG chunks
    let context = null;
    try {
      const embeddingRes = await getOpenAI().embeddings.create({
        model: "text-embedding-3-small",
        input: "key concepts definitions terms important facts to memorize",
      });
      const { data: chunks } = await supabase.rpc("match_document_chunks", {
        query_embedding: embeddingRes.data[0].embedding,
        match_document_id: documentId,
        match_count: 14,
      });
      if (chunks?.length > 0) {
        context = chunks.map((c, i) => `[${i + 1}] ${c.content}`).join("\n\n").slice(0, 9000);
      }
    } catch {}

    // Fallback: parse PDF
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
            context = pdfData.text.replace(/\s+/g, " ").trim().slice(0, 9000);
          }
        }
      } catch {}
    }

    if (!context) {
      return NextResponse.json({ error: "Could not read document content" }, { status: 400 });
    }

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      max_tokens: 3000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            `You are an expert flashcard creator for students. Generate exactly ${safeCount} high-quality flashcards from this document.\n\n` +
            `Return ONLY valid JSON:\n` +
            `{\n` +
            `  "flashcards": [\n` +
            `    { "front": "Question or term", "back": "Answer or definition" }\n` +
            `  ]\n` +
            `}\n\n` +
            `Rules:\n` +
            `- Front: short question, term, or concept (max 15 words)\n` +
            `- Back: clear concise answer (1-3 sentences max)\n` +
            `- Cover different topics — don't repeat similar cards\n` +
            `- Use ONLY information from the document\n` +
            `- Prioritize: definitions, key facts, important dates/numbers, cause-effect relationships`,
        },
        { role: "user", content: `DOCUMENT:\n${context}` },
      ],
    });

    const parsed = JSON.parse(completion.choices[0].message.content);
    const cards = (parsed.flashcards || []).slice(0, safeCount);

    if (cards.length === 0) {
      return NextResponse.json({ error: "Could not generate flashcards from this document" }, { status: 400 });
    }

    // Delete existing cards for this doc+user (replace with fresh set)
    await supabase
      .from("flashcards")
      .delete()
      .eq("user_id", user.id)
      .eq("document_id", documentId);

    // Insert new cards
    const rows = cards.map(c => ({
      user_id:     user.id,
      document_id: documentId,
      doc_name:    doc.file_name.replace(/\.pdf$/i, ""),
      front:       c.front,
      back:        c.back,
    }));

    const { data: inserted, error: insertErr } = await supabase
      .from("flashcards")
      .insert(rows)
      .select("id, front, back, next_review, interval_days, ease_factor, reps");

    if (insertErr) throw new Error(insertErr.message);

    return NextResponse.json({ flashcards: inserted, count: inserted.length });
  } catch (err) {
    console.error("[flashcards/generate]", err.message);
    return NextResponse.json({ error: "Flashcard generation failed" }, { status: 500 });
  }
}
