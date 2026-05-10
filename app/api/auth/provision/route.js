/**
 * POST /api/auth/provision
 *
 * Ensures all required profile rows exist for the authenticated user.
 * Called from the dashboard on first load if profile data is missing.
 * Uses service-role client to bypass RLS.
 */
import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/admin-client";
import { createClient } from "@/lib/supabase-server-client";

export async function POST() {
  // Identify the calling user via their session cookie
  let user;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    user = data.user;
  } catch (err) {
    return NextResponse.json({ error: "Auth check failed" }, { status: 500 });
  }

  const uid  = user.id;
  const meta = user.user_metadata ?? {};

  let admin;
  try {
    admin = getAdminClient();
  } catch (err) {
    console.error("[provision] SUPABASE_SERVICE_ROLE_KEY missing:", err.message);
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  try {
    const results = await Promise.all([
      admin.from("profiles").upsert(
        {
          id:         uid,
          email:      user.email ?? meta.email ?? "",
          full_name:  meta.full_name ?? meta.name ?? (user.email ?? "").split("@")[0],
          avatar_url: meta.avatar_url ?? meta.picture ?? null,
        },
        { onConflict: "id", ignoreDuplicates: true }
      ),
      admin.from("user_plans").upsert(
        {
          user_id:             uid,
          plan:                "free",
          subscription_status: "inactive",
          is_trial:            false,
          updated_at:          new Date().toISOString(),
        },
        { onConflict: "user_id", ignoreDuplicates: true }
      ),
      admin.from("user_credits").upsert(
        {
          user_id:         uid,
          balance:         10,
          lifetime_earned: 10,
          lifetime_spent:  0,
          updated_at:      new Date().toISOString(),
        },
        { onConflict: "user_id", ignoreDuplicates: true }
      ),
      admin.from("user_stats").upsert(
        {
          user_id:         uid,
          total_questions: 0,
          total_pdfs:      0,
          updated_at:      new Date().toISOString(),
        },
        { onConflict: "user_id", ignoreDuplicates: true }
      ),
    ]);

    const errors = results.map((r) => r.error).filter(Boolean);
    if (errors.length > 0) {
      console.error("[provision] partial failure for user:", uid, errors.map((e) => e.message));
      return NextResponse.json(
        { ok: false, errors: errors.map((e) => e.message) },
        { status: 207 }
      );
    }

    console.log("[provision] OK for user:", uid);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[provision] threw for user:", uid, err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
