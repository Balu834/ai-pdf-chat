import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const fileUrl = searchParams.get("fileUrl");
    if (!fileUrl) return NextResponse.json({ error: "Missing fileUrl" }, { status: 400 });

    // Verify ownership
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("id, file_name")
      .eq("file_url", fileUrl)
      .eq("user_id", user.id)
      .maybeSingle();

    if (docError || !doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Extract bucket + object path from the Supabase storage URL.
    // Public URL format:  https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
    // Signed URL format:  https://<project>.supabase.co/storage/v1/object/sign/<bucket>/<path>
    let signedUrl = fileUrl; // safe fallback (works if bucket is public)
    try {
      const parsed = new URL(fileUrl);
      const m = parsed.pathname.match(
        /\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/(.+)/
      );
      if (m) {
        const bucket = m[1];
        // Strip any existing query string from the path
        const filePath = decodeURIComponent(m[2].split("?")[0]);
        const { data: signed, error: signError } = await supabase.storage
          .from(bucket)
          .createSignedUrl(filePath, 3600); // 1-hour URL
        if (!signError && signed?.signedUrl) {
          signedUrl = signed.signedUrl;
        }
      }
    } catch {
      // URL parse failed — fall back to original
    }

    return NextResponse.json({
      signedUrl,
      fileName: doc.file_name,
      docId: doc.id,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
