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
      .limit(100);

    if (error) {
      // Table doesn't exist yet — return empty array gracefully
      console.warn("[messages] DB error:", error.message);
      return NextResponse.json([]);
    }

    return NextResponse.json(data || []);
  } catch (err) {
    console.error("[messages] Error:", err.message);
    return NextResponse.json([]);
  }
}
