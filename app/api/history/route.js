import { NextResponse } from "next/server";
import supabase from "@/lib/supabase";

export async function POST(req) {
  try {
    const { documentId } = await req.json();

    if (!documentId) {
      return NextResponse.json(
        { error: "Missing documentId" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("chats")
      .select("*")
      .eq("document_id", documentId)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });

  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}