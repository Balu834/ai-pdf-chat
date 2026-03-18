import { NextResponse } from "next/server";
import supabase from "@/lib/supabase"; // ✅ CORRECT (NO {})

export async function POST(req) {
  try {
    const { question, answer } = await req.json();

    const { error } = await supabase
      .from("chat_history")
      .insert([{ question, answer }]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("chat_history")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });

  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}