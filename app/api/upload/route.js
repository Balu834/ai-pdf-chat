import { NextResponse } from "next/server";
import pdf from "pdf-parse";
import { createClient } from "@/lib/supabase-server-client";
import { getAdminClient } from "@/lib/admin-client";
import { getOpenAI } from "@/lib/openai-client";
import { checkUploadLimit, LIMITS } from "@/lib/subscription";
import { uploadLimiter } from "@/lib/rate-limit";
import { logger, reqCtx } from "@/lib/logger";

const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;

// Split a single page's text into overlapping chunks, keeping page_number
function splitPageIntoChunks(pageText, pageNumber) {
  const sentences = pageText.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [pageText];
  const chunks = [];
  let current = "";

  for (const sentence of sentences) {
    if ((current + sentence).length > CHUNK_SIZE && current.length > 50) {
      chunks.push({ content: current.trim(), page_number: pageNumber });
      const words = current.split(" ");
      current = words.slice(-Math.floor(CHUNK_OVERLAP / 5)).join(" ") + " " + sentence;
    } else {
      current += sentence;
    }
  }
  if (current.trim().length > 50) chunks.push({ content: current.trim(), page_number: pageNumber });
  return chunks;
}

// pdf-parse uses \f (form feed, char 12) as page separator
function chunkByPage(pdfData) {
  const pageChunks = [];
  const pages = pdfData.text.split("\f");
  const hasPageSeparators = pages.length > 1;
  pages.forEach((pageText, idx) => {
    const pageNumber = idx + 1;
    const cleaned = pageText.replace(/\s+/g, " ").trim();
    if (cleaned.length < 30) return; // skip blank/near-blank pages
    pageChunks.push(...splitPageIntoChunks(cleaned, pageNumber));
  });
  // Fallback ONLY when no \f separators were present — not when pages are all short (image-heavy)
  if (!hasPageSeparators && pageChunks.length === 0 && pdfData.text.trim().length > 30) {
    const cleaned = pdfData.text.replace(/\s+/g, " ").trim();
    pageChunks.push(...splitPageIntoChunks(cleaned, 1));
  }
  return pageChunks;
}

async function embedChunks(openai, contents) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: contents,
  });
  return response.data.map((d) => d.embedding);
}

export async function POST(req) {
  const ctx = reqCtx(req);
  let adminClient;
  try { adminClient = getAdminClient(); } catch { /* no service key */ }

  try {
    const supabase = await createClient();

    // ── Auth ──────────────────────────────────────────────────
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("[UPLOAD] Auth failed:", authError?.message ?? "no user in session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Rate limit ────────────────────────────────────────────
    const rl = uploadLimiter.check(user.id);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many uploads. Please wait before trying again." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      );
    }

    // ── PDF limit ─────────────────────────────────────────────
    // checkUploadLimit throws on DB/env errors → caught below as 500.
    // This guarantees paid users never get a 403 due to infrastructure failures.
    let limitCheck;
    try {
      limitCheck = await checkUploadLimit(user.id);
    } catch (limitErr) {
      logger.error({ ...ctx, route: "api/upload", message: `Subscription check failed: ${limitErr.message}`, userId: user.id, adminClient }).catch(() => {});
      return NextResponse.json({ error: "Could not verify subscription. Please try again." }, { status: 500 });
    }

    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: `PDF limit reached (${LIMITS.free.pdfs} lifetime). Upgrade to Pro for unlimited uploads.`, limitExceeded: true },
        { status: 403 }
      );
    }

    // ── Form data ─────────────────────────────────────────────
    let formData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    const file = formData.get("file");
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
    }

    // ── Storage upload ────────────────────────────────────────
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `${user.id}/${Date.now()}-${safeName}`;

    const { error: storageError } = await supabase.storage
      .from("pdfs")
      .upload(fileName, file, { contentType: "application/pdf", upsert: false });

    if (storageError) {
      logger.error({ ...ctx, route: "api/upload", message: `Storage upload failed: ${storageError.message}`, userId: user.id, adminClient }).catch(() => {});
      if (
        storageError.message?.includes("Bucket not found") ||
        storageError.statusCode === "404"
      ) {
        return NextResponse.json(
          { error: "Storage bucket 'pdfs' not found. Create it in Supabase → Storage." },
          { status: 500 }
        );
      }
      return NextResponse.json({ error: storageError.message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from("pdfs").getPublicUrl(fileName);
    const fileUrl = urlData.publicUrl;

    // ── DB record (atomic limit check + insert to prevent race conditions) ──
    // p_limit intentionally omitted — the DB function reads the plan itself.
    const { data: docId, error: dbError } = await getAdminClient().rpc(
      "insert_document_if_under_limit",
      {
        p_user_id:   user.id,
        p_file_name: file.name,
        p_file_url:  fileUrl,
        p_file_size: Math.min(file.size, 2_147_483_647),
      }
    );

    if (dbError) {
      if (dbError.message?.includes("LIMIT_EXCEEDED")) {
        return NextResponse.json(
          { error: `PDF limit reached (${LIMITS.free.pdfs} lifetime). Upgrade to Pro for unlimited uploads.`, limitExceeded: true },
          { status: 403 }
        );
      }
      logger.error({ ...ctx, route: "api/upload", message: `DB insert failed: ${dbError.message}`, userId: user.id, adminClient }).catch(() => {});
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    const docRecord = { id: docId };

    // ── Embeddings (blocking — Vercel kills background tasks after response) ──
    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = getOpenAI();
        const buffer = Buffer.from(await file.arrayBuffer());
        const pdfData = await pdf(buffer);
        console.log("[UPLOAD] Extracted text length:", pdfData.text.length, "pages:", pdfData.numpages);

        if (pdfData.text.trim()) {
          const pageChunks = chunkByPage(pdfData);
          console.log("[UPLOAD] Chunks created:", pageChunks.length, "across", pdfData.numpages, "pages");
          const allEmbeddings = [];
          for (let i = 0; i < pageChunks.length; i += 100) {
            const batch = pageChunks.slice(i, i + 100).map(c => c.content);
            const embeddings = await embedChunks(openai, batch);
            allEmbeddings.push(...embeddings);
          }
          const rows = pageChunks.map((chunk, i) => ({
            document_id: docRecord.id,
            content:     chunk.content,
            page_number: chunk.page_number,
            embedding:   allEmbeddings[i],
          }));
          const { error: chunkError } = await supabase.from("document_chunks").insert(rows);
          if (chunkError) {
            console.warn("[UPLOAD] Chunk insert failed:", chunkError.message);
          } else {
            console.log("[UPLOAD] Stored", rows.length, "chunks for doc", docRecord.id);
          }
        }
      } catch (embedErr) {
        console.warn("[UPLOAD] Embedding failed (non-fatal):", embedErr.message);
      }
    }

    return NextResponse.json({ success: true, url: fileUrl, id: docRecord.id });
  } catch (err) {
    logger.error({ ...ctx, route: "api/upload", message: err.message ?? "Unhandled upload error", stack: err.stack, adminClient }).catch(() => {});
    return NextResponse.json({ error: "Upload failed. Our team has been alerted." }, { status: 500 });
  }
}
