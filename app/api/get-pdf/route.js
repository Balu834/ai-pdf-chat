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

    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("file_path")
      .eq("id", docId)
      .eq("user_id", user.id)
      .single();

    if (docError || !doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: file, error: storageError } = await supabase.storage
      .from("pdfs")
      .download(doc.file_path);

    if (storageError || !file) return NextResponse.json({ error: "File not found" }, { status: 404 });

    return new Response(file, { headers: { "Content-Type": "application/pdf" } });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
