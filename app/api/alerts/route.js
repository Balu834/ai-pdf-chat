import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";

// GET /api/alerts  — fetch latest 20 alerts for the current user
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json([], { status: 401 });

    const { data } = await supabase
      .from("alerts")
      .select("id, message, type, read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json([]);
  }
}

// PATCH /api/alerts  — mark all unread alerts as read
export async function PATCH() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await supabase
      .from("alerts")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
