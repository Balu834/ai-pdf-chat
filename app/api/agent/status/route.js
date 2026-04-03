import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json(null, { status: 401 });

    // Return the most recent job (any status)
    const { data: job } = await supabase
      .from("ai_jobs")
      .select("id, status, doc_count, result, error, created_at, completed_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json(job || null);
  } catch {
    return NextResponse.json(null);
  }
}
