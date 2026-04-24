import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";

// Public anon client — no auth needed, RLS handles access
const anon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const admin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    // Fetch share metadata
    const { data: share, error: shareError } = await anon
      .from("shared_chats")
      .select("id, title, is_public, document_id, chat_session_id, created_at, view_count")
      .eq("id", id)
      .eq("is_public", true)
      .maybeSingle();

    if (shareError || !share) {
      return NextResponse.json({ error: "Share link not found or has been revoked" }, { status: 404 });
    }

    // Increment view_count best-effort
    admin.from("shared_chats").update({ view_count: (share.view_count || 0) + 1 }).eq("id", id).then(() => {});

    // Fetch messages — session-scoped if chat_session_id is set
    let msgQuery = anon.from("messages").select("role, message, created_at").order("created_at", { ascending: true }).limit(200);

    if (share.chat_session_id) {
      msgQuery = msgQuery.eq("chat_session_id", share.chat_session_id);
    } else {
      msgQuery = msgQuery.eq("document_id", share.document_id);
    }

    const { data: messages } = await msgQuery;

    return NextResponse.json({
      share: { id: share.id, title: share.title, createdAt: share.created_at, viewCount: (share.view_count || 0) + 1 },
      messages: messages || [],
    });
  } catch (err) {
    console.error("[api/share/[id]]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
