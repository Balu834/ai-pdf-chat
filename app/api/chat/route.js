import { NextResponse } from "next/server";
import OpenAI from "openai";
import pdf from "pdf-parse";
import { createClient } from "@/lib/supabase-server-client";
import { checkQuestionLimit, recordQuestion, FREE_PLAN } from "@/lib/limits";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const TOP_K = 5;
const MAX_CONTEXT = 3000;
const MAX_FALLBACK_CHARS = 12000;
const HISTORY_LIMIT = 10;

// Only trigger raw JSON extraction when the user explicitly asks for machine-readable output.
// Document types like "invoice" / "resume" / "contract" should be answered in human-readable
// structured format, NOT returned as a JSON blob.
const EXTRACTION_TRIGGERS = [
  "return json", "give me json", "output json", "as json",
  "in json format", "json output", "machine readable",
];

function isExtractionRequest(message) {
  const lower = message.toLowerCase();
  return EXTRACTION_TRIGGERS.some((t) => lower.includes(t));
}

async function extractStructured(context, message) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a document data extractor. Extract structured data from the provided document context.\n" +
          "Return ONLY valid JSON. Use null for fields not found in the document.\n" +
          "Detect document type (invoice, resume, report, contract, other) and extract relevant fields:\n" +
          "- Invoice/Bill: customer_name, invoice_number, date, due_date, total_amount, tax, subtotal, billing_address, items (array of {description, quantity, unit_price, amount}), bank, payment_terms\n" +
          "- Resume/CV: name, email, phone, location, summary, skills (array), experience (array of {company, role, duration, description}), education (array)\n" +
          "- Report/Contract: title, date, parties (array), key_points (array), summary\n" +
          "Always include: { document_type, extracted_fields: { ... } }",
      },
      {
        role: "user",
        content: `DOCUMENT CONTEXT:\n${context}\n\nUSER REQUEST: ${message}`,
      },
    ],
  });

  const raw = completion.choices[0].message.content;
  const parsed = JSON.parse(raw);
  return NextResponse.json({ type: "extraction", data: parsed }, { status: 200 });
}

const SSE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  "X-Accel-Buffering": "no",   // prevents Nginx/Vercel buffering
  "X-Content-Type-Options": "nosniff",
};

function sseChunk(text) {
  // SSE format: "data: <payload>\n\n"
  // Escape newlines inside the payload so each event is on one logical line
  return `data: ${text.replace(/\n/g, "\\n")}\n\n`;
}

function streamText(text) {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(sseChunk(text)));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    }),
    { headers: SSE_HEADERS }
  );
}

// Classify what kind of response structure fits the question
function classifyIntent(message) {
  const q = message.toLowerCase();
  if (q.includes("summar") || q.includes("overview") || q.includes("what is this") || q.includes("about this") || q.includes("describe") || q.includes("eli5") || q.includes("explain")) return "summary";
  if (q.includes("risk") || q.includes("warning") || q.includes("issue") || q.includes("concern") || q.includes("problem") || q.includes("danger")) return "risks";
  if (q.includes("key point") || q.includes("highlight") || q.includes("main point") || q.includes("important") || q.includes("takeaway")) return "keypoints";
  if (q.includes("extract") || q.includes("parse")) return "extraction";
  if (q.includes("question") || q.includes("ask") || q.includes("suggest") || q.includes("what should")) return "questions";
  return "answer";
}

const STRUCTURED_SYSTEM = (context, intent) => {
  const base = `You are Intellixy, an expert AI document assistant. You answer questions about documents with precision and clarity.

DOCUMENT CONTEXT:
${context}

─── RESPONSE FORMAT RULES ───
Always structure your response using these emoji section headers. Include only the sections relevant to the question.

📄 **Summary:**
• 2-4 concise bullet points covering the main answer

💡 **Key Details:**
• Specific values, names, dates, amounts — formatted as "Label: **Value**"
• Highlight monetary amounts like **₹2,400** and dates like **15 Jan 2025** in bold

⚠️ **Notes / Risks:**
• Only include if there are warnings, conditions, caveats, or risks in the document
• Skip this section if there are none

❓ **You might also ask:**
• 2-3 short follow-up questions the user could ask next

─── RULES ───
1. Use ONLY information from the document context. Never guess or hallucinate.
2. Bold important values: amounts, dates, names, totals.
3. Keep bullets short (one line each). Never write paragraphs.
4. If something is not in the document, say "Not mentioned in this document."
5. For simple direct questions (yes/no, single values), answer briefly first, then add one Key Details section.`;

  const intentOverrides = {
    summary: `\n\nThe user wants a SUMMARY. Focus on the 📄 Summary section with 4-5 bullets covering all major topics. Add 💡 Key Details for any important numbers/dates found.`,
    risks: `\n\nThe user is asking about RISKS or WARNINGS. Lead with ⚠️ Notes / Risks as your primary section, then add 📄 Summary if needed.`,
    keypoints: `\n\nThe user wants KEY POINTS. Use 📄 Summary with 5-7 bullets. Add 💡 Key Details for any values.`,
    questions: `\n\nThe user wants suggested questions. Respond with 5 smart, specific ❓ questions about this document. Format each as a clickable question.`,
    answer: `\n\nFor direct questions: answer directly and concisely. Use Key Details to surface the specific value asked about.`,
    extraction: `\n\nThe user wants specific data extracted from the document. Use 💡 Key Details as your primary section — list every relevant value as "Label: **Value**" bullets (amounts, dates, names, IDs, addresses, etc.). Add a 📄 Summary with 2-3 bullets for context. NEVER return raw JSON.`,
  };

  return base + (intentOverrides[intent] || intentOverrides.answer);
};

