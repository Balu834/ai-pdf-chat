import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";
import { getAdminClient } from "@/lib/admin-client";

// ── Columns that map to individual term flags ───────────────────────────────
const TERM_KEYS = [
  "terms_of_service",
  "privacy_policy",
  "ai_processing_consent",
  "content_policy",
];

/* ─── GET /api/user/terms ────────────────────────────────────────────────────
   Returns the current acceptance state for the authenticated user.
   Creates a default row if none exists (so callers always get a full object).
────────────────────────────────────────────────────────────────────────────── */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await getAdminClient()
      .from("user_terms")
      .select("terms_of_service, privacy_policy, ai_processing_consent, content_policy, all_accepted_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("[terms/GET] DB error:", error.message);
      return NextResponse.json({ error: "Failed to fetch terms status" }, { status: 500 });
    }

    // No row yet — return all-false defaults without inserting
    if (!data) {
      return NextResponse.json({
        terms_of_service:      false,
        privacy_policy:        false,
        ai_processing_consent: false,
        content_policy:        false,
        all_accepted:          false,
        all_accepted_at:       null,
      });
    }

    const allAccepted = TERM_KEYS.every((k) => data[k] === true);
    return NextResponse.json({ ...data, all_accepted: allAccepted });

  } catch (err) {
    console.error("[terms/GET] Unexpected:", err?.message ?? err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ─── POST /api/user/terms ───────────────────────────────────────────────────
   Accepts a partial update: { terms_of_service: true } etc.
   - Only allows setting flags to TRUE (acceptance is permanent).
   - Automatically sets all_accepted_at when every flag becomes true.
   - Returns { ok: true, all_accepted: boolean }.
────────────────────────────────────────────────────────────────────────────── */
export async function POST(req) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try { body = await req.json(); }
    catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

    // Build update payload — only permit known keys being set to true
    const updates = {};
    for (const key of TERM_KEYS) {
      if (body[key] === true) updates[key] = true;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    // Read existing row to compute whether all flags will be set after this update
    const { data: existing, error: readErr } = await getAdminClient()
      .from("user_terms")
      .select(TERM_KEYS.join(", "))
      .eq("user_id", user.id)
      .maybeSingle();

    if (readErr) {
      console.error("[terms/POST] Read error:", readErr.message);
      return NextResponse.json({ error: "Failed to read existing terms" }, { status: 500 });
    }

    const merged = { ...(existing ?? {}), ...updates };
    const allNowAccepted = TERM_KEYS.every((k) => merged[k] === true);
    if (allNowAccepted && !existing?.all_accepted_at) {
      updates.all_accepted_at = new Date().toISOString();
    }

    const { error: upsertErr } = await getAdminClient()
      .from("user_terms")
      .upsert(
        { user_id: user.id, ...updates },
        { onConflict: "user_id", ignoreDuplicates: false }
      );

    if (upsertErr) {
      console.error("[terms/POST] Upsert error:", upsertErr.message);
      return NextResponse.json({ error: "Failed to save acceptance" }, { status: 500 });
    }

    console.log(`[terms] user=${user.id} updated=${JSON.stringify(updates)} all=${allNowAccepted}`);
    return NextResponse.json({ ok: true, all_accepted: allNowAccepted });

  } catch (err) {
    console.error("[terms/POST] Unexpected:", err?.message ?? err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
