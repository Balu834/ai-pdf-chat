import { NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai-client";
import { createClient } from "@/lib/supabase-server-client";

export const maxDuration = 60;

const MAX_PER_DOC = 5000;

async function getFullText(supabase, fileUrl) {
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

    const { doc1Id, doc2Id } = await req.json();
    if (!doc1Id || !doc2Id) {
      return NextResponse.json({ error: "doc1Id and doc2Id required" }, { status: 400 });
    }
    if (doc1Id === doc2Id) {
      return NextResponse.json({ error: "Select two different documents" }, { status: 400 });
    }

    // Verify ownership of both docs
    const { data: docs, error: docsError } = await supabase
      .from("documents")
      .select("id, file_name, file_url")
      .in("id", [doc1Id, doc2Id])
      .eq("user_id", user.id);

    if (docsError || !docs || docs.length < 2) {
      return NextResponse.json({ error: "Documents not found or access denied" }, { status: 404 });
    }

    const doc1 = docs.find(d => d.id === doc1Id);
    const doc2 = docs.find(d => d.id === doc2Id);

    // Download full text of both documents (not RAG — redline needs complete coverage)
    const [text1, text2] = await Promise.all([
      getFullText(supabase, doc1.file_url),
      getFullText(supabase, doc2.file_url),
    ]);

    if (!text1 && !text2) {
      return NextResponse.json({ error: "Could not extract text from either document" }, { status: 400 });
    }

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      max_tokens: 1600,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a contract redlining expert. Compare two document versions and identify clause-level changes.\n\n" +
            "Return JSON:\n" +
            "{\n" +
            '  "summary": "One sentence describing the overall nature of changes",\n' +
            '  "changes": [\n' +
            "    {\n" +
            '      "section": "Clause or section name",\n' +
            '      "type": "added" | "removed" | "modified",\n' +
            '      "significance": "high" | "medium" | "low",\n' +
            '      "doc1_text": "text from doc 1, or null if added",\n' +
            '      "doc2_text": "text from doc 2, or null if removed",\n' +
            '      "notes": "brief explanation of what changed and why it matters"\n' +
            "    }\n" +
            "  ]\n" +
            "}\n\n" +
            "Rules:\n" +
            "- Focus on substantive changes — ignore formatting/whitespace.\n" +
            "- Mark significance HIGH if the change affects rights, obligations, money, or liability.\n" +
            "- Limit to 10 most important changes.\n" +
            "- If the documents are not contracts or legal docs, still compare them clause/section by clause/section.\n" +
            "- Never invent content — only use what is in the documents.",
        },
        {
          role: "user",
          content:
            `DOCUMENT 1 — "${doc1.file_name}":\n${text1 || "(could not extract)"}\n\n` +
            `---\n\n` +
            `DOCUMENT 2 — "${doc2.file_name}":\n${text2 || "(could not extract)"}`,
        },
      ],
    });

    const parsed = JSON.parse(completion.choices[0].message.content);

    return NextResponse.json({
      doc1: doc1.file_name,
      doc2: doc2.file_name,
      summary: parsed.summary ?? "",
      changes: parsed.changes ?? [],
    });
  } catch (err) {
    console.error("[redline]", err.message);
    return NextResponse.json({ error: "Redline failed. Please try again." }, { status: 500 });
  }
}
