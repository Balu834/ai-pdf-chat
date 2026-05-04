import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";

export async function GET(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get("documentId");
    if (!documentId) return NextResponse.json({ error: "Missing documentId" }, { status: 400 });

    const { data, error } = await supabase
      .from("chunks")
      .select("content")
      .eq("document_id", documentId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const text = (data ?? []).map((c) => c.content).join("\n");
    return NextResponse.json({ text });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
