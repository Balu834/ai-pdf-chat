"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { C } from "./tokens";
import { CrownIcon, CheckIcon } from "./icons";
import RazorpayButton from "@/components/RazorpayButton";

/* ─── SOCIAL PROOF DATA ──────────────────────────────────────────────────── */
// Rotate through real-feeling upgrade notifications
const PROOF_NAMES = [
  "Rahul from Bengaluru", "Priya from Mumbai", "Aarav from Delhi",
  "Sneha from Pune", "Karan from Hyderabad", "Divya from Chennai",
  "Arjun from Jaipur", "Meera from Ahmedabad",
];

function useSocialProof() {
  const [idx, setIdx]       = useState(() => Math.floor(Math.random() * PROOF_NAMES.length));
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show first proof after 3s, then every 8s
    const show = () => {
      setIdx((i) => (i + 1) % PROOF_NAMES.length);
      setVisible(true);
      setTimeout(() => setVisible(false), 3500);
    };
    const first   = setTimeout(show, 3000);
    const interval = setInterval(show, 8000);
    return () => { clearTimeout(first); clearInterval(interval); };
  }, []);

  return { name: PROOF_NAMES[idx], visible };
}

/* ─── UPGRADE COUNTER (live feel) ───────────────────────────────────────── */
// Simulate "X upgraded today" — anchors perceived value
function useUpgradeCount() {
  const [count, setCount] = useState(() => Math.floor(Math.random() * 12) + 18);
  useEffect(() => {
    const id = setInterval(() => {
      if (Math.random() > 0.7) setCount((c) => c + 1);
    }, 45_000);
    return () => clearInterval(id);
  }, []);
  return count;
}

