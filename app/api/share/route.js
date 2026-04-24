import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";

/* GET /api/share?documentId=xxx[&sessionId=yyy] — look up existing share */
export async function GET(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({}, { status: 401 });

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("documentId");
    const sessionId  = searchParams.get("sessionId");
    if (!documentId) return NextResponse.json({}, { status: 400 });

    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://intellixy.vercel.app";

    let query = supabase.from("shared_chats").select("id, is_public").eq("document_id", documentId).eq("user_id", user.id);
    if (sessionId) query = query.eq("chat_session_id", sessionId);
    else query = query.is("chat_session_id", null);

    const { data: existing } = await query.maybeSingle();

    if (existing) {
      return NextResponse.json({ shareId: existing.id, url: `${siteUrl}/share/${existing.id}`, isPublic: existing.is_public });
    }
    return NextResponse.json({});
  } catch (err) {
    return NextResponse.json({}, { status: 500 });
  }
}

/* POST /api/share — create a public share link */
export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { documentId, sessionId } = await request.json();
    if (!documentId) return NextResponse.json({ error: "documentId required" }, { status: 400 });

    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("id, file_name")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (docError || !doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://intellixy.vercel.app";

    // Check for existing share for same doc+session combo
    let query = supabase.from("shared_chats").select("id, is_public").eq("document_id", documentId).eq("user_id", user.id);
    if (sessionId) query = query.eq("chat_session_id", sessionId);
    else query = query.is("chat_session_id", null);
    const { data: existing } = await query.maybeSingle();

    if (existing) {
      return NextResponse.json({ shareId: existing.id, url: `${siteUrl}/share/${existing.id}`, isPublic: existing.is_public });
    }

    const insertData = { document_id: documentId, user_id: user.id, title: doc.file_name, is_public: true };
    if (sessionId) insertData.chat_session_id = sessionId;

    const { data: share, error: shareError } = await supabase
      .from("shared_chats")
      .insert(insertData)
      .select("id, is_public")
      .single();

    if (shareError) {
      console.error("[api/share] insert error:", shareError.message);
      return NextResponse.json({ error: "Failed to create share link" }, { status: 500 });
    }

    return NextResponse.json({ shareId: share.id, url: `${siteUrl}/share/${share.id}`, isPublic: share.is_public });
  } catch (err) {
    console.error("[api/share]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* PATCH /api/share { shareId, isPublic } — toggle visibility */
export async function PATCH(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { shareId, isPublic } = await request.json();
    if (!shareId || typeof isPublic !== "boolean") return NextResponse.json({ error: "shareId and isPublic required" }, { status: 400 });

    const { data, error } = await supabase
      .from("shared_chats")
      .update({ is_public: isPublic })
      .eq("id", shareId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* DELETE /api/share — revoke a share link */
export async function DELETE(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { shareId } = await request.json();
    if (!shareId) return NextResponse.json({ error: "shareId required" }, { status: 400 });

    const { error } = await supabase
      .from("shared_chats")
      .delete()
      .eq("id", shareId)
      .eq("user_id", user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
