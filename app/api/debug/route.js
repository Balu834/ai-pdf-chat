import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function GET() {
  const results = {};

  // 1. Env vars (presence only — never log values)
  results.env = {
    NEXT_PUBLIC_SUPABASE_URL:      !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY:     !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    OPENAI_API_KEY:                !!process.env.OPENAI_API_KEY,
    NEXT_PUBLIC_APP_URL:           process.env.NEXT_PUBLIC_APP_URL || "(not set)",
  };

  // 2. Auth — same client as upload route
  let userId = null;
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    userId = user?.id ?? null;
    results.auth = error
      ? { ok: false, error: error.message }
      : { ok: !!user, user_id: user?.id ?? null, email: user?.email ?? "not logged in" };
  } catch (e) {
    results.auth = { ok: false, error: e.message };
  }

  // 3. Subscription row (service-role bypasses RLS)
  if (userId && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      const { data, error } = await admin
        .from("user_plans")
        .select("plan, subscription_status, pro_expires_at, grace_until")
        .eq("user_id", userId)
        .maybeSingle();
      results.subscription = error
        ? { ok: false, error: error.message }
        : { ok: true, row: data ?? "NO ROW — will be auto-provisioned as free" };
    } catch (e) {
      results.subscription = { ok: false, error: e.message };
    }
  } else {
    results.subscription = { ok: false, reason: "skipped — no user or missing service role key" };
  }

  // 4. Usage stats
  if (userId && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      const { data, error } = await admin
        .from("user_stats")
        .select("total_pdfs, total_questions")
        .eq("user_id", userId)
        .maybeSingle();
      results.usage = error
        ? { ok: false, error: error.message }
        : { ok: true, stats: data ?? { total_pdfs: 0, total_questions: 0 } };
    } catch (e) {
      results.usage = { ok: false, error: e.message };
    }
  }

  // 5. Storage bucket
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.storage.getBucket("pdfs");
    results.storage_bucket = error
      ? { ok: false, error: error.message }
      : { ok: true, bucket: data.name, public: data.public };
  } catch (e) {
    results.storage_bucket = { ok: false, error: e.message };
  }

  // 6. Tables accessible
  try {
    const supabase = await createClient();
    const [docs, plans] = await Promise.all([
      supabase.from("documents").select("id").limit(1),
      supabase.from("user_plans").select("user_id").limit(1),
    ]);
    results.tables = {
      documents:  docs.error  ? { ok: false, error: docs.error.message  } : { ok: true },
      user_plans: plans.error ? { ok: false, error: plans.error.message } : { ok: true },
    };
  } catch (e) {
    results.tables = { ok: false, error: e.message };
  }

  return NextResponse.json(results, { status: 200 });
}
