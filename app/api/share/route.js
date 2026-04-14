import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";

// POST /api/share — create a public share link for a document's chat
export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { documentId } = await request.json();
    if (!documentId) return NextResponse.json({ error: "documentId required" }, { status: 400 });

    // Verify the document belongs to this user
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("id, file_name")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (docError || !doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Check if a share link already exists for this document
    const { data: existing } = await supabase
      .from("shared_chats")
      .select("id")
      .eq("document_id", documentId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://intellixy.vercel.app";
      return NextResponse.json({ shareId: existing.id, url: `${siteUrl}/share/${existing.id}` });
    }

    // Create new share entry
    const { data: share, error: shareError } = await supabase
      .from("shared_chats")
      .insert({ document_id: documentId, user_id: user.id, title: doc.file_name, is_public: true })
      .select("id")
      .single();

    if (shareError) {
      console.error("[api/share] insert error:", shareError.message);
      return NextResponse.json({ error: "Failed to create share link" }, { status: 500 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://intellixy.vercel.app";
    return NextResponse.json({ shareId: share.id, url: `${siteUrl}/share/${share.id}` });
  } catch (err) {
    console.error("[api/share]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/share — revoke a share link
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
