/**
 * lib/cooldown.ts
 *
 * Prevents sending the same notification type to the same user
 * more than once within a cooldown window.
 *
 * Uses the notification_log table as the source of truth —
 * no in-memory state, works across serverless invocations.
 */

import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type Channel   = "email" | "whatsapp" | "push";
export type EventType =
  | "welcome"
  | "onboarding_reminder"
  | "activation_nudge"
  | "inactive_reminder"
  | "limit_reached"
  | "payment_success"
  | "followup_48h"
  | "expiry_warning";

/** Default cooldown windows per event type (in hours). */
const COOLDOWN_HOURS: Record<EventType, number> = {
  welcome:              0,    // send once only — enforced by "sent ever" check
  onboarding_reminder:  24,
  activation_nudge:     24,
  inactive_reminder:    24,
  limit_reached:        12,
  payment_success:      0,    // always send
  followup_48h:         72,
  expiry_warning:       48,
};

/**
 * Returns true if the message is within cooldown (should NOT be sent).
 * Returns false if it's safe to send.
 */
export async function isOnCooldown(
  userId:    string,
  channel:   Channel,
  eventType: EventType
): Promise<boolean> {
  const hours = COOLDOWN_HOURS[eventType];

  // 0 = send every time (payment_success) except "welcome" which uses sent-ever logic
  if (eventType === "welcome") {
    const { count } = await admin
      .from("notification_log")
      .select("id", { count: "exact", head: true })
      .eq("user_id",    userId)
      .eq("channel",    channel)
      .eq("event_type", eventType);
    return (count ?? 0) > 0;   // true = already sent once, skip
  }

  if (hours === 0) return false;

  const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();
  const { count } = await admin
    .from("notification_log")
    .select("id", { count: "exact", head: true })
    .eq("user_id",    userId)
    .eq("channel",    channel)
    .eq("event_type", eventType)
    .gte("sent_at",   since);

  return (count ?? 0) > 0;
}

/** Record a sent notification so future cooldown checks work. */
export async function recordSent(
  userId:    string,
  channel:   Channel,
  eventType: EventType,
  meta?:     Record<string, unknown>
): Promise<void> {
  const { error } = await admin.from("notification_log").insert({
    user_id:    userId,
    channel,
    event_type: eventType,
    meta:       meta ?? null,
  });
  if (error) console.warn("[cooldown] recordSent failed:", error.message);
}

/**
 * Convenience: check cooldown, call sender, then record.
 * Returns true if the message was sent.
 */
export async function sendIfNotOnCooldown(
  userId:    string,
  channel:   Channel,
  eventType: EventType,
  sender:    () => Promise<void>,
  meta?:     Record<string, unknown>
): Promise<boolean> {
  if (await isOnCooldown(userId, channel, eventType)) return false;
  await sender();
  await recordSent(userId, channel, eventType, meta);
  return true;
}
