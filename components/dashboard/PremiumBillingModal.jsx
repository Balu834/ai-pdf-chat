"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import RazorpayButton from "@/components/RazorpayButton";

/* ─── KEYFRAME INJECTION ─────────────────────────────────────────────────── */
const CSS = `
  @keyframes pbm-float    { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-14px) rotate(3deg)} }
  @keyframes pbm-spin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes pbm-tick     { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes pbm-shimmer  { 0%{background-position:200% center} 100%{background-position:-200% center} }
  @keyframes pbm-pulse-g  { 0%,100%{box-shadow:0 0 0 0 rgba(124,58,237,0.45)} 50%{box-shadow:0 0 0 10px rgba(124,58,237,0)} }
`;

function InjectCSS() {
  const injected = useRef(false);
  useEffect(() => {
    if (injected.current) return;
    const el = document.createElement("style");
    el.textContent = CSS;
    document.head.appendChild(el);
    injected.current = true;
  }, []);
  return null;
}

/* ─── CONVERSION HOOKS ───────────────────────────────────────────────────── */
function useSocialProof() {
  const NAMES = [
    "Rahul from Bengaluru", "Priya from Mumbai", "Aarav from Delhi",
    "Sneha from Pune", "Karan from Hyderabad", "Divya from Chennai",
    "Arjun from Jaipur", "Meera from Ahmedabad", "Rohan from Surat",
  ];
  const [idx, setIdx]         = useState(0);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setIdx(Math.floor(Math.random() * NAMES.length));
    const show = () => {
      setIdx((i) => (i + 1) % NAMES.length);
      setVisible(true);
      setTimeout(() => setVisible(false), 3800);
    };
    const t1 = setTimeout(show, 2800);
    const ti = setInterval(show, 9000);
    return () => { clearTimeout(t1); clearInterval(ti); };
  }, []);
  return { name: NAMES[idx], visible };
}

function useUpgradeCount() {
  const [count, setCount] = useState(22);
  useEffect(() => {
    setCount(Math.floor(Math.random() * 14) + 22);
    const id = setInterval(() => { if (Math.random() > 0.72) setCount((c) => c + 1); }, 42_000);
    return () => clearInterval(id);
  }, []);
  return count;
}

