"use client";

import { motion } from "framer-motion";
import { C } from "./tokens";
import { CrownIcon, ShieldIcon } from "./icons";

export default function BillingView({ plan, proExpiresAt, graceUntil, isTrial, trialEnd, subscriptionCancelled, subscriptionSource, onUpgradeClick, onCancelSubscription, cancellingSubscription, onManageSubscription, upgradingStripe, user }) {
  const isPro = plan === "pro";
  const daysLeft = isTrial && trialEnd ? Math.max(0, Math.ceil((new Date(trialEnd) - Date.now()) / 86400000)) : null;
  const inGrace = graceUntil && new Date(graceUntil) > new Date();
  const graceDaysLeft = inGrace ? Math.max(1, Math.ceil((new Date(graceUntil) - Date.now()) / 86400000)) : null;

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "28px 28px 40px", maxWidth: 680 }}>
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Account</p>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: C.textPrimary, margin: 0, letterSpacing: "-0.5px" }}>Billing & Plan</h1>
      </div>

      {/* Grace period warning */}
      {inGrace && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.28)", borderRadius: 14, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#fbbf24", margin: "0 0 2px" }}>Payment failed — grace period active</p>
            <p style={{ fontSize: 12, color: "rgba(251,191,36,0.7)", margin: 0 }}>
              Your Pro access continues for {graceDaysLeft} more day{graceDaysLeft !== 1 ? "s" : ""}. Update your payment method to keep access.
            </p>
          </div>
        </motion.div>
      )}

      {/* Current plan card */}
      <motion.div
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: isPro ? "linear-gradient(135deg,rgba(124,58,237,0.12),rgba(6,182,212,0.07))" : C.glass, border: `1px solid ${isPro ? (inGrace ? "rgba(245,158,11,0.35)" : "rgba(124,58,237,0.28)") : C.glassBorder}`, borderRadius: 20, padding: "22px 22px", marginBottom: 16 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: isPro ? "linear-gradient(135deg,#7c3aed,#06b6d4)" : "rgba(255,255,255,0.05)", border: isPro ? "none" : `1px solid ${C.glassBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
            {isPro ? "👑" : "🔓"}
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 800, color: C.textPrimary, margin: "0 0 3px" }}>
              {isPro ? (isTrial ? "Pro Trial" : "Pro Plan") : "Free Plan"}
            </p>
            <p style={{ fontSize: 12, color: C.textMuted, margin: 0 }}>
              {isPro
                ? (isTrial
                    ? `Trial ends ${new Date(trialEnd).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`
                    : proExpiresAt
                      ? (subscriptionCancelled
                          ? `Access until ${new Date(proExpiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`
                          : `Renews ${new Date(proExpiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`)
                      : "Active — no expiry")
                : "Limited to 5 PDFs and 10 questions"}
            </p>
          </div>
          {isPro && !subscriptionCancelled && !inGrace && (
            <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, color: "#4ade80", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.22)", padding: "4px 10px", borderRadius: 99 }}>Active</span>
          )}
          {isPro && inGrace && (
            <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, color: "#fbbf24", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.28)", padding: "4px 10px", borderRadius: 99 }}>Grace Period</span>
          )}
          {subscriptionCancelled && (
            <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, color: "#f87171", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.22)", padding: "4px 10px", borderRadius: 99 }}>Cancelled</span>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          {[
            { label: "PDF Uploads", value: isPro ? "Unlimited" : "5 lifetime" },
            { label: "AI Questions", value: isPro ? "Unlimited" : "10 lifetime" },
            { label: "PDF Compare", value: isPro ? "✓ Included" : "✗ Pro only" },
            { label: "AI Insights", value: isPro ? "✓ Included" : "✗ Pro only" },
            { label: "Delete PDFs", value: isPro ? "✓ Included" : "✗ Pro only" },
            { label: "Share Chats", value: isPro ? "✓ Included" : "✗ Pro only" },
          ].map(({ label, value }) => (
            <div key={label} style={{ padding: "10px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10 }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
              <p style={{ fontSize: 12, fontWeight: 700, color: value.startsWith("✓") ? C.green : value.startsWith("✗") ? "rgba(248,113,113,0.7)" : C.textPrimary, margin: 0 }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        {!isPro ? (
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={onUpgradeClick}
            style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg,#7c3aed,#06b6d4)", color: "white", fontSize: 13, fontWeight: 700, border: "none", borderRadius: 12, cursor: "pointer", boxShadow: "0 6px 24px rgba(124,58,237,0.4)" }}>
            Upgrade to Pro — ₹299/mo →
          </motion.button>
        ) : subscriptionSource === "razorpay" && !subscriptionCancelled ? (
          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={onCancelSubscription} disabled={cancellingSubscription}
            style={{ padding: "10px 18px", background: "transparent", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, fontSize: 12, fontWeight: 600, color: "#f87171", cursor: cancellingSubscription ? "not-allowed" : "pointer", opacity: cancellingSubscription ? 0.6 : 1 }}>
            {cancellingSubscription ? "Cancelling…" : "Cancel Subscription"}
          </motion.button>
        ) : subscriptionSource === "stripe" ? (
          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={onManageSubscription} disabled={upgradingStripe}
            style={{ padding: "10px 18px", background: C.glass, border: `1px solid ${C.glassBorder}`, borderRadius: 10, fontSize: 12, fontWeight: 600, color: C.textSecondary, cursor: upgradingStripe ? "not-allowed" : "pointer" }}>
            {upgradingStripe ? "Loading…" : "Manage Subscription"}
          </motion.button>
        ) : null}
      </motion.div>

      {/* Pro offer for free users */}
      {!isPro && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ padding: "22px", background: "linear-gradient(135deg,rgba(124,58,237,0.08),rgba(6,182,212,0.04))", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 20 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <CrownIcon /><span style={{ fontSize: 12, fontWeight: 800, color: C.gold, letterSpacing: "0.04em" }}>INTELLIXY PRO</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#4ade80", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.22)", padding: "3px 8px", borderRadius: 99 }}>Save 40%</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginBottom: 16 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: C.textMuted, textDecoration: "line-through", paddingBottom: 4 }}>₹499</span>
            <span style={{ fontSize: 40, fontWeight: 900, color: C.textPrimary, lineHeight: 1 }}>₹299</span>
            <span style={{ fontSize: 12, color: C.textMuted, paddingBottom: 4 }}>/mo</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: C.textMuted }}>
            <ShieldIcon /> Secure · Razorpay · Cancel anytime
          </div>
        </motion.div>
      )}
    </div>
  );
}
