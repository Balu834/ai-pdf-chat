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

// Keywords that trigger structured extraction mode
const EXTRACTION_TRIGGERS = [
  "extract", "invoice", "bill", "receipt", "resume", "cv",
  "structured", "json", "details", "billing info", "invoice data",
  "parse", "fill form", "key fields",
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

function streamText(text) {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(text));
        controller.close();
      },
    }),
    { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" } }
  );
}

async function streamOpenAI(context, message, { supabase, userId, documentId, previousMessages = [] } = {}) {
  const lower = message.toLowerCase();
  const isSummary = lower.includes("summar") || lower.includes("what is this") ||
    lower.includes("what about") || lower.includes("describe") ||
    lower.includes("overview") || lower.includes("key point") || lower.includes("about this");

  // Context lives in system prompt so all conversation turns can reference it
  const systemContent = isSummary
    ? `You are a helpful PDF assistant. Summarize the provided document context clearly and concisely. Cover the main topics, key points, and important details.\n\nDOCUMENT CONTEXT:\n${context}`
    : `You are an intelligent document assistant. Answer using ONLY the provided document context.\n\nRules:\n1. Identify the exact field the user is asking about (e.g. total amount, date, name).\n2. If multiple numbers exist, choose the one matching the question.\n3. Convert written amounts to numbers if asked (e.g. "Three Hundred Twenty" → 320).\n4. Do NOT return unrelated data.\n5. If the answer is not in the context, say so briefly.\n6. Be precise — one or two sentences unless a list is needed.\n\nDOCUMENT CONTEXT:\n${context}`;

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
            controller.enqueue(encoder.encode(token));
          }
        }
      } catch (err) {
        console.error("[CHAT] Stream error:", err);
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

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
  });
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
          error: `Daily question limit reached (${FREE_PLAN.maxQuestionsPerDay}/day). Upgrade your plan.`,
          limitExceeded: true,
          usage: { questions: count, maxQuestions: FREE_PLAN.maxQuestionsPerDay },
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
        .single();

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

    // ── Fallback: download PDF via authenticated storage client ──────
    let pdfBuffer = null;
    try {
      const urlObj = new URL(fileUrl);
      const pathMatch = urlObj.pathname.match(/\/object\/public\/pdfs\/(.+)$/);
      if (pathMatch) {
        const storagePath = pathMatch[1];
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

    if (!pdfBuffer) {
      const fileRes = await fetch(fileUrl);
      if (fileRes.ok) {
        const contentType = fileRes.headers.get("content-type") || "";
        if (contentType.includes("pdf") || contentType.includes("octet-stream")) {
          pdfBuffer = Buffer.from(await fileRes.arrayBuffer());
          console.log("[CHAT] Downloaded via public URL, bytes:", pdfBuffer.length);
        } else {
          console.error("[CHAT] Public URL returned non-PDF content-type:", contentType);
        }
      } else {
        console.error("[CHAT] Public URL fetch failed:", fileRes.status);
      }
    }

    if (!pdfBuffer) {
      return NextResponse.json(
        { error: "Could not download the PDF. Make sure the 'pdfs' storage bucket exists and has been created in Supabase." },
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
