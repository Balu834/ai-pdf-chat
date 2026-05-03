import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createSessionClient } from "@/lib/supabase-server-client";

const admin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

async function getUser() {
  const sb = await createSessionClient();
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

// GET — creator dashboard stats + profile
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sb = admin();

  const [
    { data: profile },
    { data: myAgents },
    { data: myTemplates },
    { data: recentPurchases },
  ] = await Promise.all([
    sb.from("creator_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    sb.from("marketplace_agents").select("id, name, category, install_count, avg_rating, review_count, is_published, created_at")
      .eq("creator_id", user.id).order("created_at", { ascending: false }),
    sb.from("marketplace_templates").select("id, name, category, price_paise, install_count, avg_rating, review_count, is_published, created_at")
      .eq("creator_id", user.id).order("created_at", { ascending: false }),
    sb.from("template_purchases")
      .select("id, template_id, amount_paise, creator_paise, created_at, marketplace_templates(name)")
      .in("template_id", [])  // placeholder; replaced below
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const templateIds = (myTemplates ?? []).map((t) => t.id);
  let purchases = [];
  if (templateIds.length > 0) {
    const { data } = await sb
      .from("template_purchases")
      .select("id, template_id, amount_paise, creator_paise, created_at, marketplace_templates!inner(name)")
      .in("template_id", templateIds)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(10);
    purchases = data ?? [];
  }

  const totalInstalls = [
    ...(myAgents    ?? []).map((a) => a.install_count),
    ...(myTemplates ?? []).map((t) => t.install_count),
  ].reduce((s, n) => s + n, 0);

  return NextResponse.json({
    profile,
    stats: {
      published_agents:    (myAgents    ?? []).filter((a) => a.is_published).length,
      published_templates: (myTemplates ?? []).filter((t) => t.is_published).length,
      total_installs:      totalInstalls,
      total_earnings_paise: profile?.total_earnings_paise ?? 0,
      pending_payout_paise: profile?.pending_payout_paise ?? 0,
    },
    agents:    myAgents    ?? [],
    templates: myTemplates ?? [],
    recent_purchases: purchases,
  });
}

// POST — create or update creator profile
export async function POST(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { display_name, bio } = await req.json();
  if (!display_name?.trim())
    return NextResponse.json({ error: "display_name is required" }, { status: 400 });

  const { data, error } = await admin()
    .from("creator_profiles")
    .upsert({
      user_id: user.id,
      display_name: display_name.trim(),
      bio: bio?.trim() ?? "",
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data });
}
