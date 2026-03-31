import { NextResponse } from "next/server";
import supabase from "@/lib/supabase";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const fileName = `${Date.now()}-${file.name}`;

    // 📤 Upload to Supabase
    const { error } = await supabase.storage
      .from("pdfs")
      .upload(fileName, file);

    if (error) {
      console.error("UPLOAD ERROR:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 🌐 Get public URL
    const { data } = supabase.storage
      .from("pdfs")
      .getPublicUrl(fileName);

    const fileUrl = data.publicUrl;

    // 💾 Save to DB
    const { error: dbError } = await supabase.from("documents").insert([
      {
        name: file.name,
        file_url: fileUrl,
      },
    ]);

    if (dbError) {
      console.error("DB ERROR:", dbError);
    }

    return NextResponse.json({
      success: true,
      url: fileUrl,
    });
  } catch (err) {
    console.error("SERVER ERROR:", err);

    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}