/* ─── OFFER COUNTDOWN ────────────────────────────────────────────────────── */
// Shows HH:MM:SS countdown — resets from localStorage so it feels personal
function useOfferCountdown() {
  const STORAGE_KEY = "intellixy_offer_deadline";
  const getDeadline = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return parseInt(stored, 10);
      const deadline = Date.now() + 23 * 60 * 60 * 1000; // 23 hours
      localStorage.setItem(STORAGE_KEY, String(deadline));
      return deadline;
    } catch { return Date.now() + 23 * 60 * 60 * 1000; }
  };

  const [secsLeft, setSecsLeft] = useState(0);
  useEffect(() => {
    const deadline = getDeadline();
    const tick = () => setSecsLeft(Math.max(0, Math.floor((deadline - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const h = String(Math.floor(secsLeft / 3600)).padStart(2, "0");
  const m = String(Math.floor((secsLeft % 3600) / 60)).padStart(2, "0");
  const s = String(secsLeft % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

/* ─── UPGRADE POPUP ──────────────────────────────────────────────────────── */
export function UpgradePopup({ reason, onClose, user, usage }) {
  const isPdf = reason === "pdf";
  const [couponInput,   setCouponInput]   = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponData,    setCouponData]    = useState(null);
  const [couponError,   setCouponError]   = useState(null);
  const [showCoupon,    setShowCoupon]    = useState(false);

  const proof        = useSocialProof();
  const upgradeCount = useUpgradeCount();
  const countdown    = useOfferCountdown();

  async function applyCoupon() {
    if (!couponInput.trim()) return;
    setCouponLoading(true); setCouponError(null); setCouponData(null);
    try {
      const res  = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput.trim() }),
      });
      const data = await res.json();
      if (data.valid) setCouponData(data);
      else            setCouponError(data.error || "Invalid coupon");
    } catch { setCouponError("Could not validate coupon"); }
    finally  { setCouponLoading(false); }
  }

  const used     = isPdf ? (usage?.pdfs ?? 0)    : (usage?.questions ?? 0);
  const max      = isPdf ? (usage?.maxPdfs ?? 3)  : (usage?.maxQuestions ?? 5);

  return (
    <motion.div
      key="upgrade-backdrop"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(24px)" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.86, y: 32 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 8 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 440, background: "linear-gradient(165deg,#120e34,#09081c)", border: "1px solid rgba(124,58,237,0.45)", borderRadius: 30, padding: "32px 28px 26px", textAlign: "center", boxShadow: "0 0 0 1px rgba(124,58,237,0.06), 0 60px 160px rgba(0,0,0,0.95), 0 0 140px rgba(124,58,237,0.09)", backdropFilter: "blur(28px)", position: "relative", overflow: "hidden" }}
      >
        {/* Glow */}
        <div style={{ position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)", width: 360, height: 200, background: "radial-gradient(ellipse,rgba(124,58,237,0.22) 0%,transparent 65%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, right: -40, width: 220, height: 220, background: "radial-gradient(ellipse,rgba(6,182,212,0.07) 0%,transparent 70%)", pointerEvents: "none" }} />

        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "4px 9px", cursor: "pointer", color: C.textMuted, fontSize: 12, lineHeight: 1, zIndex: 1 }}>✕</button>

        <div style={{ position: "relative" }}>

          {/* Live activity bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 18 }}>
            <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", opacity: 0.4 + i * 0.3, animation: `pulse-dot ${1 + i * 0.3}s ease-in-out infinite` }} />
              ))}
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#4ade80" }}>
              {upgradeCount} people upgraded today
            </span>
          </div>

          {/* Usage pill */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "#f87171", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.28)", padding: "5px 13px", borderRadius: 99, marginBottom: 18 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f87171", display: "inline-block", animation: "pulseDot 1.2s ease-in-out infinite", flexShrink: 0 }} />
            {isPdf ? `${used}/${max} PDFs used` : `${used}/${max} questions used`}
          </div>

          {/* Warning icon */}
          <div style={{ width: 58, height: 58, borderRadius: 18, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.28)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", fontSize: 26 }}>
            ⚠️
          </div>

          {/* Headline */}
          <h2 style={{ fontSize: 21, fontWeight: 900, color: C.textPrimary, margin: "0 0 6px", letterSpacing: "-0.5px", lineHeight: 1.2 }}>
            You've reached your free limit
          </h2>

          {/* Subline with the hook */}
          <p style={{ fontSize: 13, color: C.textSecondary, margin: "0 0 6px", lineHeight: 1.65 }}>
            {isPdf
              ? `You've uploaded ${used}/${max} free PDFs.`
              : `You've asked ${used}/${max} questions today.`}
          </p>
          <p style={{ fontSize: 13, color: "rgba(240,240,248,0.5)", margin: "0 0 22px", lineHeight: 1.65 }}>
            But here's the thing 👇<br />
            <span style={{ color: C.accentLight, fontWeight: 600 }}>Your document still has more insights waiting…</span>
          </p>

          {/* Pricing card */}
          <div style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.14),rgba(6,182,212,0.1))", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 18, padding: "16px 16px 14px", marginBottom: 12, textAlign: "left" }}>
            {/* Header row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 13 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <CrownIcon />
                <span style={{ fontSize: 11, fontWeight: 800, color: C.gold, letterSpacing: "0.06em" }}>INTELLIXY PRO</span>
              </div>
              <span style={{ fontSize: 9, fontWeight: 800, color: "#4ade80", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.28)", padding: "3px 9px", borderRadius: 99, letterSpacing: "0.05em" }}>
                🔥 LIMITED OFFER
              </span>
            </div>

            {/* Features — exact copy from spec */}
            <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 16 }}>
              {[
                { icon: "✅", text: "Unlimited PDF chats" },
                { icon: "⚡", text: "Faster AI responses" },
                { icon: "📊", text: "Deep insights (risks, key points, summaries)" },
                { icon: "🔍", text: "Smarter answers with context" },
              ].map(({ icon, text }) => (
                <div key={text} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12.5, color: C.textSecondary }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>

            {/* Price */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 12 }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, textDecoration: "line-through", paddingBottom: 3 }}>₹299</span>
                <span style={{ fontSize: 36, fontWeight: 900, color: C.textPrimary, lineHeight: 1, letterSpacing: "-1.5px" }}>₹199</span>
                <span style={{ fontSize: 12, color: C.textMuted, paddingBottom: 3 }}>/month</span>
                <span style={{ fontSize: 10, fontWeight: 800, color: "#fbbf24", background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.25)", padding: "3px 8px", borderRadius: 6, marginLeft: 2, paddingBottom: 3 }}>EARLY BIRD</span>
              </div>
              {/* Countdown */}
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 10, color: "#f87171" }}>🔥</span>
                <span style={{ fontSize: 10.5, color: "#f87171", fontWeight: 600 }}>Offer ends in</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#fbbf24", fontVariantNumeric: "tabular-nums" }}>{countdown}</span>
              </div>
            </div>
          </div>

          {/* Money-back guarantee */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.16)", borderRadius: 12, padding: "10px 14px", marginBottom: 12, textAlign: "left" }}>
            <span style={{ fontSize: 18 }}>🛡️</span>
            <div>
              <p style={{ margin: 0, fontSize: 11.5, fontWeight: 700, color: "#4ade80" }}>7-day money-back guarantee</p>
              <p style={{ margin: 0, fontSize: 10.5, color: C.textMuted }}>Not happy? Full refund — no questions asked.</p>
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
              {couponData  && <p style={{ fontSize: 11, color: "#4ade80", margin: "6px 0 0" }}>✓ <strong>{couponData.code}</strong> — {couponData.savings_display}</p>}
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
          <RazorpayButton
            user={user}
            couponData={couponData}
            style={{ width: "100%", padding: "15px", background: "linear-gradient(135deg,#7c3aed,#06b6d4)", color: "white", fontSize: 15, fontWeight: 800, border: "none", borderRadius: 14, cursor: "pointer", boxShadow: "0 10px 40px rgba(124,58,237,0.6)", marginBottom: 14, transition: "opacity 0.2s", letterSpacing: "-0.2px" }}
          >
            {couponData
              ? `Pay ₹${couponData.final_amount_paise / 100} — Upgrade Now →`
              : "👉 Upgrade to PRO — ₹199/mo →"}
          </RazorpayButton>

          {/* Trust strip */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
            {[
              { icon: "🔒", text: "Secure via Razorpay" },
              { icon: "✦",  text: "7-day free trial"   },
              { icon: "↩",  text: "Cancel anytime"     },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10.5, color: "rgba(240,240,248,0.28)", fontWeight: 500 }}>
                <span style={{ fontSize: 10 }}>{icon}</span>{text}
              </div>
            ))}
          </div>
        </div>

        {/* Floating social proof toast */}
        <AnimatePresence>
          {proof.visible && (
            <motion.div
              key={proof.name}
              initial={{ opacity: 0, y: 20, x: "-50%" }}
              animate={{ opacity: 1, y: 0,  x: "-50%" }}
              exit={{ opacity: 0, y: -10,  x: "-50%" }}
              transition={{ type: "spring", damping: 22, stiffness: 300 }}
              style={{ position: "absolute", bottom: -20, left: "50%", transform: "translateX(-50%)", background: "rgba(15,12,40,0.97)", border: "1px solid rgba(74,222,128,0.28)", borderRadius: 12, padding: "8px 14px", display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap", boxShadow: "0 8px 28px rgba(0,0,0,0.7)", zIndex: 10 }}
            >
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(240,240,248,0.7)" }}>
                <strong style={{ color: "#f0f0f8" }}>{proof.name}</strong> just upgraded to Pro
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

/* ─── UPGRADE BANNER (inline, below input) ───────────────────────────────── */
export function UpgradeBanner({ type, onUpgrade, usage }) {
  const used = type === "question" ? (usage?.questions ?? 0) : (usage?.pdfs ?? 0);
  const max  = type === "question" ? (usage?.maxQuestions ?? 5) : (usage?.maxPdfs ?? 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", damping: 22, stiffness: 300 }}
      style={{ margin: "8px 0", padding: "16px 18px", background: "linear-gradient(135deg,rgba(239,68,68,0.07),rgba(124,58,237,0.07))", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 16, backdropFilter: "blur(8px)" }}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 13.5, fontWeight: 800, color: "#f87171", margin: "0 0 3px", letterSpacing: "-0.2px" }}>
            ⚠️ You've reached your free limit
          </p>
          <p style={{ fontSize: 12, color: "rgba(240,240,248,0.45)", margin: "0 0 10px", lineHeight: 1.55 }}>
            {type === "question"
              ? `You've asked ${used}/${max} questions. Your document still has more insights waiting…`
              : `You've uploaded ${used}/${max} free PDFs. Unlock unlimited uploads to keep going.`}
          </p>
          {/* Feature pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {["✅ Unlimited PDF chats", "⚡ Faster AI", "📊 Deep insights", "🔍 Smarter answers"].map((f) => (
              <span key={f} style={{ fontSize: 10.5, fontWeight: 600, color: "rgba(240,240,248,0.55)", background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 99, padding: "3px 9px" }}>{f}</span>
            ))}
          </div>
        </div>

        {/* CTA block */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 2 }}>
            <span style={{ fontSize: 10, color: C.textMuted, textDecoration: "line-through" }}>₹299</span>
            <span style={{ fontSize: 15, fontWeight: 900, color: C.textPrimary }}>₹199</span>
            <span style={{ fontSize: 10, color: C.textMuted }}>/mo</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: "0 8px 28px rgba(124,58,237,0.55)" }}
            whileTap={{ scale: 0.96 }}
            onClick={onUpgrade}
            style={{ padding: "10px 20px", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "white", fontSize: 12.5, fontWeight: 800, border: "none", borderRadius: 10, cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 4px 18px rgba(124,58,237,0.45)", letterSpacing: "-0.2px" }}
          >
            👉 Upgrade to PRO
          </motion.button>
        </div>
      </div>

      {/* Trust strip */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 11, borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 9 }}>
        {["🔒 Secured by Razorpay", "✓ Cancel anytime", "✓ 7-day money-back"].map((t) => (
          <span key={t} style={{ fontSize: 10, color: "rgba(240,240,248,0.25)", fontWeight: 500 }}>{t}</span>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── LOCKED MESSAGE (blurred AI response) ───────────────────────────────── */
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
          {/* Fake blurred content */}
          <div style={{ padding: "14px 18px", background: "rgba(255,255,255,0.05)", userSelect: "none" }}>
            {[100, 88, 95, 72, 60].map((w, i) => (
              <div key={i} style={{ height: 13, width: `${w}%`, borderRadius: 6, background: "rgba(255,255,255,0.09)", marginBottom: i < 4 ? 8 : 0 }} />
            ))}
          </div>
          {/* Blur overlay */}
          <div style={{ position: "absolute", inset: 0, backdropFilter: "blur(7px)", background: "linear-gradient(to bottom,transparent 0%,rgba(9,8,28,0.6) 35%,rgba(9,8,28,0.95) 65%)" }} />
          {/* CTA over blur */}
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", padding: "14px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 18, marginBottom: 5 }}>⚠️</div>
            <p style={{ fontSize: 12, fontWeight: 800, color: "#f87171", margin: "0 0 2px", lineHeight: 1.4 }}>
              You've reached your free limit
            </p>
            <p style={{ fontSize: 11, color: "rgba(240,240,248,0.45)", margin: "0 0 10px" }}>
              Your document still has more insights waiting…
            </p>
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: "0 8px 28px rgba(124,58,237,0.55)" }}
              whileTap={{ scale: 0.96 }}
              onClick={onUpgrade}
              style={{ padding: "10px 22px", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "white", fontSize: 12.5, fontWeight: 800, border: "none", borderRadius: 10, cursor: "pointer", boxShadow: "0 4px 20px rgba(124,58,237,0.5)", whiteSpace: "nowrap" }}
            >
              👉 Upgrade to PRO — ₹199/mo
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
