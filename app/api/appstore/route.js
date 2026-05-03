/**
 * GET /api/appstore
 * Filtered, paginated browse of the unified app_store_view.
 *
 * Query params:
 *   q        — full-text / ILIKE search
 *   category — Productivity | Finance | Legal | Education | Other
 *   type     — agent | template | all (default all)
 *   price    — free | paid | all (default all)
 *   sort     — ranking | trending | rating | new (default ranking)
 *   page     — 0-based page number (default 0)
 *   limit    — items per page (default 24, max 48)
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";
import { admin, getUserContext, annotateItems } from "@/lib/appstore";

async function getUser() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

export async function GET(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q        = (searchParams.get("q") ?? "").trim().slice(0, 100);
  const category = searchParams.get("category") ?? "all";
  const type     = searchParams.get("type")     ?? "all";
  const price    = searchParams.get("price")    ?? "all";
  const sort     = searchParams.get("sort")     ?? "ranking";
  const page     = Math.max(0, parseInt(searchParams.get("page") ?? "0"));
  const limit    = Math.min(48, Math.max(1, parseInt(searchParams.get("limit") ?? "24")));
  const offset   = page * limit;

  const sb = admin();

  let query = sb.from("app_store_view").select("*", { count: "exact" });

  // Text search — weighted: name first (A), then description (B/C)
  if (q) {
    // Use FTS against search_vector OR fallback ILIKE
    const escaped = q.replace(/[%_]/g, "\\$&");
    query = query.or(
      `name.ilike.%${escaped}%,description.ilike.%${escaped}%`
    );
  }

  if (category !== "all")              query = query.eq("category", category);
  if (type !== "all")                  query = query.eq("type", type);
  if (price === "free")                query = query.eq("price_paise", 0);
  if (price === "paid")                query = query.gt("price_paise", 0);

  // Sorting
  const sortMap = {
    ranking:  [["ranking_score",        false], ["install_count", false]],
    trending: [["recent_installs_24h",  false], ["ranking_score", false]],
    rating:   [["avg_rating",           false], ["review_count",  false]],
    new:      [["created_at",           false]],
  };
  (sortMap[sort] ?? sortMap.ranking).forEach(([col, asc]) => {
    query = query.order(col, { ascending: asc });
  });

  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { installedKeys, favKeys } = await getUserContext(sb, user.id);
  const items = annotateItems(data ?? [], installedKeys, favKeys);

  return NextResponse.json({
    items,
    total: count ?? 0,
    page,
    limit,
    has_more: offset + items.length < (count ?? 0),
  });
}
