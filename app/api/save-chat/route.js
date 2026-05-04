import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";

export async function POST(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { question, answer } = await req.json();
    if (!question || !answer) return NextResponse.json({ error: "Missing data" }, { status: 400 });

    const { data, error } = await supabase
      .from("chats")
      .insert([{ question, answer, user_id: user.id }]);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
