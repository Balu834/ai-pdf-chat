import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";
import { getAdminClient } from "@/lib/admin-client";
import { getOpenAI } from "@/lib/openai-client";
import { checkQuestionLimit, recordQuestion } from "@/lib/limits";

const SSE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  "X-Accel-Buffering": "no",
};

const MULTI_SYSTEM = (context) => `You are Intellixy, an AI assistant analyzing MULTIPLE documents simultaneously.

DOCUMENTS CONTEXT:
${context}

─── RESPONSE FORMAT RULES ───
📄 **Answer:**
Answer the question using information found across all provided documents.

💡 **Key Details:**
• Specific values, comparisons, or facts — formatted as "Label: **Value**"
• When comparing across documents, clearly state which document each fact comes from.

📊 **Cross-Document Comparison** (only if the question asks to compare):
• Side-by-side comparison table or bullets showing differences/similarities.

─── RULES ───
1. Use ONLY information from the provided documents. Never guess.
2. When citing a fact, mention the document name it came from.
3. Bold important values: amounts, dates, names.
4. If information is only in one document, say so explicitly.
5. If something is not found in any document, say "Not mentioned in any of the selected documents."`;

export async function POST(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Question limit check
    const { exceeded } = await checkQuestionLimit(supabase, user.id);
    if (exceeded) {
      return NextResponse.json(
        { error: "Question limit reached. Upgrade to Pro to continue.", limitExceeded: true },
        { status: 403 }
      );
    }

    const { message, documentIds, sessionId } = await req.json();
    if (!message?.trim()) return NextResponse.json({ error: "message is required" }, { status: 400 });
    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json({ error: "documentIds array is required" }, { status: 400 });
    }
    if (documentIds.length > 10) {
      return NextResponse.json({ error: "Maximum 10 documents per query" }, { status: 400 });
    }

    // Verify all docs belong to this user
    const { data: userDocs, error: docsError } = await supabase
      .from("documents")
      .select("id, file_name")
      .in("id", documentIds)
      .eq("user_id", user.id);

    if (docsError || !userDocs?.length) {
      return NextResponse.json({ error: "Documents not found" }, { status: 404 });
    }

    const docMap = Object.fromEntries(userDocs.map(d => [d.id, d.file_name]));
    const validIds = userDocs.map(d => d.id);

    await recordQuestion(supabase, user.id);

    // Vector search across all selected documents
    const openai = getOpenAI();
    const embeddingRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: message,
    });
    const queryEmbedding = embeddingRes.data[0].embedding;

    const { data: chunks, error: searchError } = await getAdminClient().rpc(
      "match_chunks_multi_doc",
      { query_embedding: queryEmbedding, doc_ids: validIds, match_count: 12 }
    );

    if (searchError) console.warn("[MULTI-CHAT] Search error:", searchError.message);

    // Build context with document attribution
    const sources = []; // { docId, fileName, page }
    let context = "";
    const MAX_CONTEXT = 8000;

    (chunks ?? []).forEach((chunk, i) => {
      const fileName = docMap[chunk.document_id] ?? "Unknown";
      const pageLabel = chunk.page_number ? `, Page ${chunk.page_number}` : "";
      const entry = `[${i + 1}] Source: ${fileName}${pageLabel}\n${chunk.content}\n\n`;
      if ((context + entry).length <= MAX_CONTEXT) {
        context += entry;
        const exists = sources.find(
          s => s.docId === chunk.document_id && s.page === chunk.page_number
        );
        if (!exists && (chunk.page_number || fileName)) {
          sources.push({
            docId:    chunk.document_id,
            fileName: fileName.replace(/\.pdf$/i, ""),
            page:     chunk.page_number ?? null,
          });
        }
      }
    });

    if (!context.trim()) {
      return NextResponse.json({ error: "No relevant content found in the selected documents." }, { status: 400 });
    }

    // Fetch recent history for this session
    let previousMessages = [];
    try {
      if (sessionId) {
        const { data: history } = await supabase
          .from("messages")
          .select("role, message")
          .eq("chat_session_id", sessionId)
          .eq("user_id", user.id)
          .order("created_at", { ascending: true })
          .limit(8);
        if (history?.length > 0) {
          previousMessages = history.map(m => ({ role: m.role, content: m.message }));
        }
      }
    } catch { /* non-fatal */ }

    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      stream: true,
      temperature: 0.2,
      max_tokens: 1200,
      messages: [
        { role: "system", content: MULTI_SYSTEM(context) },
        ...previousMessages,
        { role: "user", content: message },
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
              controller.enqueue(
                encoder.encode(`data: ${token.replace(/\n/g, "\\n")}\n\n`)
              );
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          // Emit sources as structured JSON for the frontend
          if (sources.length > 0) {
            controller.enqueue(
              encoder.encode(`data: [SOURCES]${JSON.stringify(sources)}\n\n`)
            );
          }
        } catch {
          controller.enqueue(encoder.encode("data: [ERROR]\n\n"));
        } finally {
          controller.close();
          // Persist to messages table
          if (fullResponse) {
            try {
              await supabase.from("messages").insert([
                { user_id: user.id, role: "user",      message,            chat_session_id: sessionId ?? null, document_id: validIds[0] },
                { user_id: user.id, role: "assistant", message: fullResponse, chat_session_id: sessionId ?? null, document_id: validIds[0] },
              ]);
            } catch { /* non-fatal */ }
          }
        }
      },
    });

    return new Response(readable, { headers: SSE_HEADERS });
  } catch (err) {
    return NextResponse.json({ error: err.message ?? "Multi-chat failed" }, { status: 500 });
  }
}
