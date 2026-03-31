import { NextResponse } from "next/server";
import supabase from "@/lib/supabase";

export async function POST(req) {
  try {
    const body = await req.json();

    const { question, answer } = body;

    console.log("Saving:", question, answer); // ✅ DEBUG

    if (!question || !answer) {
      return NextResponse.json(
        { error: "Missing data" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("chats")
      .insert([{ question, answer }]);

    if (error) {
      console.error("SUPABASE ERROR:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });

  } catch (err) {
    console.error("SAVE CHAT ERROR:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}