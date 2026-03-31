import { NextResponse } from "next/server";
import supabase from "@/lib/supabase";

export async function POST(req) {
  try {
    const { id, fileUrl } = await req.json();

    console.log("DELETE REQUEST:", { id, fileUrl });

    if (!id || !fileUrl) {
      return NextResponse.json(
        { error: "Missing id or fileUrl" },
        { status: 400 }
      );
    }

    // extract filename
    const fileName = fileUrl.split("/").pop();

    // 🗑 delete from storage
    const { error: storageError } = await supabase.storage
      .from("pdfs")
      .remove([fileName]);

    if (storageError) {
      console.error("Storage delete error:", storageError);
    }

    // 🗑 delete from DB
    const { error: dbError } = await supabase
      .from("documents")
      .delete()
      .eq("id", id);

    if (dbError) {
      console.error("DB delete error:", dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}