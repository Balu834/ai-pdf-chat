import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";
import { canDeletePdf } from "@/lib/limits";

export async function POST(req) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Pro-only action
    const allowed = await canDeletePdf(user.id);
    if (!allowed) {
      return NextResponse.json(
        { error: "Deleting PDFs is a Pro feature. Upgrade to remove files.", proRequired: true },
        { status: 403 }
      );
    }

    const { id, fileUrl } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    // Verify ownership before deleting
    const { data: doc, error: ownerErr } = await supabase
      .from("documents")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (ownerErr || !doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Delete from storage
    if (fileUrl) {
      try {
        const urlObj = new URL(fileUrl);
        const pathMatch = urlObj.pathname.match(/\/object\/(?:public|sign)\/pdfs\/(.+)$/);
        if (pathMatch) {
          const storagePath = decodeURIComponent(pathMatch[1]).split("?")[0];
          const { error: storageError } = await supabase.storage.from("pdfs").remove([storagePath]);
          if (storageError) console.warn("[delete] Storage remove error:", storageError.message);
        }
      } catch (e) {
        console.warn("[delete] Storage delete threw:", e.message);
      }
    }

    // Delete from DB
    const { error: dbError } = await supabase
      .from("documents")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[delete] Error:", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
