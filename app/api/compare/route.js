import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase-server-client";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const TOP_K = 6;
const MAX_PER_DOC = 3000;

export async function POST(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { doc1Id, doc2Id, question } = await req.json();
    if (!doc1Id || !doc2Id) {
      return NextResponse.json({ error: "Two document IDs are required" }, { status: 400 });
    }
    if (doc1Id === doc2Id) {
      return NextResponse.json({ error: "Select two different documents" }, { status: 400 });
    }

    // Verify ownership of both docs in one query
    const { data: docs } = await supabase
      .from("documents")
      .select("id, file_name")
      .in("id", [doc1Id, doc2Id])
      .eq("user_id", user.id);

    if (!docs || docs.length < 2) {
      return NextResponse.json({ error: "Documents not found or access denied" }, { status: 404 });
    }

    const doc1 = docs.find((d) => d.id === doc1Id);
    const doc2 = docs.find((d) => d.id === doc2Id);

    // Build a query embedding from the user's question (or a generic one)
    const q = question?.trim() || "key topics, main points, important data, summary, differences";
    const { data: embData } = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: q,
    });
    const queryEmbedding = embData[0].embedding;

    // Fetch top-k chunks from both documents in parallel
    const [res1, res2] = await Promise.all([
      supabase.rpc("match_document_chunks", {
        query_embedding: queryEmbedding,
        match_document_id: doc1Id,
        match_count: TOP_K,
      }),
      supabase.rpc("match_document_chunks", {
        query_embedding: queryEmbedding,
        match_document_id: doc2Id,
        match_count: TOP_K,
      }),
    ]);

    const ctx1 = (res1.data || []).map((c) => c.content).join("\n\n").slice(0, MAX_PER_DOC);
    const ctx2 = (res2.data || []).map((c) => c.content).join("\n\n").slice(0, MAX_PER_DOC);

    if (!ctx1 && !ctx2) {
      return NextResponse.json(
        { error: "No content found. Re-upload the documents so embeddings are generated." },
        { status: 400 }
      );
    }

    const userPrompt =
      `DOCUMENT 1 — "${doc1.file_name}":\n${ctx1 || "(no content extracted)"}\n\n` +
      `---\n\n` +
      `DOCUMENT 2 — "${doc2.file_name}":\n${ctx2 || "(no content extracted)"}\n\n` +
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
            "You are an expert document analyst. Compare the two provided documents and return a clear, structured analysis.\n\n" +
            "Use this structure:\n" +
            "**Overview** — One sentence describing each document.\n" +
            "**Similarities** — Bullet list of what they share.\n" +
            "**Differences** — Bullet list of key distinctions.\n" +
            "**Conclusion** — One or two sentences summarizing which is better suited for what purpose, or the key takeaway.\n\n" +
            "Be specific, concise, and use only information present in the provided context.",
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