async function streamOpenAI(context, message, { supabase, userId, documentId, previousMessages = [] } = {}) {
  const lower = message.toLowerCase();
  const intent = classifyIntent(message);

  const systemContent = STRUCTURED_SYSTEM(context, intent);

  const needsConversion = lower.includes("in number") || lower.includes("convert") || lower.includes("amount");
  const userContent = message + (needsConversion ? "\n\nNote: Convert any written amounts to numeric form." : "");

  const stream = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    stream: true,
    temperature: 0.2,
    max_tokens: 1024,
    messages: [
      { role: "system", content: systemContent },
      ...previousMessages,
      { role: "user", content: userContent },
    ],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      let fullResponse = "";
      try {
        for await (const chunk of stream) {
          const token = chunk.choices[0]?.delta?.content;
          if (token) {
            fullResponse += token;
            // Send each token as an SSE event for reliable, unbuffered delivery
            controller.enqueue(encoder.encode(sseChunk(token)));
          }
        }
        // Signal end of stream
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        console.error("[CHAT] Stream error:", err);
        controller.enqueue(encoder.encode("data: [ERROR]\n\n"));
      } finally {
        controller.close();
        // Persist messages after stream completes (best-effort)
        if (supabase && userId && documentId && fullResponse) {
          try {
            await supabase.from("messages").insert([
              { document_id: documentId, user_id: userId, role: "user",      message },
              { document_id: documentId, user_id: userId, role: "assistant", message: fullResponse },
            ]);
          } catch (e) {
            console.warn("[CHAT] Message persist failed (non-fatal):", e.message);
          }
        }
      }
    },
  });

  return new Response(readable, { headers: SSE_HEADERS });
}

