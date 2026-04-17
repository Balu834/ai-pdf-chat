import { NextResponse } from "next/server";
import OpenAI from "openai";
import pdf from "pdf-parse";
import { createClient } from "@/lib/supabase-server-client";
import { checkUploadLimit, LIMITS, recordPdfUpload } from "@/lib/subscription";
import { uploadLimiter } from "@/lib/rate-limit";
import { createClient as createAdmin } from "@supabase/supabase-js";

// ─── Vercel serverless timeout ────────────────────────────────────────────────
// Hobby plan: 10 s.  Pro plan: 60 s.  Enterprise: 300 s.
// Set this to match your Vercel plan so the function completes cleanly instead
// of being killed mid-stream.  Increase to 300 on Enterprise if needed.
export const maxDuration = 60;

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_TEXT_CHARS   = 120_000;  // ~40 pages — truncate beyond this
const CHUNK_SIZE       = 800;
const CHUNK_OVERLAP    = 100;
const EMBED_BATCH_SIZE = 100;      // OpenAI max per request
const EMBED_CONCURRENCY = 2;       // parallel embedding requests
const PDF_FETCH_TIMEOUT = 15_000;  // ms — abort if Supabase CDN is slow
const PDF_PARSE_TIMEOUT = 25_000;  // ms — abort if pdf-parse hangs

// ─── Admin Supabase client (bypasses RLS) ────────────────────────────────────

const adminDb = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Wrap a promise with a hard timeout.
 * Throws { message, code: "TIMEOUT" } if the deadline is exceeded.
 */
function withTimeout(promise, ms, label) {
  return new Promise((resolve, reject) => {
    const id = setTimeout(
      () => reject(Object.assign(new Error(`${label} timed out after ${ms}ms`), { code: "TIMEOUT" })),
      ms
    );
    promise.then(
      (v) => { clearTimeout(id); resolve(v); },
      (e) => { clearTimeout(id); reject(e); }
    );
  });
}

/**
 * Split text into overlapping chunks on sentence boundaries.
 * Chunks that are too short (< 50 chars) are dropped — they carry no signal.
 */
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

/**
 * Embed one batch of chunks (≤ EMBED_BATCH_SIZE).
 * Retries once on 429/rate-limit with a 2 s back-off.
 */
async function embedBatch(openai, chunks, attempt = 0) {
  try {
    const res = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: chunks,
    });
    return res.data.map((d) => d.embedding);
  } catch (err) {
    const isRateLimit = err?.status === 429 || err?.code === "rate_limit_exceeded";
    if (isRateLimit && attempt === 0) {
      console.warn("[PROCESS-UPLOAD] OpenAI rate limit — retrying in 2 s");
      await new Promise((r) => setTimeout(r, 2000));
      return embedBatch(openai, chunks, 1);
    }
    throw err;
  }
}

/**
 * Run embedding batches with limited concurrency so we don't flood the
 * OpenAI rate-limit ceiling with 5+ simultaneous requests.
 */
async function embedAllChunks(openai, chunks) {
  const batches = [];
  for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
    batches.push(chunks.slice(i, i + EMBED_BATCH_SIZE));
  }

  const allEmbeddings = [];

  // Process EMBED_CONCURRENCY batches at a time
  for (let i = 0; i < batches.length; i += EMBED_CONCURRENCY) {
    const window = batches.slice(i, i + EMBED_CONCURRENCY);
    const results = await Promise.all(window.map((b) => embedBatch(openai, b)));
    for (const r of results) allEmbeddings.push(...r);
  }

  return allEmbeddings;
}

// ─── Route handler ────────────────────────────────────────────────────────────

/**
 * POST /api/process-upload
 *
 * Called by the browser AFTER a successful direct Supabase Storage upload.
 * The file itself is NOT sent here — only metadata + the storage path.
 *
 * Body: { storagePath, fileName, fileSize, fileUrl }
 *
 * Steps:
 *   1. Auth + rate-limit + PDF-count-limit gate
 *   2. Atomic DB insert via insert_document_if_under_limit RPC
 *   3. Download the PDF from its public URL, parse text, chunk, embed
 *   4. Return { success, id, fileUrl }
 */