function useCountdown() {
  const KEY = "pbm_offer_deadline";
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    let deadline;
    try {
      const stored = localStorage.getItem(KEY);
      deadline = stored ? parseInt(stored, 10) : Date.now() + 23 * 3600_000;
      if (!stored) localStorage.setItem(KEY, String(deadline));
    } catch { deadline = Date.now() + 23 * 3600_000; }
    const tick = () => setSecs(Math.max(0, Math.floor((deadline - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  const h = String(Math.floor(secs / 3600)).padStart(2, "0");
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function useIsMobile(bp = 720) {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < bp);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [bp]);
  return mobile;
}

/* ─── LEFT PANEL ─────────────────────────────────────────────────────────── */
const PRO_FEATURES = [
  { icon: "♾️", label: "Unlimited PDF uploads",          sub: "No more hitting limits" },
  { icon: "⚡", label: "2× faster AI responses",         sub: "Answers in under 2 seconds" },
  { icon: "📊", label: "Deep insights & analytics",       sub: "Key points, risks, summaries" },
  { icon: "🎙️", label: "Voice AI conversation",          sub: "Talk to your documents" },
  { icon: "📂", label: "Side-by-side PDF comparison",     sub: "Compare docs instantly" },
];
const PREMIUM_FEATURES = [
  { icon: "✅", label: "Everything in Pro",               sub: "All Pro features included" },
  { icon: "👥", label: "Team workspaces (5 seats)",       sub: "Collaborate in real-time" },
  { icon: "🎛️", label: "Custom AI instructions",         sub: "Train AI to your style" },
  { icon: "📦", label: "Bulk PDF processing",             sub: "Upload hundreds at once" },
  { icon: "⚡", label: "Priority support",               sub: "Response within 2 hours" },
];

function LeftPanel({ isPremium, isMobile }) {
  const features = isPremium ? PREMIUM_FEATURES : PRO_FEATURES;

  return (
    <div style={{
      width:      isMobile ? "100%" : 360,
      flexShrink: 0,
      background: "linear-gradient(155deg, #1e0b4a 0%, #2d1278 35%, #0f062e 70%, #07041a 100%)",
      borderRadius: isMobile ? "20px 20px 0 0" : "20px 0 0 20px",
      padding: isMobile ? "30px 28px 22px" : "42px 36px",
      display: "flex",
      flexDirection: "column",
      gap: 0,
      position: "relative",
      overflow: "hidden",
    }}>
      <InjectCSS />

      {/* Decorative blobs */}
      <div style={{ position: "absolute", top: -60, right: -60, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.28) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -40, left: -40, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{
        position: "absolute", top: 110, right: 24, width: 48, height: 48,
        borderRadius: "14px", border: "1.5px solid rgba(124,58,237,0.3)",
        background: "rgba(124,58,237,0.08)", animation: "pbm-float 6s ease-in-out infinite",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: 80, right: 40, width: 32, height: 32,
        borderRadius: "50%", border: "1.5px solid rgba(6,182,212,0.25)",
        background: "rgba(6,182,212,0.06)", animation: "pbm-float 8s ease-in-out infinite 2s",
        pointerEvents: "none",
      }} />

      {/* Logo + brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, boxShadow: "0 4px 18px rgba(124,58,237,0.55)",
          flexShrink: 0,
        }}>✦</div>
        <div>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#f0f0f8", letterSpacing: "-0.2px" }}>Intellixy</p>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: "rgba(167,139,250,0.7)", letterSpacing: "0.1em", textTransform: "uppercase" }}>AI PDF Intelligence</p>
        </div>
      </div>

      {/* Headline */}
      <h2 style={{
        fontSize: isMobile ? 20 : 24, fontWeight: 900, lineHeight: 1.22,
        letterSpacing: "-0.6px", color: "#f0f0f8", margin: "0 0 10px",
      }}>
        Chat with any PDF.{" "}
        <span style={{
          background: "linear-gradient(90deg, #a78bfa, #60a5fa, #a78bfa)",
          backgroundSize: "200% auto",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          animation: "pbm-shimmer 3s linear infinite",
        }}>
          Get instant answers.
        </span>
      </h2>
      <p style={{ fontSize: 13, color: "rgba(240,240,248,0.52)", lineHeight: 1.65, margin: "0 0 28px" }}>
        {isPremium
          ? "Unlock the full platform — team workspaces, bulk processing, and priority support."
          : "Join 2,400+ professionals who use Intellixy to extract insights from PDFs in seconds."}
      </p>

      {/* Feature list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
        {features.map(({ icon, label, sub }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 + i * 0.055, duration: 0.28 }}
            style={{ display: "flex", alignItems: "center", gap: 12 }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: "rgba(124,58,237,0.14)",
              border: "1px solid rgba(124,58,237,0.28)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16,
            }}>{icon}</div>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#f0f0f8" }}>{label}</p>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(240,240,248,0.42)" }}>{sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Social stats */}
      {!isMobile && (
        <div style={{
          marginTop: "auto",
          padding: "14px 16px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 14,
          display: "flex", gap: 20,
        }}>
          {[
            { n: "2,400+", l: "Professionals" },
            { n: "98%",    l: "Satisfaction"  },
            { n: "4.9★",  l: "Rating"         },
          ].map(({ n, l }) => (
            <div key={l} style={{ textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#a78bfa" }}>{n}</p>
              <p style={{ margin: 0, fontSize: 10, color: "rgba(240,240,248,0.38)", fontWeight: 600 }}>{l}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── RIGHT PANEL ────────────────────────────────────────────────────────── */
function RightPanel({ reason, user, usage, onClose, isMobile }) {
  const [plan,          setPlan]          = useState("pro");
  const [couponInput,   setCouponInput]   = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponData,    setCouponData]    = useState(null);
  const [couponError,   setCouponError]   = useState(null);
  const [showCoupon,    setShowCoupon]    = useState(false);
  const [payError,      setPayError]      = useState(null);

  const isPremium    = plan === "premium";
  const upgradeCount = useUpgradeCount();
  const countdown    = useCountdown();

  const isPdf  = reason === "pdf";
  const used   = isPdf ? (usage?.pdfs ?? 0)      : (usage?.questions ?? 0);
  const max    = isPdf ? (usage?.maxPdfs ?? 3)    : (usage?.maxQuestions ?? 5);

  const proPrice     = couponData ? `₹${couponData.final_amount_paise / 100}` : "₹299";
  const proOriginal  = couponData ? "₹299" : null;

  async function applyCoupon() {
    if (!couponInput.trim()) return;
    setCouponLoading(true); setCouponError(null); setCouponData(null);
    try {
      const res  = await fetch("/api/coupons/validate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput.trim() }),
      });
      const data = await res.json();
      if (data.valid) setCouponData(data);
      else            setCouponError(data.error || "Invalid coupon code.");
    } catch { setCouponError("Could not validate coupon."); }
    finally  { setCouponLoading(false); }
  }

  return (
    <div style={{
      flex:       1,
      minWidth:   0,
      background: "rgba(6,4,22,0.97)",
      borderRadius: isMobile ? "0 0 20px 20px" : "0 20px 20px 0",
      padding:    isMobile ? "28px 22px 30px" : "38px 36px 36px",
      display:    "flex",
      flexDirection: "column",
      gap:        0,
      overflowY:  "auto",
      maxHeight:  isMobile ? "none" : 700,
    }}>

      {/* ── Close button ── */}
      <button onClick={onClose} style={{
        position: "absolute", top: 16, right: 16,
        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 8, width: 30, height: 30, cursor: "pointer",
        color: "rgba(240,240,248,0.4)", fontSize: 14, display: "flex",
        alignItems: "center", justifyContent: "center", lineHeight: 1,
      }}>✕</button>

      {/* ── Activity badge ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
          {[0,1,2].map((i) => (
            <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ade80", opacity: 0.4 + i * 0.3, animation: `pulse-dot ${1 + i * 0.3}s ease-in-out infinite` }} />
          ))}
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#4ade80" }}>
          {upgradeCount} people upgraded today
        </span>
        <div style={{
          marginLeft: "auto", padding: "3px 10px",
          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.28)",
          borderRadius: 99, fontSize: 10.5, fontWeight: 700, color: "#f87171",
          display: "flex", alignItems: "center", gap: 4,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#f87171", display: "inline-block", animation: "pulse-dot 1.2s ease-in-out infinite" }} />
          {isPdf ? `${used}/${max} PDFs used` : `${used}/${max} questions used`}
        </div>
      </div>

      {/* ── Heading ── */}
      <h3 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 900, color: "#f0f0f8", letterSpacing: "-0.5px" }}>
        Choose your plan
      </h3>
      <p style={{ margin: "0 0 20px", fontSize: 13, color: "rgba(240,240,248,0.45)", lineHeight: 1.55 }}>
        Unlock unlimited access — cancel anytime.
      </p>

      {/* ── Plan toggle tabs ── */}
      <div style={{
        display: "flex", background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14,
        padding: 4, marginBottom: 18, gap: 4,
      }}>
        {[
          { id: "pro",     label: "Pro",     price: "₹299/mo", color: "#a78bfa" },
          { id: "premium", label: "Premium", price: "₹999/yr", color: "#fbbf24" },
        ].map(({ id, label, price, color }) => (
          <button
            key={id}
            onClick={() => { setPlan(id); setCouponData(null); setCouponInput(""); setCouponError(null); setPayError(null); }}
            style={{
              flex: 1, padding: "9px 6px", borderRadius: 10, cursor: "pointer",
              border: plan === id ? `1px solid ${color}50` : "1px solid transparent",
              background: plan === id ? `${color}16` : "transparent",
              transition: "all 0.18s",
            }}
          >
            <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: plan === id ? color : "rgba(240,240,248,0.35)" }}>{label}</p>
            <p style={{ margin: 0, fontSize: 10.5, color: plan === id ? `${color}99` : "rgba(240,240,248,0.22)", fontWeight: 600 }}>{price}</p>
          </button>
        ))}
      </div>

      {/* ── Pricing card ── */}
      <motion.div
        key={plan}
        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          background: isPremium
            ? "linear-gradient(135deg,rgba(245,158,11,0.1),rgba(217,119,6,0.06))"
            : "linear-gradient(135deg,rgba(124,58,237,0.12),rgba(6,182,212,0.08))",
          border: isPremium ? "1px solid rgba(245,158,11,0.32)" : "1px solid rgba(124,58,237,0.28)",
          borderRadius: 18, padding: "18px 18px 16px", marginBottom: 14,
        }}
      >
        {/* Card header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 16 }}>{isPremium ? "⭐" : "🔥"}</span>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.07em", color: isPremium ? "#fbbf24" : "#c4b5fd" }}>
              {isPremium ? "INTELLIXY PREMIUM" : "INTELLIXY PRO"}
            </span>
          </div>
          <span style={{
            fontSize: 9, fontWeight: 800, letterSpacing: "0.06em",
            color: isPremium ? "#fbbf24" : "#4ade80",
            background: isPremium ? "rgba(251,191,36,0.1)" : "rgba(74,222,128,0.1)",
            border: isPremium ? "1px solid rgba(251,191,36,0.28)" : "1px solid rgba(74,222,128,0.28)",
            padding: "3px 9px", borderRadius: 99,
          }}>
            {isPremium ? "BEST FOR TEAMS" : "MOST POPULAR"}
          </span>
        </div>

        {/* Price row */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginBottom: 6 }}>
          {proOriginal && !isPremium && (
            <span style={{ fontSize: 16, color: "rgba(240,240,248,0.3)", textDecoration: "line-through", paddingBottom: 3 }}>
              {proOriginal}
            </span>
          )}
          <span style={{ fontSize: 40, fontWeight: 900, lineHeight: 1, letterSpacing: "-2px", color: isPremium ? "#fbbf24" : "#f0f0f8" }}>
            {isPremium ? "₹999" : proPrice}
          </span>
          <div style={{ paddingBottom: 4 }}>
            <p style={{ margin: 0, fontSize: 12, color: "rgba(240,240,248,0.4)" }}>
              {isPremium ? "/year" : "/month"}
            </p>
            {isPremium && (
              <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#fbbf24" }}>= ₹83/mo</p>
            )}
          </div>
          <span style={{
            marginLeft: 4, padding: "4px 9px", borderRadius: 7,
            fontSize: 9.5, fontWeight: 800, letterSpacing: "0.04em",
            background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.28)",
            color: "#fbbf24", alignSelf: "flex-end", marginBottom: 4,
          }}>
            {isPremium ? "SAVE 70%" : "BEST VALUE"}
          </span>
        </div>

        {/* Countdown */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
          <span style={{ fontSize: 11 }}>🔥</span>
          <span style={{ fontSize: 11, color: "#f87171", fontWeight: 600 }}>Offer expires in</span>
          <span style={{
            fontVariantNumeric: "tabular-nums", fontSize: 12, fontWeight: 800,
            color: "#fbbf24", letterSpacing: "0.04em",
            animation: "pbm-tick 1s steps(1) infinite",
          }}>{countdown}</span>
        </div>

        {/* Feature bullets */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {(isPremium ? [
            "Everything in Pro",
            "Team workspaces — 5 seats",
            "Voice AI conversation",
            "Custom AI instructions",
            "Bulk PDF processing",
          ] : [
            "Unlimited PDFs & questions",
            "2× faster AI — under 2 seconds",
            "Deep insights & analytics",
            "Side-by-side PDF comparison",
          ]).map((f) => (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "rgba(240,240,248,0.82)" }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 16 16">
                <circle cx="8" cy="8" r="7" fill={isPremium ? "rgba(251,191,36,0.15)" : "rgba(124,58,237,0.18)"}/>
                <path d="M5 8l2 2 4-4" stroke={isPremium ? "#fbbf24" : "#a78bfa"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {f}
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Money-back guarantee ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.15)",
        borderRadius: 12, padding: "10px 14px", marginBottom: 14,
      }}>
        <span style={{ fontSize: 20 }}>🛡️</span>
        <div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#4ade80" }}>7-day money-back guarantee</p>
          <p style={{ margin: 0, fontSize: 10.5, color: "rgba(240,240,248,0.38)" }}>Not happy? Full refund, no questions asked.</p>
        </div>
      </div>

      {/* ── Coupon (Pro only) ── */}
      {!isPremium && !showCoupon && (
        <button
          onClick={() => setShowCoupon(true)}
          style={{ background: "none", border: "none", fontSize: 11.5, color: "rgba(167,139,250,0.6)", cursor: "pointer", marginBottom: 12, textDecoration: "underline", textUnderlineOffset: 3, textAlign: "left" }}
        >
          Have a coupon code?
        </button>
      )}
      {!isPremium && showCoupon && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              value={couponInput}
              onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponData(null); setCouponError(null); }}
              onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
              placeholder="COUPON CODE"
              style={{
                flex: 1, padding: "10px 14px", fontSize: 12.5, fontWeight: 600,
                letterSpacing: "0.06em",
                background: "rgba(255,255,255,0.04)",
                border: couponData ? "1px solid rgba(74,222,128,0.45)" : couponError ? "1px solid rgba(248,113,113,0.4)" : "1px solid rgba(255,255,255,0.1)",
                borderRadius: 11, color: "#f0f0f8", outline: "none",
                transition: "border 0.15s",
              }}
            />
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={applyCoupon}
              disabled={couponLoading || !couponInput.trim()}
              style={{
                padding: "10px 16px", fontSize: 12, fontWeight: 700,
                background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.35)",
                borderRadius: 11, color: "#a78bfa", cursor: couponLoading || !couponInput.trim() ? "not-allowed" : "pointer",
                opacity: couponLoading || !couponInput.trim() ? 0.5 : 1, whiteSpace: "nowrap",
              }}
            >{couponLoading ? "…" : "Apply"}</motion.button>
          </div>
          <AnimatePresence>
            {couponData && (
              <motion.p initial={{ opacity:0,y:-4 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0 }}
                style={{ margin: "6px 0 0", fontSize: 11.5, color: "#4ade80", fontWeight: 600 }}>
                ✓ <strong>{couponData.code}</strong> applied — saving {couponData.savings_display}
              </motion.p>
            )}
            {couponError && (
              <motion.p initial={{ opacity:0,y:-4 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0 }}
                style={{ margin: "6px 0 0", fontSize: 11.5, color: "#f87171" }}>
                {couponError}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Payment error ── */}
      <AnimatePresence>
        {payError && (
          <motion.div
            initial={{ opacity:0,y:-4 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0 }}
            style={{ marginBottom: 12, padding: "10px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 11, fontSize: 12, color: "#f87171", lineHeight: 1.5 }}
          >{payError}</motion.div>
        )}
      </AnimatePresence>

      {/* ── CTA button ── */}
      <RazorpayButton
        user={user}
        plan={plan}
        couponData={isPremium ? null : couponData}
        onError={(msg) => setPayError(msg)}
        onSuccess={() => { window.location.href = "/success"; }}
        style={{
          width: "100%", padding: "16px 20px", borderRadius: 14,
          fontSize: 15, fontWeight: 800, letterSpacing: "-0.2px",
          color: "white", border: "none", cursor: "pointer",
          background: isPremium
            ? "linear-gradient(135deg, #92400e 0%, #d97706 50%, #f59e0b 100%)"
            : "linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #06b6d4 100%)",
          boxShadow: isPremium
            ? "0 0 0 0 rgba(245,158,11,0.5), 0 12px 40px rgba(245,158,11,0.45)"
            : "0 0 0 0 rgba(124,58,237,0.5), 0 12px 40px rgba(124,58,237,0.55)",
          animation: "pbm-pulse-g 2.4s ease-in-out infinite",
          marginBottom: 14,
          transition: "opacity 0.15s, transform 0.1s",
        }}
      >
        {isPremium
          ? "⭐ Unlock Premium — ₹999/year →"
          : couponData
            ? `🎉 Pay ₹${couponData.final_amount_paise / 100} — Unlock Access →`
            : "🔓 Start Pro — ₹299/month →"}
      </RazorpayButton>

      {/* ── Trust strip ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
        {[
          { icon: "🔒", text: "Secured by Razorpay" },
          { icon: "⚡", text: "Instant activation"  },
          { icon: "↩",  text: "Cancel anytime"      },
        ].map(({ icon, text }) => (
          <div key={text} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10.5, color: "rgba(240,240,248,0.28)", fontWeight: 500 }}>
            <span style={{ fontSize: 10 }}>{icon}</span>{text}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── MAIN MODAL ─────────────────────────────────────────────────────────── */
export function PremiumBillingModal({ reason, onClose, user, usage }) {
  const isMobile = useIsMobile(720);
  const proof    = useSocialProof();

  return (
    <motion.div
      key="pbm-backdrop"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(20px) saturate(1.4)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: isMobile ? "16px 0 0" : 20,
        overflowY: "auto",
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 36 }}
        animate={{ opacity: 1, scale: 1,    y: 0   }}
        exit={{    opacity: 0, scale: 0.94,  y: 12  }}
        transition={{ type: "spring", damping: 22, stiffness: 280, mass: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          display:      "flex",
          flexDirection: isMobile ? "column" : "row",
          width:        "100%",
          maxWidth:     isMobile ? "100%" : 880,
          maxHeight:    isMobile ? "92vh" : "88vh",
          borderRadius: 22,
          overflow:     "hidden",
          border:       "1px solid rgba(124,58,237,0.35)",
          boxShadow:    "0 0 0 1px rgba(124,58,237,0.06), 0 60px 200px rgba(0,0,0,0.98), 0 0 120px rgba(124,58,237,0.08)",
          position:     "relative",
          alignSelf:    isMobile ? "flex-end" : "center",
        }}
      >
        <LeftPanel  isPremium={false} isMobile={isMobile} />
        <RightPanel reason={reason} user={user} usage={usage} onClose={onClose} isMobile={isMobile} />
      </motion.div>

      {/* ── Social proof toast ── */}
      <AnimatePresence>
        {proof.visible && (
          <motion.div
            key={proof.name}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0  }}
            exit={{    opacity: 0, y: 10  }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            style={{
              position:   "fixed",
              bottom:     24,
              left:       "50%",
              transform:  "translateX(-50%)",
              background: "rgba(8,5,25,0.97)",
              border:     "1px solid rgba(74,222,128,0.3)",
              borderRadius: 14, padding: "9px 16px",
              display:    "flex", alignItems: "center", gap: 9,
              whiteSpace: "nowrap",
              boxShadow:  "0 8px 32px rgba(0,0,0,0.75)",
              zIndex:     201,
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", flexShrink: 0, animation: "pulse-dot 1.2s ease-in-out infinite" }} />
            <span style={{ fontSize: 12, color: "rgba(240,240,248,0.65)", fontWeight: 500 }}>
              <strong style={{ color: "#f0f0f8" }}>{proof.name}</strong> just upgraded to Pro
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
