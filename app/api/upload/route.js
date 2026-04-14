import { NextResponse } from "next/server";
import OpenAI from "openai";
import pdf from "pdf-parse";
import { createClient } from "@/lib/supabase-server-client";
import { checkUploadLimit, recordPdfUpload, LIMITS } from "@/lib/subscription";

const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;

function chunkText(text) {
  // Split on sentence boundaries so chunks don't cut mid-sentence
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [text];
  const chunks = [];
  let current = "";

  for (const sentence of sentences) {
    if ((current + sentence).length > CHUNK_SIZE && current.length > 50) {
      chunks.push(current.trim());
      // Overlap: keep last portion of previous chunk
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
    const supabase = await createClient();

    // ── Auth ──────────────────────────────────────────────────
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── PDF limit ─────────────────────────────────────────────
    // checkUploadLimit throws on DB/env errors → caught below as 500.
    // This guarantees paid users never get a 403 due to infrastructure failures.
    let limitCheck;
    try {
      limitCheck = await checkUploadLimit(user.id);
    } catch (limitErr) {
      console.error("[UPLOAD] Subscription check failed:", limitErr.message);
      return NextResponse.json({ error: "Could not verify subscription. Please try again." }, { status: 500 });
    }
    // Debug log — visible in Vercel function logs and local dev console.
    // Shows plan/usage for every upload attempt; remove once stable.
    console.log(
      `[UPLOAD] user=${user.id} plan=${limitCheck.isPro ? "pro" : "free"} ` +
      `used=${limitCheck.used}/${limitCheck.limit ?? "∞"} allowed=${limitCheck.allowed}`
    );

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
      console.error("[UPLOAD] Storage error:", storageError.message);
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

    // ── DB record ─────────────────────────────────────────────
    const { data: docRecord, error: dbError } = await supabase
      .from("documents")
      .insert([{ file_name: file.name, file_url: fileUrl, file_size: file.size, user_id: user.id }])
      .select("id")
      .single();

    if (dbError) {
      console.error("[UPLOAD] DB error:", dbError.message);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // ── Increment lifetime PDF counter ────────────────────────
    await recordPdfUpload(user.id);

    // ── Embeddings (blocking — Vercel kills background tasks after response) ──
    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const buffer = Buffer.from(await file.arrayBuffer());
        const pdfData = await pdf(buffer);
        const rawText = pdfData.text.replace(/\s+/g, " ").trim();
        console.log("[UPLOAD] Extracted text length:", rawText.length);

        if (rawText) {
          const chunks = chunkText(rawText);
          console.log("[UPLOAD] Chunks created:", chunks.length);
          const allEmbeddings = [];
          for (let i = 0; i < chunks.length; i += 100) {
            const batch = chunks.slice(i, i + 100);
            const embeddings = await embedChunks(openai, batch);
            allEmbeddings.push(...embeddings);
          }
          const rows = chunks.map((content, i) => ({
            document_id: docRecord.id,
            content,
            embedding: allEmbeddings[i],
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
    console.error("[UPLOAD] Unhandled error:", err);
    return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 });
  }
}
