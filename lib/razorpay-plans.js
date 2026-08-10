/**
 * lib/razorpay-plans.js
 *
 * Single source of truth for all Razorpay plan definitions.
 * Imported by create-subscription, verify-subscription, and the webhook
 * so they all agree on which plan_id maps to which tier and amount.
 */

export const PLANS = {
  pro: {
    envKey:      "RAZORPAY_PLAN_ID",
    name:        "Intellixy Pro",
    amount:      29900,   // ₹299 in paise
    currency:    "INR",
    description: "Unlimited PDFs + questions",
  },
  team: {
    envKey:      "RAZORPAY_TEAM_PLAN_ID",
    name:        "Intellixy Team",
    amount:      99900,   // ₹999 in paise
    currency:    "INR",
    description: "Team workspace + unlimited everything",
  },
};

/**
 * Given a Razorpay plan_id string, return the tier ("pro" | "team") it maps to.
 * Checks env vars at call time so values are always current.
 * Falls back to "pro" — existing Pro subscribers are never misclassified.
 */
export function resolveTierFromPlanId(planId) {
  if (!planId) return "pro";
  const teamPlanId = process.env.RAZORPAY_TEAM_PLAN_ID;
  if (teamPlanId && planId === teamPlanId) return "team";
  return "pro";
}
