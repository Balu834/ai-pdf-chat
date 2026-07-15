import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";
import { getOpenAI } from "@/lib/openai-client";
import { isProActive } from "@/lib/user-plan";

const SSE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  "X-Accel-Buffering": "no",
};

const PROMPTS = {
  executive: `You are an expert document analyst. Produce a structured Executive Summary.

Format your response with these exact sections:
**Overview**
A 2-3 sentence description of what this document is about.

**Purpose**
Why this document exists and who it is for.

**Major Conclusions**
• 3-5 bullet points of the most important findings or decisions.

**Key Numbers**
• Any critical figures, dates, amounts, or metrics (if present).

Rules: Be precise. Use only information from the document. No filler.`,

  insights: `You are an expert analyst. Extract the most valuable insights from this document.

Format your response with these exact sections:
**Most Important Findings**
• 4-6 bullet points of the key discoveries or facts.

**Trends & Patterns**
• 2-4 bullet points identifying any patterns, growth, decline, or changes mentioned.

**Opportunities & Risks**
• 2-4 bullet points of any opportunities or risks explicitly or implicitly mentioned.

Rules: Be specific. Quote numbers when present. Skip sections that have no relevant content.`,

  actions: `You are a project manager and strategic advisor. Extract all action items from this document.

Format your response with these exact sections:
**Immediate Actions**
• Tasks or steps that need to happen now or urgently.

**Recommendations**
• What the document suggests should be done.

**Next Steps**
• Longer-term actions or follow-up items mentioned.

Rules: Only include genuine action items. If none exist in a section, omit that section. Be concise.`,

  simple: `You are an expert teacher who explains complex topics to beginners.

Explain this document in simple terms that a 15-year-old could understand.

Format your response:
**What is this about?**
One paragraph, plain English, no jargon.

**The main points are:**
• 4-6 bullet points using simple language.

**Why does it matter?**
One or two sentences on why this document is relevant or important.

Rules: Replace all technical terms with simple words. Use analogies where helpful.`,
};

export async function POST(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { fileUrl, type = "executive" } = await req.json();
    if (!fileUrl) return NextResponse.json({ error: "fileUrl is required" }, { status: 400 });
    if (!PROMPTS[type]) return NextResponse.json({ error: "Invalid summary type" }, { status: 400 });

    // Fetch up to top-40 chunks (best coverage for summarization)
    const { data: doc } = await supabase
      .from("documents")
      .select("id, file_name")
      .eq("file_url", fileUrl)
      .eq("user_id", user.id)
      .maybeSingle();

    let context = "";

    if (doc?.id) {
      const { data: chunks } = await supabase
        .from("document_chunks")
        .select("content, page_number")
        .eq("document_id", doc.id)
        .order("page_number", { ascending: true, nullsFirst: false })
        .limit(40);

      if (chunks?.length > 0) {
        // Distribute chunks across the document for a representative sample
        context = chunks
          .map((c, i) => `[${c.page_number ? `Page ${c.page_number}` : i + 1}] ${c.content}`)
          .join("\n\n")
          .slice(0, 14000);
      }
    }

    // Fallback: download PDF text directly
    if (!context) {
      const isPro = await isProActive(user.id);
      if (!isPro) {
        return NextResponse.json({ error: "Pro required for summarization without embeddings." }, { status: 403 });
      }
      // SSRF guard: only allow Supabase storage URLs
      let parsedUrl;
      try { parsedUrl = new URL(fileUrl); } catch { parsedUrl = null; }
      const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
        ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
        : null;
      const allowedHost = supabaseHost && parsedUrl?.hostname === supabaseHost;
      if (!allowedHost) {
        return NextResponse.json({ error: "Invalid file URL." }, { status: 400 });
      }
      try {
        const res = await fetch(fileUrl);
        if (res.ok) {
          const buf = Buffer.from(await res.arrayBuffer());
          const pdf = (await import("pdf-parse")).default;
          const data = await pdf(buf);
          context = data.text.replace(/\s+/g, " ").trim().slice(0, 14000);
        }
      } catch { /* non-fatal */ }
    }

    if (!context) return NextResponse.json({ error: "Could not extract document content." }, { status: 400 });

    const openai = getOpenAI();
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      stream: true,
      temperature: 0.3,
      max_tokens: 800,
      messages: [
        { role: "system", content: PROMPTS[type] },
        { role: "user", content: `DOCUMENT CONTENT:\n\n${context}` },
      ],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const token = chunk.choices[0]?.delta?.content;
            if (token) {
              controller.enqueue(
                encoder.encode(`data: ${token.replace(/\n/g, "\\n")}\n\n`)
              );
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch {
          controller.enqueue(encoder.encode("data: [ERROR]\n\n"));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, { headers: SSE_HEADERS });
  } catch (err) {
    return NextResponse.json({ error: err.message ?? "Summarization failed" }, { status: 500 });
  }
}
