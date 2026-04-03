import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[/api/docs] DB error:", error.message);
      // Return empty array instead of 500 — table may not exist yet
      return NextResponse.json([]);
    }

    return NextResponse.json(data || []);
  } catch (err) {
    console.error("[/api/docs] Unhandled error:", err);
    return NextResponse.json([]);
  }
}
