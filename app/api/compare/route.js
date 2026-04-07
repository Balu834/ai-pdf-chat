import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase-server-client";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const TOP_K = 6;
const MAX_PER_DOC = 4000;

async function getPdfText(supabase, fileUrl) {
  try {
    const urlObj = new URL(fileUrl);
    const pathMatch = urlObj.pathname.match(/\/object\/public\/pdfs\/(.+)$/);
    if (!pathMatch) return null;
    const { data: blob, error } = await supabase.storage.from("pdfs").download(pathMatch[1]);
    if (error || !blob) return null;
    const pdfParse = (await import("pdf-parse")).default;
    const buf = Buffer.from(await blob.arrayBuffer());
    const pdfData = await pdfParse(buf);
    return pdfData.text.replace(/\s+/g, " ").trim().slice(0, MAX_PER_DOC) || null;
  } catch {
    return null;
  }
}

export async function POST(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let body;
    try { body = await req.json(); } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { doc1Id, doc2Id, question } = body;

    if (!doc1Id || !doc2Id) {
      return NextResponse.json({ error: "Missing document IDs" }, { status: 400 });
    }
    if (doc1Id === doc2Id) {
      return NextResponse.json({ error: "Select two different documents" }, { status: 400 });
    }

    // Verify ownership
    const { data: docs, error: docsError } = await supabase
      .from("documents")
      .select("id, file_name, file_url")
      .in("id", [doc1Id, doc2Id])
      .eq("user_id", user.id);

    if (docsError || !docs || docs.length < 2) {
      return NextResponse.json({ error: "Documents not found or access denied" }, { status: 404 });
    }

    const doc1 = docs.find((d) => d.id === doc1Id);
    const doc2 = docs.find((d) => d.id === doc2Id);

    if (!doc1 || !doc2) {
      return NextResponse.json({ error: "One or both documents not found" }, { status: 404 });
    }

    // Try RAG vector search first
    let ctx1 = "";
    let ctx2 = "";

    try {
      const q = question?.trim() || "key topics main points important data summary differences";
      const embRes = await openai.embeddings.create({ model: "text-embedding-3-small", input: q });
      const queryEmbedding = embRes.data[0].embedding;

      const [res1, res2] = await Promise.all([
        supabase.rpc("match_document_chunks", { query_embedding: queryEmbedding, match_document_id: doc1Id, match_count: TOP_K }),
        supabase.rpc("match_document_chunks", { query_embedding: queryEmbedding, match_document_id: doc2Id, match_count: TOP_K }),
      ]);

      ctx1 = (res1.data || []).map((c) => c.content).join("\n\n").slice(0, MAX_PER_DOC);
      ctx2 = (res2.data || []).map((c) => c.content).join("\n\n").slice(0, MAX_PER_DOC);
    } catch {
      // embeddings not available, fall through to PDF download
    }

    // Fallback: download and parse PDF directly
    if (!ctx1) ctx1 = await getPdfText(supabase, doc1.file_url) || "";
    if (!ctx2) ctx2 = await getPdfText(supabase, doc2.file_url) || "";

    if (!ctx1 && !ctx2) {
      return NextResponse.json(
        { error: "Could not read document content. Make sure the PDFs are accessible in Supabase Storage." },
        { status: 400 }
      );
    }

    const userPrompt =
      `DOCUMENT 1 — "${doc1.file_name}":\n${ctx1 || "(could not extract text)"}\n\n` +
      `---\n\n` +
      `DOCUMENT 2 — "${doc2.file_name}":\n${ctx2 || "(could not extract text)"}\n\n` +
      `---\n\n` +
      `TASK: ${question?.trim() || "Compare these documents. Highlight key similarities and differences."}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      max_tokens: 1400,
      messages: [
        {
          role: "system",
          content:
            "You are an expert document analyst. Compare the two documents and return a clear structured analysis.\n\n" +
            "Format your response exactly like this (use ** for bold headings):\n\n" +
            "**Overview**\nOne sentence about each document.\n\n" +
            "**Similarities**\n• Point 1\n• Point 2\n\n" +
            "**Differences**\n• Point 1\n• Point 2\n\n" +
            "**Conclusion**\nOne or two sentences with the key takeaway.\n\n" +
            "Be specific and concise. Use only information present in the provided context.",
        },
        { role: "user", content: userPrompt },
      ],
    });

    return NextResponse.json({
      result: completion.choices[0].message.content,
      doc1: { id: doc1Id, name: doc1.file_name },
      doc2: { id: doc2Id, name: doc2.file_name },
    });
  } catch (err) {
    console.error("[compare]", err.message);
    return NextResponse.json({ error: "Comparison failed. Please try again." }, { status: 500 });
  }
}
