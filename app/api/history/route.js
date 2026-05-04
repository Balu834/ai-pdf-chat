import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";

export async function POST(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { documentId } = await req.json();
    if (!documentId) return NextResponse.json({ error: "Missing documentId" }, { status: 400 });

    const { data, error } = await supabase
      .from("chats")
      .select("*")
      .eq("document_id", documentId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
