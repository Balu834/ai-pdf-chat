/**
 * GET /api/meta-ads/insights?range=last_7d
 *
 * Returns campaign insights for the authenticated user's connected Meta Ads account.
 * Reads the stored access token from the `integrations` table.
 *
 * Query params:
 *   range — today | yesterday | last_7d (default) | last_30d
 *   level — campaign (default) | adset | ad
 *
 * Requires: logged-in Supabase session (reads user from cookie).
 */

import { NextResponse }         from "next/server";
import { createClient }         from "@/lib/supabase-server-client";
import { getAdminClient }       from "@/lib/admin-client";
import {
  fetchAccountInsights,
  evaluateAlerts,
  exchangeForLongLivedToken,
  type AccountInsightsResult,
} from "@/lib/meta-ads/insights";

const VALID_RANGES = new Set(["today", "yesterday", "last_7d", "last_30d"]);
const VALID_LEVELS = new Set(["campaign", "adset", "ad"]);

export async function GET(request: Request): Promise<Response> {
  // 1. Auth — require logged-in user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url   = new URL(request.url);
  const range = url.searchParams.get("range") ?? "last_7d";
  const level = url.searchParams.get("level") ?? "campaign";

  if (!VALID_RANGES.has(range)) {
    return NextResponse.json({ error: "Invalid range" }, { status: 400 });
  }
  if (!VALID_LEVELS.has(level)) {
    return NextResponse.json({ error: "Invalid level" }, { status: 400 });
  }

  // 2. Load Meta integration for this user
  const { data: integration, error: intErr } = await getAdminClient()
    .from("integrations")
    .select("access_token, meta, updated_at")
    .eq("user_id", user.id)
    .eq("provider", "meta_ads")
    .maybeSingle();

  if (intErr) {
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
  if (!integration?.access_token) {
    return NextResponse.json(
      { error: "Meta Ads not connected. Go to Settings → Integrations to connect." },
      { status: 404 }
    );
  }

  // 3. Extract ad account IDs from stored meta
  const meta       = integration.meta as { ad_accounts?: { id: string; name: string }[] } | null;
  const adAccounts = meta?.ad_accounts ?? [];

  if (!adAccounts.length) {
    return NextResponse.json(
      { error: "No ad accounts found in connected Meta profile." },
      { status: 404 }
    );
  }

  let accessToken = integration.access_token as string;

  // 4. Attempt token refresh if integration is older than 50 days
  const updatedAt    = new Date(integration.updated_at as string);
  const daysSinceAuth = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceAuth > 50) {
    const longLived = await exchangeForLongLivedToken(accessToken);
    if (longLived) {
      accessToken = longLived;
      // Persist refreshed token
      await getAdminClient()
        .from("integrations")
        .update({ access_token: longLived, updated_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("provider", "meta_ads");
    }
  }

  // 5. Fetch insights for all ad accounts in parallel
  const results: (AccountInsightsResult & { accountName: string })[] = [];
  const errors: string[] = [];

  await Promise.allSettled(
    adAccounts.map(async (account) => {
      try {
        const data = await fetchAccountInsights(account.id, accessToken, {
          dateRange: range as "today" | "yesterday" | "last_7d" | "last_30d",
          level:     level as "campaign" | "adset" | "ad",
        });
        results.push({ ...data, accountName: account.name });
      } catch (err) {
        errors.push(`${account.name}: ${err instanceof Error ? err.message : String(err)}`);
      }
    })
  );

  // 6. Evaluate alerts for each account
  const allAlerts = results.flatMap((r) => evaluateAlerts(r));

  return NextResponse.json({
    ok:       true,
    range,
    accounts: results,
    alerts:   allAlerts,
    errors:   errors.length ? errors : undefined,
  });
}
