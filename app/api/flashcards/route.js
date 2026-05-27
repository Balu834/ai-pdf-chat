import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";

// GET /api/flashcards?documentId=xxx  → cards for one doc
// GET /api/flashcards?due=true        → all due cards across all docs
// GET /api/flashcards?dueCount=true   → just the count (for dashboard widget)
export async function GET(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get("documentId");
    const due        = searchParams.get("due") === "true";
    const dueCount   = searchParams.get("dueCount") === "true";
    const now        = new Date().toISOString();

    if (dueCount) {
      const { count } = await supabase
        .from("flashcards")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .lte("next_review", now);
      return NextResponse.json({ count: count ?? 0 });
    }

    let query = supabase
      .from("flashcards")
      .select("id, front, back, next_review, interval_days, ease_factor, reps, doc_name, document_id, created_at")
      .eq("user_id", user.id);

    if (documentId) query = query.eq("document_id", documentId);
    if (due)        query = query.lte("next_review", now);

    query = query.order("next_review", { ascending: true });

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return NextResponse.json({ flashcards: data ?? [] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/flashcards?id=xxx
export async function DELETE(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const { error } = await supabase
      .from("flashcards")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
