import { NextResponse } from "next/server";
import supabase from "@/lib/supabase"; // ✅ FIXED IMPORT

// ➕ SAVE CHAT
export async function POST(req) {
  try {
    const { question, answer } = await req.json();

    if (!question || !answer) {
      return NextResponse.json(
        { error: "Missing data" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("chat_history")
      .insert([{ question, answer }]);

    if (error) {
      console.error("Insert error:", error);
      return NextResponse.json(
        { error: "Insert failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });

  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}


// 📜 GET CHAT HISTORY
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("chat_history")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch error:", error);
      return NextResponse.json(
        { error: "Fetch failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });

  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}