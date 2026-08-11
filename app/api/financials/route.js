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
      .from("financial_extracts")
      .select("data")
      .eq("document_id", documentId)
      .maybeSingle();

    return NextResponse.json(data?.data ?? null);
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

    // Return cached result
    const { data: cached } = await getAdminClient()
      .from("financial_extracts")
      .select("data")
      .eq("document_id", documentId)
      .maybeSingle();
    if (cached?.data && Object.keys(cached.data).length > 0) return NextResponse.json(cached.data);

    // Build context from RAG chunks
    let context = null;
    try {
      const embeddingRes = await getOpenAI().embeddings.create({
        model: "text-embedding-3-small",
        input: "total amount invoice payment tax subtotal price cost revenue profit loss balance sheet",
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

    // Fallback: download and parse PDF
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
      temperature: 0,
      max_tokens: 1000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Extract all financial data from this document. Return JSON with relevant fields only.\n" +
            "Possible fields (include only what is present):\n" +
            "document_type, total_amount, subtotal, tax, discount, currency, invoice_number,\n" +
            "invoice_date, due_date, payment_terms, vendor_name, customer_name, billing_address,\n" +
            "bank_details, items (array of {description, quantity, unit_price, amount}),\n" +
            "revenue, profit, loss, expenses, assets, liabilities, equity.\n" +
            "If no financial data is present, return { \"document_type\": \"non-financial\", \"message\": \"No financial data found\" }.\n" +
            "Use null for fields not found. Return only found data — do not invent values.",
        },
        { role: "user", content: `DOCUMENT:\n${context}` },
      ],
    });

    const extracted = JSON.parse(completion.choices[0].message.content);

    // Cache result
    await getAdminClient().from("financial_extracts").upsert({
      document_id: documentId,
      data: extracted,
      generated_at: new Date().toISOString(),
    }, { onConflict: "document_id" });

    return NextResponse.json(extracted);
  } catch (err) {
    console.error("[financials] Error:", err.message);
    return NextResponse.json({ error: "Extraction failed" }, { status: 500 });
  }
}
