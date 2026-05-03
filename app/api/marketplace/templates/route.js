import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createSessionClient } from "@/lib/supabase-server-client";

const admin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

async function getUserId() {
  const sb = await createSessionClient();
  const { data: { user } } = await sb.auth.getUser();
  return user?.id ?? null;
}

export async function GET(req) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search   = searchParams.get("search")   ?? "";
  const category = searchParams.get("category") ?? "all";
  const price    = searchParams.get("price")    ?? "all";   // all | free | paid
  const sort     = searchParams.get("sort")      ?? "popular";

  const sb = admin();
  let q = sb
    .from("marketplace_templates")
    .select(`
      id, name, description, category, template_type, steps,
      price_paise, install_count, avg_rating, review_count, created_at, creator_id,
      creator_profiles!marketplace_templates_creator_id_fkey(display_name)
    `)
    .eq("is_published", true);

  if (category !== "all") q = q.eq("category", category);
  if (price === "free")   q = q.eq("price_paise", 0);
  if (price === "paid")   q = q.gt("price_paise", 0);
  if (search)             q = q.or(`name.ilike.%${search}%,description.ilike.%${search}%`);

  const orderCol = sort === "rating" ? "avg_rating" : sort === "new" ? "created_at" : "install_count";
  q = q.order(orderCol, { ascending: false }).limit(100);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Check which ones the user already installed or purchased
  const [{ data: installed }, { data: purchased }] = await Promise.all([
    sb.from("workflows")
      .select("source_marketplace_template_id")
      .eq("user_id", userId)
      .not("source_marketplace_template_id", "is", null),
    sb.from("template_purchases")
      .select("template_id")
      .eq("user_id", userId)
      .eq("status", "completed"),
  ]);

  const installedSet  = new Set((installed  ?? []).map((r) => r.source_marketplace_template_id));
  const purchasedSet  = new Set((purchased  ?? []).map((r) => r.template_id));

  const templates = (data ?? []).map((t) => ({
    ...t,
    creator_name: t.creator_profiles?.display_name || "Creator",
    creator_profiles: undefined,
    installed: installedSet.has(t.id),
    purchased: t.price_paise === 0 || purchasedSet.has(t.id),
    step_count: Array.isArray(t.steps) ? t.steps.length : 0,
    steps: undefined, // don't send full steps in list view
  }));

  return NextResponse.json({ templates });
}
