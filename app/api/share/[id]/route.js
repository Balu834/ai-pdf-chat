import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Public anon client — no auth needed, RLS handles access
const anon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    // Fetch share metadata
    const { data: share, error: shareError } = await anon
      .from("shared_chats")
      .select("id, title, is_public, document_id, created_at")
      .eq("id", id)
      .eq("is_public", true)
      .maybeSingle();

    if (shareError || !share) {
      return NextResponse.json({ error: "Share link not found or has been revoked" }, { status: 404 });
    }

    // Fetch chat messages for this document (public read via RLS)
    const { data: messages } = await anon
      .from("messages")
      .select("role, message, created_at")
      .eq("document_id", share.document_id)
      .order("created_at", { ascending: true })
      .limit(200);

    return NextResponse.json({
      share: { id: share.id, title: share.title, createdAt: share.created_at },
      messages: messages || [],
    });
  } catch (err) {
    console.error("[api/share/[id]]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
