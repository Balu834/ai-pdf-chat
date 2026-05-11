/**
 * scripts/test-signup.mjs
 *
 * Smoke-tests the full signup → profile provisioning flow against production
 * (or any Supabase project) using real credentials.
 *
 * Usage:
 *   node scripts/test-signup.mjs
 *
 * Required env vars (can use a .env.local file or pass inline):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * What it tests:
 *   1. Creates a throwaway user via supabase.auth.signUp()
 *   2. Waits up to 5 s for the on_auth_user_created trigger to fire
 *   3. Asserts that profiles, user_plans, user_credits, user_stats rows exist
 *   4. Cleans up by deleting the user via the admin API
 *   5. Exits 0 on pass, 1 on fail (safe to run in CI)
 *
 * Notes:
 *   - Uses a @test.intellixy.com address — add that domain to Supabase
 *     Auth → Providers → Email → Allow list if you restrict signups.
 *   - Email confirmation must be OFF (Auth → Providers → Email → Confirm email)
 *     OR the test email must be in your allowlist for instant confirmation.
 *   - The service role key is used only server-side for cleanup and assertions.
 */

import { createClient } from "@supabase/supabase-js";

// ── Config ────────────────────────────────────────────────────────────────────

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY         = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE_KEY) {
  console.error(
    "❌  Missing env vars. Set NEXT_PUBLIC_SUPABASE_URL, " +
    "NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

const testEmail    = `smoke-test-${Date.now()}@test.intellixy.com`;
const testPassword = "SmokeTest!2025";

// Anon client — simulates what the browser does on signup
const anonClient  = createClient(SUPABASE_URL, ANON_KEY);
// Admin client — bypasses RLS for assertions and cleanup
const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function pass(msg) { console.log(`  ✅  ${msg}`); }
function fail(msg) { console.error(`  ❌  ${msg}`); }

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForRow(table, column, value, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const { data } = await adminClient
      .from(table)
      .select("*")
      .eq(column, value)
      .maybeSingle();
    if (data) return data;
    await sleep(500);
  }
  return null;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  let userId = null;
  let passed = 0;
  let failed = 0;

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Intellixy — auth smoke test");
  console.log(`  Supabase: ${SUPABASE_URL}`);
  console.log(`  Test user: ${testEmail}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // ── 1. Sign up ──────────────────────────────────────────────────────────────
  console.log("1. Signing up test user …");
  const { data: signupData, error: signupError } = await anonClient.auth.signUp({
    email:    testEmail,
    password: testPassword,
  });

  if (signupError) {
    fail(`signUp() failed: ${signupError.message}`);
    console.error("\n  → This is the 'Database error saving new user' root cause.");
    console.error("  → Run FIX-THIS-IN-SUPABASE.sql in Supabase SQL Editor and retry.\n");
    process.exit(1);
  }

  userId = signupData.user?.id;
  if (!userId) {
    fail("signUp() returned no user ID — email confirmation may be required");
    console.error("  → Disable 'Confirm email' in Supabase Auth → Providers → Email");
    process.exit(1);
  }
  pass(`auth.users row created — id: ${userId}`);
  passed++;

  // ── 2. Wait for trigger to provision rows (up to 5 s) ─────────────────────
  console.log("\n2. Waiting for on_auth_user_created trigger …");

  const profile = await waitForRow("profiles", "id", userId);
  if (profile) {
    pass(`profiles row exists — email: ${profile.email}, name: ${profile.full_name}`);
    passed++;
  } else {
    fail("profiles row NOT created within 5 s — trigger is broken or missing");
    failed++;
  }

  const plan = await waitForRow("user_plans", "user_id", userId);
  if (plan) {
    pass(`user_plans row exists — plan: ${plan.plan}, status: ${plan.subscription_status}`);
    passed++;
  } else {
    fail("user_plans row NOT created — trigger not inserting into user_plans");
    failed++;
  }

  const credits = await waitForRow("user_credits", "user_id", userId);
  if (credits) {
    pass(`user_credits row exists — balance: ${credits.balance}`);
    passed++;
  } else {
    fail("user_credits row NOT created — trigger not inserting into user_credits");
    failed++;
  }

  const stats = await waitForRow("user_stats", "user_id", userId);
  if (stats) {
    pass(`user_stats row exists — questions: ${stats.total_questions}`);
    passed++;
  } else {
    fail("user_stats row NOT created — trigger not inserting into user_stats");
    failed++;
  }

  // ── 3. Verify provision endpoint ───────────────────────────────────────────
  console.log("\n3. Testing /api/auth/provision endpoint …");
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://intellixy.vercel.app";
    const res = await fetch(`${appUrl}/api/auth/provision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    // Expect 401 (no session cookie) — proves the route is reachable
    if (res.status === 401) {
      pass("/api/auth/provision reachable — returned 401 (no session, expected)");
      passed++;
    } else if (res.status === 200) {
      pass("/api/auth/provision returned 200");
      passed++;
    } else {
      fail(`/api/auth/provision returned unexpected status ${res.status}`);
      failed++;
    }
  } catch (e) {
    fail(`/api/auth/provision fetch failed: ${e.message}`);
    failed++;
  }

  // ── 4. Cleanup ─────────────────────────────────────────────────────────────
  console.log("\n4. Cleaning up test user …");
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
  if (deleteError) {
    console.warn(`  ⚠️  Cleanup failed (manual delete needed): ${deleteError.message}`);
    console.warn(`     Supabase → Auth → Users → delete ${testEmail}`);
  } else {
    pass("test user deleted");
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Result: ${passed} passed, ${failed} failed`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  if (failed > 0) {
    console.error(
      "FAILED — re-run FIX-THIS-IN-SUPABASE.sql in Supabase SQL Editor\n" +
      "then run this script again.\n"
    );
    process.exit(1);
  }

  console.log("PASSED — auth system is healthy.\n");
  process.exit(0);
}

run().catch((e) => {
  console.error("Unexpected error:", e);
  process.exit(1);
});
