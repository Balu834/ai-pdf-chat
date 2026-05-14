/**
 * POST /api/ask — DEPRECATED STUB
 *
 * The original implementation used fs.readFileSync(filePath) with a
 * client-supplied path — a path-traversal vulnerability that could expose
 * any file on the server.
 *
 * All PDF Q&A now goes through /api/chat (Supabase Storage + OpenAI).
 * This stub exists to give callers a clear migration error instead of a crash.
 */
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:      "This endpoint has been removed.",
      migration:  "Use POST /api/chat with { documentId, question } instead.",
    },
    { status: 410 } // 410 Gone — intentionally removed
  );
}
