import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";

export async function GET() {
  const results = {};

  // 1. Check env vars (values hidden, just presence)
  results.env = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
    STRIPE_PRO_PRICE_ID: !!process.env.STRIPE_PRO_PRICE_ID,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "(not set)",
  };

  // 2. Check Supabase auth
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    results.auth = error
      ? { ok: false, error: error.message }
      : { ok: true, user: user?.email || "not logged in" };
  } catch (e) {
    results.auth = { ok: false, error: e.message };
  }

  // 3. Check storage bucket
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.storage.getBucket("pdfs");
    results.storage_bucket = error
      ? { ok: false, error: error.message }
      : { ok: true, bucket: data.name, public: data.public };
  } catch (e) {
    results.storage_bucket = { ok: false, error: e.message };
  }

  // 4. Check documents table
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("documents").select("id").limit(1);
    results.documents_table = error
      ? { ok: false, error: error.message }
      : { ok: true };
  } catch (e) {
    results.documents_table = { ok: false, error: e.message };
  }

  // 5. Check question_usage table
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("question_usage").select("id").limit(1);
    results.question_usage_table = error
      ? { ok: false, error: error.message }
      : { ok: true };
  } catch (e) {
    results.question_usage_table = { ok: false, error: e.message };
  }

  // 6. Check user_plans table
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("user_plans").select("user_id").limit(1);
    results.user_plans_table = error
      ? { ok: false, error: error.message }
      : { ok: true };
  } catch (e) {
    results.user_plans_table = { ok: false, error: e.message };
  }

  return NextResponse.json(results, { status: 200 });
}
