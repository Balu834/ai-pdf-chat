import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase-server-client";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function GET(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json(null, { status: 401 });

    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get("documentId");
    if (!documentId) return NextResponse.json(null);

    const { data, error } = await supabase
      .from("insights")
      .select("summary, key_points, suggested_questions")
      .eq("document_id", documentId)
      .single();

    if (error) {
      // Table doesn't exist or no row — both fine, return null
      return NextResponse.json(null);
    }

    return NextResponse.json(data || null);
  } catch {
    return NextResponse.json(null);
  }
}

export async function POST(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { documentId, fileUrl } = await req.json();
    if (!documentId || !fileUrl) {
      return NextResponse.json({ error: "documentId and fileUrl required" }, { status: 400 });
    }

    // Verify ownership
    const { data: doc } = await supabase
      .from("documents")
      .select("id")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .single();
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Return cached insights if they exist
    const { data: existing } = await supabase
      .from("insights")
      .select("summary, key_points, suggested_questions")
      .eq("document_id", documentId)
      .single();
    if (existing?.summary) return NextResponse.json(existing);

    // Build context: try RAG chunks first
    let context = null;
    try {
      const embeddingRes = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: "document overview summary key points important information",
      });
      const { data: chunks } = await supabase.rpc("match_document_chunks", {
        query_embedding: embeddingRes.data[0].embedding,
        match_document_id: documentId,
        match_count: 8,
      });
      if (chunks?.length > 0) {
        context = chunks.map((c, i) => `[${i + 1}] ${c.content}`).join("\n\n").slice(0, 6000);
      }
    } catch {}

    // Fallback: download PDF
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
            context = pdfData.text.replace(/\s+/g, " ").trim().slice(0, 6000);
          }
        }
      } catch {}
    }

    if (!context) {
      return NextResponse.json({ error: "Could not read document content" }, { status: 400 });
    }

    // Generate insights with OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      max_tokens: 700,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            'Analyze this document and return JSON:\n' +
            '{\n' +
            '  "summary": "2-3 sentence overview of the document",\n' +
            '  "key_points": ["point 1", "point 2", "point 3", "point 4", "point 5"],\n' +
            '  "suggested_questions": ["question 1", "question 2", "question 3", "question 4"]\n' +
            '}\n' +
            'Be concise and accurate. Use only information from the document.',
        },
        { role: "user", content: `DOCUMENT:\n${context}` },
      ],
    });

    const parsed = JSON.parse(completion.choices[0].message.content);

    // Store insights (upsert in case of retry)
    await supabase.from("insights").upsert({
      document_id: documentId,
      summary: parsed.summary || "",
      key_points: parsed.key_points || [],
      suggested_questions: parsed.suggested_questions || [],
    });

    return NextResponse.json({
      summary: parsed.summary || "",
      key_points: parsed.key_points || [],
      suggested_questions: parsed.suggested_questions || [],
    });
  } catch (err) {
    console.error("[insights] Error:", err.message);
    return NextResponse.json({ error: "Insights generation failed" }, { status: 500 });
  }
}
