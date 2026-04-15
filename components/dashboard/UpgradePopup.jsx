"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { C } from "./tokens";
import { CrownIcon, CheckIcon } from "./icons";
import RazorpayButton from "@/components/RazorpayButton";

/* ─── UPGRADE POPUP ──────────────────────────────────────────────────────── */
export function UpgradePopup({ reason, onClose, user, usage }) {
  const isPdf = reason === "pdf";
  const [couponInput, setCouponInput]   = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponData, setCouponData]     = useState(null);
  const [couponError, setCouponError]   = useState(null);
  const [showCoupon, setShowCoupon]     = useState(false);

  async function applyCoupon() {
    if (!couponInput.trim()) return;
    setCouponLoading(true); setCouponError(null); setCouponData(null);
    try {
      const res  = await fetch("/api/coupons/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: couponInput.trim() }) });
      const data = await res.json();
      if (data.valid) setCouponData(data); else setCouponError(data.error || "Invalid coupon");
    } catch { setCouponError("Could not validate coupon"); }
    finally { setCouponLoading(false); }
  }

  const used    = isPdf ? (usage?.pdfs ?? 0)       : (usage?.questions ?? 0);
  const max     = isPdf ? (usage?.maxPdfs ?? 5)    : (usage?.maxQuestions ?? 10);
  const headline = isPdf
    ? `You've uploaded ${used}/${max} free PDFs`
    : `You've asked ${used}/${max} free questions`;
  const subline  = isPdf
    ? "You've used your free PDF slots. Upgrade to keep uploading without limits."
    : "You're clearly getting value from Intellixy — upgrade to keep the momentum going.";

  return (
    <motion.div
      key="upgrade-backdrop"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(20px)" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 28 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 8 }}
        transition={{ type: "spring", damping: 22, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 430, background: "linear-gradient(160deg,rgba(18,14,52,0.98),rgba(9,8,28,0.98))", border: "1px solid rgba(124,58,237,0.4)", borderRadius: 28, padding: "32px 28px 28px", textAlign: "center", boxShadow: "0 0 0 1px rgba(124,58,237,0.08), 0 50px 140px rgba(0,0,0,0.9), 0 0 120px rgba(124,58,237,0.08)", backdropFilter: "blur(24px)", position: "relative", overflow: "hidden" }}
      >
        {/* Purple glow top */}
        <div style={{ position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)", width: 300, height: 160, background: "radial-gradient(ellipse,rgba(124,58,237,0.2) 0%,transparent 70%)", pointerEvents: "none" }} />

        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "4px 9px", cursor: "pointer", color: C.textMuted, fontSize: 12, lineHeight: 1, zIndex: 1 }}>✕</button>

        <div style={{ position: "relative" }}>
          {/* Usage pill */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "#f87171", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", padding: "5px 12px", borderRadius: 99, marginBottom: 18 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f87171", display: "inline-block", animation: "pulseDot 1.2s ease-in-out infinite" }} />
            {isPdf ? `${used}/${max} PDFs used` : `${used}/${max} questions used`}
          </div>

          {/* Icon */}
          <div style={{ width: 64, height: 64, borderRadius: 20, background: "linear-gradient(135deg,#7c3aed,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28, boxShadow: "0 12px 40px rgba(124,58,237,0.5)" }}>
            {isPdf ? "📄" : "💬"}
          </div>

          <h2 style={{ fontSize: 21, fontWeight: 900, color: C.textPrimary, margin: "0 0 8px", letterSpacing: "-0.4px", lineHeight: 1.25 }}>
            {headline}
          </h2>
          <p style={{ fontSize: 13, color: C.textSecondary, margin: "0 0 20px", lineHeight: 1.65 }}>
            {subline}
          </p>

          {/* Pricing card */}
          <div style={{ background: "linear-gradient(135deg,#7c3aed22,#06b6d418)", border: "1px solid rgba(124,58,237,0.28)", borderRadius: 18, padding: "16px 16px 14px", marginBottom: 14, textAlign: "left" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <CrownIcon />
                <span style={{ fontSize: 11, fontWeight: 800, color: C.gold, letterSpacing: "0.05em" }}>INTELLIXY PRO</span>
              </div>
              <span style={{ fontSize: 9, fontWeight: 800, color: "#4ade80", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.28)", padding: "3px 9px", borderRadius: 99, letterSpacing: "0.04em" }}>🔥 EARLY BIRD PRICE</span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.textMuted, textDecoration: "line-through", paddingBottom: 5 }}>₹499</span>
              <span style={{ fontSize: 36, fontWeight: 900, color: C.textPrimary, lineHeight: 1, letterSpacing: "-1px" }}>₹299</span>
              <span style={{ fontSize: 12, color: C.textMuted, paddingBottom: 4 }}>/month</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 10px" }}>
              {["Unlimited PDF uploads","Unlimited questions","Delete PDFs anytime","PDF Compare & Insights","Share chat links","Priority support"].map((f) => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: C.textSecondary }}>
                  <span style={{ color: C.green, flexShrink: 0 }}><CheckIcon /></span>{f}
                </div>
              ))}
            </div>
          </div>

          {/* Coupon toggle */}
          {!showCoupon ? (
            <button onClick={() => setShowCoupon(true)} style={{ background: "none", border: "none", fontSize: 11, color: C.textMuted, cursor: "pointer", marginBottom: 10, textDecoration: "underline" }}>
              Have a coupon code?
            </button>
          ) : (
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  value={couponInput}
                  onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponData(null); setCouponError(null); }}
                  onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                  placeholder="Enter coupon code"
                  style={{ flex: 1, padding: "9px 12px", fontSize: 12, background: "rgba(255,255,255,0.04)", border: couponData ? "1px solid rgba(74,222,128,0.4)" : couponError ? "1px solid rgba(248,113,113,0.4)" : "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: C.textPrimary, outline: "none" }}
                />
                <button onClick={applyCoupon} disabled={couponLoading || !couponInput.trim()}
                  style={{ padding: "9px 14px", fontSize: 12, fontWeight: 700, background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 10, color: C.accentLight, cursor: couponLoading || !couponInput.trim() ? "not-allowed" : "pointer", opacity: couponLoading || !couponInput.trim() ? 0.5 : 1 }}>
                  {couponLoading ? "…" : "Apply"}
                </button>
              </div>
              {couponData && <p style={{ fontSize: 11, color: "#4ade80", margin: "6px 0 0" }}>✓ <strong>{couponData.code}</strong> — {couponData.savings_display}</p>}
              {couponError && <p style={{ fontSize: 11, color: "#f87171", margin: "6px 0 0" }}>{couponError}</p>}
            </div>
          )}

          {/* Discounted price row */}
          {couponData && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 10, padding: "10px", background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 10 }}>
              <span style={{ fontSize: 13, color: C.textMuted, textDecoration: "line-through" }}>₹{couponData.original_amount_paise / 100}</span>
              <span style={{ fontSize: 22, fontWeight: 900, color: "#4ade80" }}>₹{couponData.final_amount_paise / 100}</span>
              <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 700 }}>({couponData.savings_display})</span>
            </div>
          )}

          {/* CTA */}
          <RazorpayButton user={user} couponData={couponData}
            style={{ width: "100%", padding: "15px", background: "linear-gradient(135deg,#7c3aed,#06b6d4)", color: "white", fontSize: 14, fontWeight: 800, border: "none", borderRadius: 14, cursor: "pointer", boxShadow: "0 8px 36px rgba(124,58,237,0.55)", marginBottom: 14, transition: "opacity 0.2s", letterSpacing: "-0.2px" }}>
            {couponData ? `Pay ₹${couponData.final_amount_paise / 100} — Upgrade Now →` : "Upgrade to Pro — ₹299/mo →"}
          </RazorpayButton>

          {/* Trust row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
            {[
              { icon: "🔒", text: "Secure via Razorpay" },
              { icon: "✦", text: "7-day free trial" },
              { icon: "↩", text: "Cancel anytime" },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10.5, color: "rgba(240,240,248,0.3)", fontWeight: 500 }}>
                <span style={{ fontSize: 10 }}>{icon}</span>{text}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── UPGRADE BANNER (inline) ────────────────────────────────────────────── */
export function UpgradeBanner({ type, onUpgrade, usage }) {
  const used = type === "question" ? (usage?.questions ?? 0) : (usage?.pdfs ?? 0);
  const max  = type === "question" ? (usage?.maxQuestions ?? 10) : (usage?.maxPdfs ?? 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", damping: 22, stiffness: 300 }}
      style={{ margin: "8px 0", padding: "16px 18px", background: "linear-gradient(135deg,rgba(239,68,68,0.08),rgba(124,58,237,0.06))", border: "1px solid rgba(239,68,68,0.22)", borderRadius: 16, backdropFilter: "blur(8px)" }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 13 }}>🔒</span>
            <p style={{ fontSize: 13, fontWeight: 800, color: "#f87171", margin: 0, letterSpacing: "-0.2px" }}>
              {type === "question" ? `${used}/${max} questions used — limit reached` : `${used}/${max} PDFs used — limit reached`}
            </p>
          </div>
          <p style={{ fontSize: 12, color: "rgba(240,240,248,0.3)", margin: 0, lineHeight: 1.55 }}>
            {type === "question"
              ? "Upgrade to Pro for unlimited questions, forever."
              : "Upgrade to Pro for unlimited PDF uploads and questions."}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.04, boxShadow: "0 8px 28px rgba(124,58,237,0.5)" }}
          whileTap={{ scale: 0.96 }}
          onClick={onUpgrade}
          style={{ padding: "10px 18px", background: "linear-gradient(135deg,#7c3aed,#06b6d4)", color: "white", fontSize: 12, fontWeight: 800, border: "none", borderRadius: 10, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, boxShadow: "0 4px 18px rgba(124,58,237,0.4)" }}
        >
          Upgrade — ₹299/mo →
        </motion.button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {["✓ Cancel anytime", "✓ 7-day free trial", "✓ Secure via Razorpay"].map((t) => (
          <span key={t} style={{ fontSize: 10.5, color: "rgba(240,240,248,0.28)", fontWeight: 500 }}>{t}</span>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── LOCKED MESSAGE ─────────────────────────────────────────────────────── */
export function LockedMessage({ onUpgrade }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      style={{ display: "flex", gap: 12, alignItems: "flex-start" }}
    >
      <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2, boxShadow: "0 4px 18px rgba(124,58,237,0.35)", opacity: 0.5 }}>
        ✦
      </div>
      <div style={{ maxWidth: "65%", flex: 1 }}>
        <div style={{ position: "relative", borderRadius: "5px 20px 20px 20px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 6 }}>
          <div style={{ padding: "14px 18px", background: "rgba(255,255,255,0.05)", userSelect: "none" }}>
            {[100, 88, 95, 72, 60].map((w, i) => (
              <div key={i} style={{ height: 13, width: `${w}%`, borderRadius: 6, background: "rgba(255,255,255,0.09)", marginBottom: i < 4 ? 8 : 0 }} />
            ))}
          </div>
          <div style={{ position: "absolute", inset: 0, backdropFilter: "blur(6px)", background: "linear-gradient(to bottom,transparent 0%,rgba(9,8,28,0.65) 40%,rgba(9,8,28,0.92) 70%)" }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", padding: "14px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 18, marginBottom: 6 }}>🔒</div>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#f0f0f8", margin: "0 0 10px", lineHeight: 1.4 }}>
              You've reached your question limit
            </p>
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: "0 8px 28px rgba(124,58,237,0.55)" }}
              whileTap={{ scale: 0.96 }}
              onClick={onUpgrade}
              style={{ padding: "9px 20px", background: "linear-gradient(135deg,#7c3aed,#06b6d4)", color: "white", fontSize: 12, fontWeight: 800, border: "none", borderRadius: 10, cursor: "pointer", boxShadow: "0 4px 20px rgba(124,58,237,0.5)", whiteSpace: "nowrap" }}
            >
              Unlock full answer — ₹299/mo →
            </motion.button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, paddingLeft: 2 }}>
          {["✓ Cancel anytime", "✓ 7-day free trial"].map((t) => (
            <span key={t} style={{ fontSize: 10, color: "rgba(240,240,248,0.22)", fontWeight: 500 }}>{t}</span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
