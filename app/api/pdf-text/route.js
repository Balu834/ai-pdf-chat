import { NextResponse } from "next/server";
import supabase from "@/lib/supabase";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const documentId = searchParams.get("documentId");

  const { data } = await supabase
    .from("chunks")
    .select("content")
    .eq("document_id", documentId);

  const text = data.map((c) => c.content).join("\n");

  return NextResponse.json({ text });
}