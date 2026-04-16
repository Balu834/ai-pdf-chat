import { NextResponse } from "next/server";
import OpenAI from "openai";
import pdf from "pdf-parse";
import { createClient } from "@/lib/supabase-server-client";
import { checkUploadLimit, LIMITS, recordPdfUpload } from "@/lib/subscription";
import { uploadLimiter } from "@/lib/rate-limit";
import { createClient as createAdmin } from "@supabase/supabase-js";

/**
 * POST /api/process-upload
 *
 * Called by the browser AFTER a successful direct Supabase Storage upload.
 * The file itself is NOT sent here — only metadata + the storage path.
 *
 * Responsibilities:
 *   1. Auth + rate-limit + PDF-count-limit gate (same guards as old /api/upload)
 *   2. Atomic DB insert via insert_document_if_under_limit RPC
 *   3. Download the already-stored PDF from its public URL, chunk + embed it
 *   4. Return { success, id, fileUrl } so the dashboard can refresh the doc list
 *
 * Why separate from /api/upload?
 *   • Storage upload from the browser gives real XHR progress (0–100 %).
 *   • Only a tiny JSON payload reaches this route → no Vercel body-size limit.
 *   • Total server time drops from (file-transit + parse + embed) to (parse + embed).
 */

const adminDb = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CHUNK_SIZE    = 800;
const CHUNK_OVERLAP = 100;

function chunkText(text) {
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [text];
  const chunks = [];
  let current = "";
  for (const sentence of sentences) {
    if ((current + sentence).length > CHUNK_SIZE && current.length > 50) {
      chunks.push(current.trim());
      const words = current.split(" ");
      current = words.slice(-Math.floor(CHUNK_OVERLAP / 5)).join(" ") + " " + sentence;
    } else {
      current += sentence;
    }
  }
  if (current.trim().length > 50) chunks.push(current.trim());
  return chunks;
}

async function embedChunks(openai, chunks) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: chunks,
  });
  return response.data.map((d) => d.embedding);
}

export async function POST(req) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Rate limit ────────────────────────────────────────────────────────────
    const rl = uploadLimiter.check(user.id);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many uploads. Please wait before trying again." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      );
    }

    // ── PDF count limit ───────────────────────────────────────────────────────
    let limitCheck;
    try {
      limitCheck = await checkUploadLimit(user.id);
    } catch (e) {
      console.error("[PROCESS-UPLOAD] Subscription check failed:", e.message);
      return NextResponse.json(
        { error: "Could not verify subscription. Please try again." },
        { status: 500 }
      );
    }

    console.log(
      `[PROCESS-UPLOAD] user=${user.id} plan=${limitCheck.isPro ? "pro" : "free"} ` +
      `used=${limitCheck.used}/${limitCheck.limit ?? "∞"} allowed=${limitCheck.allowed}`
    );

    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: `PDF limit reached (${LIMITS.free.pdfs} lifetime). Upgrade to Pro for unlimited uploads.`,
          limitExceeded: true,
        },
        { status: 403 }
      );
    }

    // ── Payload ───────────────────────────────────────────────────────────────
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { storagePath, fileName, fileSize, fileUrl } = body;

    if (!storagePath || !fileName || !fileUrl) {
      return NextResponse.json(
        { error: "Missing required fields: storagePath, fileName, fileUrl" },
        { status: 400 }
      );
    }

    // Validate that storagePath belongs to this user (security: can't register
    // another user's file by guessing their storage path)
    if (!storagePath.startsWith(`${user.id}/`)) {
      return NextResponse.json(
        { error: "Storage path does not belong to this account." },
        { status: 403 }
      );
    }

    // Validate fileSize is a reasonable number
    const size = Number(fileSize) || 0;
    if (size < 0) {
      return NextResponse.json({ error: "Invalid file size" }, { status: 400 });
    }

    // ── Atomic DB insert ──────────────────────────────────────────────────────
    const pdfLimit = limitCheck.isPro ? 2147483647 : LIMITS.free.pdfs;
    const { data: docId, error: dbError } = await adminDb.rpc(
      "insert_document_if_under_limit",
      {
        p_user_id:   user.id,
        p_file_name: fileName,
        p_file_url:  fileUrl,
        p_file_size: Math.min(size, 2147483647), // guard against int overflow
        p_limit:     pdfLimit,
      }
    );

    if (dbError) {
      if (dbError.message?.includes("LIMIT_EXCEEDED")) {
        return NextResponse.json(
          {
            error: `PDF limit reached (${LIMITS.free.pdfs} lifetime). Upgrade to Pro for unlimited uploads.`,
            limitExceeded: true,
          },
          { status: 403 }
        );
      }
      console.error("[PROCESS-UPLOAD] DB error:", dbError.message);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    const docRecord = { id: docId };

    // ── Embeddings ────────────────────────────────────────────────────────────
    // Non-fatal: if embedding fails the doc is still uploaded and usable;
    // the chat route falls back to full-text if no chunks are found.
    if (process.env.OPENAI_API_KEY) {
      try {
        // Download the PDF from its public storage URL (Supabase CDN is fast)
        const pdfFetch = await fetch(fileUrl);
        if (!pdfFetch.ok) {
          console.warn("[PROCESS-UPLOAD] Could not fetch PDF for embedding:", pdfFetch.status);
        } else {
          const openai  = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
          const buffer  = Buffer.from(await pdfFetch.arrayBuffer());
          const pdfData = await pdf(buffer);
          const rawText = pdfData.text.replace(/\s+/g, " ").trim();
          console.log("[PROCESS-UPLOAD] Extracted text length:", rawText.length);

          if (rawText) {
            const chunks = chunkText(rawText);
            console.log("[PROCESS-UPLOAD] Chunks:", chunks.length);

            const allEmbeddings = [];
            for (let i = 0; i < chunks.length; i += 100) {
              const batch = chunks.slice(i, i + 100);
              const embeddings = await embedChunks(openai, batch);
              allEmbeddings.push(...embeddings);
            }

            const rows = chunks.map((content, i) => ({
              document_id: docRecord.id,
              content,
              embedding:   allEmbeddings[i],
            }));

            const { error: chunkError } = await supabase
              .from("document_chunks")
              .insert(rows);

            if (chunkError) {
              console.warn("[PROCESS-UPLOAD] Chunk insert failed:", chunkError.message);
            } else {
              console.log("[PROCESS-UPLOAD] Stored", rows.length, "chunks for doc", docRecord.id);
            }
          }
        }
      } catch (embedErr) {
        console.warn("[PROCESS-UPLOAD] Embedding failed (non-fatal):", embedErr.message);
      }
    }

    // Increment user_stats counter (non-fatal)
    try { await recordPdfUpload(user.id); } catch {}

    return NextResponse.json({ success: true, id: docRecord.id, fileUrl });
  } catch (err) {
    console.error("[PROCESS-UPLOAD] Unhandled error:", err);
    return NextResponse.json({ error: err.message || "Processing failed" }, { status: 500 });
  }
}
