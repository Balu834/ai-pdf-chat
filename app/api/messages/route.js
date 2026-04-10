import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";

export async function GET(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json([], { status: 401 });

    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get("documentId");
    if (!documentId) return NextResponse.json([]);

    const { data, error } = await supabase
      .from("messages")
      .select("id, role, message, created_at")
      .eq("document_id", documentId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(200);

    if (error) {
      console.warn("[messages] DB error:", error.message);
      return NextResponse.json([]);
    }

    return NextResponse.json(data || []);
  } catch (err) {
    console.error("[messages] Error:", err.message);
    return NextResponse.json([]);
  }
}

export async function DELETE(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get("documentId");
    if (!documentId) return NextResponse.json({ error: "documentId required" }, { status: 400 });

    const { error } = await supabase
      .from("messages")
      .delete()
      .eq("document_id", documentId)
      .eq("user_id", user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[messages DELETE]", err.message);
    return NextResponse.json({ error: "Failed to clear chat" }, { status: 500 });
  }
}
