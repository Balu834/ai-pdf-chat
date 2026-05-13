import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";

export async function GET(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const docId = searchParams.get("docId");
    if (!docId) return NextResponse.json({ error: "Missing docId" }, { status: 400 });

    // Verify ownership, then return the public URL stored at upload time
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("file_url")
      .eq("id", docId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (docError || !doc?.file_url) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Redirect to the Supabase Storage public URL — no need to proxy the bytes
    return NextResponse.redirect(doc.file_url);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
