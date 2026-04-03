import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";

export async function POST(req) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, fileUrl } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    // Delete from storage
    if (fileUrl) {
      const fileName = fileUrl.split("/").pop();
      const { error: storageError } = await supabase.storage
        .from("pdfs")
        .remove([fileName]);
      if (storageError) console.error("Storage delete error:", storageError);
    }

    // Delete from DB — scoped to this user
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
    console.error("DELETE ERROR:", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