export async function POST(req) {
  try {
    const supabase = await createClient();

    // ── Auth ──────────────────────────────────────────────────────
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Question limit ────────────────────────────────────────────
    const { exceeded, count } = await checkQuestionLimit(supabase, user.id);
    if (exceeded) {
      return NextResponse.json(
        {
          error: `Question limit reached (${FREE_PLAN.maxQuestions} lifetime). Upgrade to Pro for unlimited access.`,
          limitExceeded: true,
          usage: { questions: count, maxQuestions: FREE_PLAN.maxQuestions },
        },
        { status: 403 }
      );
    }

    const { message, fileUrl } = await req.json();

    if (!fileUrl)         return NextResponse.json({ error: "fileUrl is required" }, { status: 400 });
    if (!message?.trim()) return NextResponse.json({ error: "message is required" }, { status: 400 });

    // ── Record usage ──────────────────────────────────────────────
    await recordQuestion(supabase, user.id);

    // ── RAG path: vector search ───────────────────────────────────
    let ragContext = null;
    let ragDocId = null;
    try {
      const { data: doc, error: docError } = await supabase
        .from("documents")
        .select("id")
        .eq("file_url", fileUrl)
        .eq("user_id", user.id)
        .maybeSingle();

      console.log("[CHAT] Document lookup:", doc?.id ?? "NOT FOUND", docError?.message ?? "");

      if (doc?.id) {
        ragDocId = doc.id;
        const embeddingRes = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: message,
        });
        const queryEmbedding = embeddingRes.data[0].embedding;

        const { data: chunks, error: searchError } = await supabase.rpc(
          "match_document_chunks",
          { query_embedding: queryEmbedding, match_document_id: doc.id, match_count: TOP_K }
        );

        console.log("[CHAT] RAG search error:", searchError?.message ?? "none");
        console.log("[CHAT] RAG chunks found:", chunks?.length ?? 0);

        if (!searchError && chunks?.length > 0) {
          let ctx = "";
          chunks.slice(0, 3).forEach((chunk, i) => {
            const entry = `[${i + 1}] ${chunk.content}\n\n`;
            if ((ctx + entry).length <= MAX_CONTEXT) ctx += entry;
          });
          if (ctx.trim()) ragContext = ctx;
        }
      }
    } catch (ragErr) {
      console.warn("[CHAT] RAG error:", ragErr.message);
    }

    // ── Fetch conversation history for multi-turn context ─────────
    let previousMessages = [];
    if (ragDocId) {
      try {
        const { data: history } = await supabase
          .from("messages")
          .select("role, message")
          .eq("document_id", ragDocId)
          .eq("user_id", user.id)
          .order("created_at", { ascending: true })
          .limit(HISTORY_LIMIT);
        if (history?.length > 0) {
          previousMessages = history.map((m) => ({ role: m.role, content: m.message }));
          console.log("[CHAT] History loaded:", previousMessages.length, "messages");
        }
      } catch (histErr) {
        console.warn("[CHAT] History fetch failed (non-fatal):", histErr.message);
      }
    }

    if (ragContext) {
      if (isExtractionRequest(message)) return extractStructured(ragContext, message);
      return streamOpenAI(ragContext, message, {
        supabase, userId: user.id, documentId: ragDocId, previousMessages,
      });
    }


    // ── Fallback: download PDF ─────────────────────────────────────
    let pdfBuffer = null;

    // Try 1: Supabase storage client (handles private buckets)
    try {
      const urlObj = new URL(fileUrl);
      // Match both /object/public/pdfs/ and /object/sign/pdfs/ patterns
      const pathMatch = urlObj.pathname.match(/\/object\/(?:public|sign)\/pdfs\/(.+)$/);
      if (pathMatch) {
        const storagePath = decodeURIComponent(pathMatch[1]).split("?")[0];
        const { data: blob, error: dlError } = await supabase.storage
          .from("pdfs")
          .download(storagePath);
        if (!dlError && blob) {
          pdfBuffer = Buffer.from(await blob.arrayBuffer());
          console.log("[CHAT] Downloaded via storage client, bytes:", pdfBuffer.length);
        } else {
          console.warn("[CHAT] Storage download failed:", dlError?.message);
        }
      }
    } catch (dlErr) {
      console.warn("[CHAT] Storage download threw:", dlErr.message);
    }

    // Try 2: Direct public URL fetch
    if (!pdfBuffer) {
      try {
        const fileRes = await fetch(fileUrl);
        if (fileRes.ok) {
          pdfBuffer = Buffer.from(await fileRes.arrayBuffer());
          console.log("[CHAT] Downloaded via public URL, bytes:", pdfBuffer.length);
        } else {
          console.error("[CHAT] Public URL fetch failed:", fileRes.status);
        }
      } catch (fetchErr) {
        console.warn("[CHAT] Public URL fetch threw:", fetchErr.message);
      }
    }

    if (!pdfBuffer) {
      return NextResponse.json(
        { error: "Could not download the PDF. Please re-upload the file and try again." },
        { status: 400 }
      );
    }

    let pdfData;
    try {
      pdfData = await pdf(pdfBuffer);
    } catch (parseErr) {
      console.error("[CHAT] pdf-parse error:", parseErr.message);
      return NextResponse.json({ error: "Failed to parse PDF. The file may be corrupted or password-protected." }, { status: 400 });
    }

    const pdfText = pdfData.text.replace(/\s+/g, " ").trim().slice(0, MAX_FALLBACK_CHARS);
    console.log("[CHAT] Extracted text length:", pdfText.length);

    if (!pdfText) {
      return streamText(
        "This PDF contains no extractable text. It may be a scanned image. " +
        "Please upload a text-based PDF."
      );
    }

    if (isExtractionRequest(message)) return extractStructured(pdfText, message);
    return streamOpenAI(pdfText, message, {
      supabase, userId: user.id, documentId: ragDocId, previousMessages,
    });

  } catch (err) {
    console.error("[CHAT] Error:", err);
    if (err?.status === 401) return NextResponse.json({ error: "Invalid OpenAI API key" }, { status: 500 });
    if (err?.status === 429) return NextResponse.json({ error: "OpenAI rate limit reached. Try again shortly." }, { status: 500 });
    return NextResponse.json({ error: "Chat failed. Please try again." }, { status: 500 });
  }
}