export async function POST(req) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  let supabase;
  let user;
  try {
    supabase = await createClient();
    const { data, error: authError } = await supabase.auth.getUser();
    if (authError || !data?.user) {
      console.error("[PROCESS-UPLOAD] Auth failed:", authError?.message ?? "no session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    user = data.user;
  } catch (e) {
    console.error("[PROCESS-UPLOAD] Auth exception:", e.message);
    return NextResponse.json({ error: "Authentication error. Please refresh and try again." }, { status: 401 });
  }

  // ── Rate limit ──────────────────────────────────────────────────────────────
  const rl = uploadLimiter.check(user.id);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many uploads. Please wait before trying again." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  // ── PDF count pre-check (fast-fail, non-blocking on infra error) ────────────
  // The authoritative gate is the DB RPC below. This is an early-exit
  // optimisation only — infra failures here must NOT block the upload.
  try {
    const limitCheck = await checkUploadLimit(user.id);
    console.log(
      `[PROCESS-UPLOAD] pre-check user=${user.id} ` +
      `plan=${limitCheck.isPro ? "pro" : "free"} ` +
      `used=${limitCheck.used}/${limitCheck.limit ?? "∞"} ` +
      `allowed=${limitCheck.allowed}`
    );
    if (!limitCheck.isPro && !limitCheck.allowed) {
      return NextResponse.json(
        {
          error: `PDF limit reached (${LIMITS.free.pdfs} free uploads). Upgrade to Pro for unlimited uploads.`,
          limitExceeded: true,
        },
        { status: 403 }
      );
    }
  } catch (preCheckErr) {
    // Subscription check threw (DB blip, missing env, etc.) — log and continue.
    // The DB function is the authoritative gate and will block if truly over limit.
    console.warn(
      `[PROCESS-UPLOAD] subscription pre-check failed for ${user.id} — ` +
      `continuing to DB gate. Error: ${preCheckErr.message}`
    );
  }

  // ── Parse request body ──────────────────────────────────────────────────────
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { storagePath, fileName, fileSize, fileUrl } = body ?? {};

  if (!storagePath || !fileName || !fileUrl) {
    return NextResponse.json(
      { error: "Missing required fields: storagePath, fileName, fileUrl" },
      { status: 400 }
    );
  }

  // Security: storagePath must belong to this user. Prevents one user from
  // registering another user's already-uploaded file via a guessed path.
  if (!storagePath.startsWith(`${user.id}/`)) {
    return NextResponse.json(
      { error: "Storage path does not belong to this account." },
      { status: 403 }
    );
  }

  const size = Math.max(0, Number(fileSize) || 0);

  // ── Atomic DB insert ────────────────────────────────────────────────────────
  // p_limit intentionally omitted — the DB function reads the plan itself.
  // This guarantees correctness even if the server-side pre-check above was
  // stale, wrong, or skipped due to an infrastructure error.
  let docId;
  try {
    const { data, error: dbError } = await adminDb.rpc(
      "insert_document_if_under_limit",
      {
        p_user_id:   user.id,
        p_file_name: fileName,
        p_file_url:  fileUrl,
        p_file_size: Math.min(size, 2_147_483_647), // cap to PostgreSQL int max
      }
    );

    if (dbError) {
      if (dbError.message?.includes("LIMIT_EXCEEDED")) {
        console.log(`[PROCESS-UPLOAD] DB gate: LIMIT_EXCEEDED for ${user.id}`);
        return NextResponse.json(
          {
            error: `PDF limit reached (${LIMITS.free.pdfs} free uploads). Upgrade to Pro for unlimited uploads.`,
            limitExceeded: true,
          },
          { status: 403 }
        );
      }
      if (dbError.message?.includes("NULL_USER_ID")) {
        console.error("[PROCESS-UPLOAD] NULL_USER_ID — auth session may have expired");
        return NextResponse.json(
          { error: "Session expired. Please refresh and try again." },
          { status: 401 }
        );
      }
      console.error("[PROCESS-UPLOAD] DB error:", dbError.message, "| code:", dbError.code);
      return NextResponse.json({ error: "Database error — please try again." }, { status: 500 });
    }

    docId = data;
  } catch (dbException) {
    console.error("[PROCESS-UPLOAD] DB exception:", dbException.message);
    return NextResponse.json({ error: "Database error — please try again." }, { status: 500 });
  }

  // ── PDF processing (non-fatal) ──────────────────────────────────────────────
  // Doc is already in the DB at this point. Embedding failure must NOT cause
  // a 500 — the chat route falls back to full-text search if no chunks exist.
  if (process.env.OPENAI_API_KEY) {
    try {
      // Step A: fetch the PDF from Supabase Storage with a hard timeout
      let pdfBuffer;
      try {
        const controller = new AbortController();
        const fetchTimeout = setTimeout(() => controller.abort(), PDF_FETCH_TIMEOUT);
        const pdfRes = await fetch(fileUrl, { signal: controller.signal });
        clearTimeout(fetchTimeout);

        if (!pdfRes.ok) {
          console.warn(`[PROCESS-UPLOAD] PDF fetch failed: HTTP ${pdfRes.status} for ${fileUrl}`);
          throw new Error(`PDF fetch returned ${pdfRes.status}`);
        }
        pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());
        console.log(`[PROCESS-UPLOAD] Fetched PDF: ${(pdfBuffer.length / 1024).toFixed(0)} KB`);
      } catch (fetchErr) {
        if (fetchErr.name === "AbortError" || fetchErr.code === "TIMEOUT") {
          console.warn("[PROCESS-UPLOAD] PDF fetch timed out — skipping embeddings");
        } else {
          console.warn("[PROCESS-UPLOAD] PDF fetch error:", fetchErr.message);
        }
        // Return success — doc is saved, embeddings just won't exist
        await safeRecordUpload(user.id);
        return NextResponse.json({ success: true, id: docId, fileUrl, embedded: false });
      }

      // Step B: parse PDF text with a hard timeout (pdf-parse can hang on corrupt files)
      let rawText = "";
      try {
        const parsed = await withTimeout(
          pdf(pdfBuffer, {
            // Disable features that are slow or can hang
            max: 0,               // parse all pages (0 = unlimited)
            version: "v2.0.550",  // suppress the test-file console warning
          }),
          PDF_PARSE_TIMEOUT,
          "pdf-parse"
        );
        rawText = parsed.text.replace(/\s+/g, " ").trim();
        console.log(`[PROCESS-UPLOAD] Extracted text: ${rawText.length} chars`);
      } catch (parseErr) {
        const reason = parseErr.code === "TIMEOUT"
          ? "parsing timed out"
          : `parsing failed: ${parseErr.message}`;
        console.warn(`[PROCESS-UPLOAD] PDF ${reason} — skipping embeddings`);
        await safeRecordUpload(user.id);
        return NextResponse.json({ success: true, id: docId, fileUrl, embedded: false, parseWarning: reason });
      }

      // Step C: text quality check — scanned PDFs produce near-empty text
      if (!rawText || rawText.length < 50) {
        console.warn("[PROCESS-UPLOAD] Too little text extracted — likely a scanned PDF (image-only)");
        await safeRecordUpload(user.id);
        return NextResponse.json({
          success: true,
          id: docId,
          fileUrl,
          embedded: false,
          parseWarning: "This PDF appears to be a scanned image. Text extraction returned minimal content — AI answers may be limited.",
        });
      }

      // Step D: truncate very large documents to avoid OOM / timeout
      let processedText = rawText;
      let truncated = false;
      if (rawText.length > MAX_TEXT_CHARS) {
        processedText = rawText.slice(0, MAX_TEXT_CHARS);
        truncated = true;
        console.warn(`[PROCESS-UPLOAD] Text truncated from ${rawText.length} to ${MAX_TEXT_CHARS} chars`);
      }

      // Step E: chunk
      const chunks = chunkText(processedText);
      console.log(`[PROCESS-UPLOAD] Created ${chunks.length} chunks${truncated ? " (truncated)" : ""}`);

      if (chunks.length === 0) {
        console.warn("[PROCESS-UPLOAD] chunkText produced 0 chunks — skipping embeddings");
        await safeRecordUpload(user.id);
        return NextResponse.json({ success: true, id: docId, fileUrl, embedded: false });
      }

      // Step F: embed (concurrent batches, single retry on rate-limit)
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      let allEmbeddings;
      try {
        allEmbeddings = await embedAllChunks(openai, chunks);
      } catch (embedErr) {
        console.warn("[PROCESS-UPLOAD] Embedding failed:", embedErr.message);
        await safeRecordUpload(user.id);
        return NextResponse.json({ success: true, id: docId, fileUrl, embedded: false });
      }

      // Step G: persist chunks
      const rows = chunks.map((content, i) => ({
        document_id: docId,
        content,
        embedding:   allEmbeddings[i],
      }));

      const { error: chunkError } = await supabase
        .from("document_chunks")
        .insert(rows);

      if (chunkError) {
        console.warn("[PROCESS-UPLOAD] Chunk insert failed:", chunkError.message);
      } else {
        console.log(`[PROCESS-UPLOAD] Stored ${rows.length} chunks for doc ${docId}`);
      }
    } catch (processingErr) {
      // Catch-all for any unexpected error in the processing pipeline.
      // Doc is already inserted — return success so the user isn't blocked.
      console.error("[PROCESS-UPLOAD] Unexpected processing error:", processingErr.message);
    }
  } else {
    console.warn("[PROCESS-UPLOAD] OPENAI_API_KEY not set — skipping embeddings");
  }

  await safeRecordUpload(user.id);
  return NextResponse.json({ success: true, id: docId, fileUrl, embedded: !!process.env.OPENAI_API_KEY });
}

// ─── Helper: record upload stat without crashing ─────────────────────────────

async function safeRecordUpload(userId) {
  try {
    await recordPdfUpload(userId);
  } catch {
    // Non-fatal — stat increment failures must not block the response
  }
}
