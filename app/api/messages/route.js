import { NextResponse } from "next/server";
import supabase from "@/lib/supabase";

export async function POST(req) {
  const { documentId } = await req.json();

  const { data } = await supabase
    .from("messages")
    .select("*")
    .eq("document_id", documentId)
    .order("created_at", { ascending: true });

  return NextResponse.json(data);
}