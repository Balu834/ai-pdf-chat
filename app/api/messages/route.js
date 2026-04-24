import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";

/* GET ?sessionId=xxx  → messages for a chat session (preferred)
   GET ?documentId=xxx → legacy fallback: messages by document */
export async function GET(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json([], { status: 401 });

    const { searchParams } = new URL(req.url);
    const sessionId  = searchParams.get("sessionId");
    const documentId = searchParams.get("documentId");

    let query = supabase
      .from("messages")
      .select("id, role, message, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(300);

    if (sessionId) {
      query = query.eq("chat_session_id", sessionId);
    } else if (documentId) {
      query = query.eq("document_id", documentId);
    } else {
      return NextResponse.json([]);
    }

    const { data, error } = await query;
    if (error) {
      console.warn("[messages GET]", error.message);
      return NextResponse.json([]);
    }
    return NextResponse.json(data || []);
  } catch (err) {
    console.error("[messages GET]", err.message);
    return NextResponse.json([]);
  }
}

/* DELETE ?sessionId=xxx  → clear messages in a session
   DELETE ?documentId=xxx → legacy: clear by document */
export async function DELETE(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const sessionId  = searchParams.get("sessionId");
    const documentId = searchParams.get("documentId");

    let query = supabase.from("messages").delete().eq("user_id", user.id);

    if (sessionId) {
      query = query.eq("chat_session_id", sessionId);
    } else if (documentId) {
      query = query.eq("document_id", documentId);
    } else {
      return NextResponse.json({ error: "sessionId or documentId required" }, { status: 400 });
    }

    const { error } = await query;
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[messages DELETE]", err.message);
    return NextResponse.json({ error: "Failed to clear chat" }, { status: 500 });
  }
}
