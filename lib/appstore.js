/**
 * lib/appstore.js — App Store shared helpers
 */

/**
 * Log a user action against an app (install, view, run, favorite, unfavorite).
 * Non-blocking — errors are swallowed to never break the main flow.
 */
export async function logUsage(sb, userId, targetType, targetId, action) {
  try {
    await sb.from("app_usage_logs").insert({
      user_id:     userId,
      target_type: targetType,
      target_id:   targetId,
      action,
    });
  } catch {
    // non-fatal
  }
}

/**
 * Returns two Sets for the current user:
 *   installedKeys: Set<"agent:uuid" | "template:uuid">
 *   favKeys:       Set<"agent:uuid" | "template:uuid">
 */
export async function getUserContext(sb, userId) {
  const [
    { data: installedAgents },
    { data: installedTemplates },
    { data: favs },
  ] = await Promise.all([
    sb.from("agents").select("source_marketplace_agent_id")
      .eq("user_id", userId).not("source_marketplace_agent_id", "is", null),
    sb.from("workflows").select("source_marketplace_template_id")
      .eq("user_id", userId).not("source_marketplace_template_id", "is", null),
    sb.from("app_favorites").select("target_type,target_id").eq("user_id", userId),
  ]);

  const installedKeys = new Set([
    ...(installedAgents    ?? []).map((r) => `agent:${r.source_marketplace_agent_id}`),
    ...(installedTemplates ?? []).map((r) => `template:${r.source_marketplace_template_id}`),
  ]);
  const favKeys = new Set((favs ?? []).map((r) => `${r.target_type}:${r.target_id}`));

  return { installedKeys, favKeys };
}

/**
 * Annotate a list of app items with `installed` and `favorited` booleans.
 */
export function annotateItems(items, installedKeys, favKeys) {
  return items.map((item) => {
    const key = `${item.type}:${item.id}`;
    return {
      ...item,
      installed: installedKeys.has(key),
      favorited: favKeys.has(key),
    };
  });
}
