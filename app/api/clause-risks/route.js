import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";
import { getAdminClient } from "@/lib/admin-client";
import { getOpenAI } from "@/lib/openai-client";

export const maxDuration = 60;

export async function GET(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json(null, { status: 401 });

    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get("documentId");
    if (!documentId) return NextResponse.json(null);

    const { data } = await getAdminClient()
      .from("clause_risk_flags")
      .select("flags")
      .eq("document_id", documentId)
      .maybeSingle();

    return NextResponse.json(data?.flags ?? null);
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
    const { data: doc } = await getAdminClient()
      .from("documents")
      .select("id")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Return cached result if available
    const { data: cached } = await getAdminClient()
      .from("clause_risk_flags")
      .select("flags")
      .eq("document_id", documentId)
      .maybeSingle();
    if (cached?.flags?.length > 0) return NextResponse.json(cached.flags);

    // Build context from RAG chunks
    let context = null;
    try {
      const embeddingRes = await getOpenAI().embeddings.create({
        model: "text-embedding-3-small",
        input: "clauses risks obligations penalties indemnity termination liability warranties representations",
      });
      const { data: chunks } = await supabase.rpc("match_document_chunks", {
        query_embedding: embeddingRes.data[0].embedding,
        match_document_id: documentId,
        match_count: 10,
      });
      if (chunks?.length > 0) {
        context = chunks.map((c, i) => `[${i + 1}] ${c.content}`).join("\n\n").slice(0, 7000);
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
            context = pdfData.text.replace(/\s+/g, " ").trim().slice(0, 7000);
          }
        }
      } catch {}
    }

    if (!context) {
      return NextResponse.json({ error: "Could not read document content" }, { status: 400 });
    }

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.1,
      max_tokens: 1200,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            'Analyze this document for unusual, risky, one-sided, or missing clauses. Return JSON:\n' +
            '{\n' +
            '  "flags": [\n' +
            '    {\n' +
            '      "title": "Short clause name",\n' +
            '      "severity": "high" | "medium" | "low",\n' +
            '      "type": "unusual" | "missing" | "one-sided" | "risk",\n' +
            '      "description": "What the clause says or why it is missing/risky",\n' +
            '      "suggestion": "What to do or ask about this clause"\n' +
            '    }\n' +
            '  ],\n' +
            '  "is_contract": true | false\n' +
            '}\n\n' +
            'If this is NOT a legal/contractual document (e.g. academic paper, manual, report), return { "flags": [], "is_contract": false }.\n' +
            'Only flag genuine risks — do not invent issues. Limit to 8 most important flags.\n' +
            'DISCLAIMER: This is not legal advice.',
        },
        { role: "user", content: `DOCUMENT:\n${context}` },
      ],
    });

    const parsed = JSON.parse(completion.choices[0].message.content);
    const flags = parsed.flags ?? [];

    // Cache result (upsert)
    await getAdminClient().from("clause_risk_flags").upsert({
      document_id: documentId,
      flags,
      generated_at: new Date().toISOString(),
    }, { onConflict: "document_id" });

    return NextResponse.json(flags);
  } catch (err) {
    console.error("[clause-risks] Error:", err.message);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
