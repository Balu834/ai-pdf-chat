"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Term definitions ───────────────────────────────────────────────────── */
const TERMS = [
  {
    key:         "terms_of_service",
    icon:        "📋",
    iconBg:      "rgba(99,102,241,0.18)",
    iconBorder:  "rgba(99,102,241,0.32)",
    accentColor: "#818cf8",
    title:       "Terms of Service",
    description: "Usage rules, restrictions, and legal agreements governing your use of Intellixy.",
    href:        "/terms",
    linkLabel:   "Read Terms",
  },
  {
    key:         "privacy_policy",
    icon:        "🔒",
    iconBg:      "rgba(6,182,212,0.15)",
    iconBorder:  "rgba(6,182,212,0.3)",
    accentColor: "#22d3ee",
    title:       "Privacy Policy",
    description: "How we collect, store, and protect your personal data and uploaded documents.",
    href:        "/privacy",
    linkLabel:   "Read Policy",
  },
  {
    key:         "ai_processing_consent",
    icon:        "🤖",
    iconBg:      "rgba(124,58,237,0.18)",
    iconBorder:  "rgba(124,58,237,0.32)",
    accentColor: "#a78bfa",
    title:       "AI Processing Consent",
    description: "Your consent for AI models to read and analyse the content of your uploaded PDFs.",
    href:        "/ai-consent",
    linkLabel:   "Read Consent",
  },
  {
    key:         "content_policy",
    icon:        "⚖️",
    iconBg:      "rgba(245,158,11,0.14)",
    iconBorder:  "rgba(245,158,11,0.28)",
    accentColor: "#fbbf24",
    title:       "Content Policy",
    description: "Rules about permitted document types. No illegal, harmful, or restricted content.",
    href:        "/content-policy",
    linkLabel:   "Read Policy",
  },
];

/* ─── Keyframe injection ─────────────────────────────────────────────────── */
const TAM_CSS = `
  @keyframes tam-spin    { to { transform: rotate(360deg); } }
  @keyframes tam-pop     { 0%{transform:scale(0.7);opacity:0} 60%{transform:scale(1.12)} 100%{transform:scale(1);opacity:1} }
  @keyframes tam-shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
`;
function InjectCSS() {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    const el = document.createElement("style");
    el.textContent = TAM_CSS;
    document.head.appendChild(el);
    done.current = true;
  }, []);
  return null;
}

/* ─── Individual term row ────────────────────────────────────────────────── */
function TermRow({ term, accepted, loading, onAccept, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.06 + index * 0.07, duration: 0.26 }}
      style={{
        display:      "flex",
        alignItems:   "center",
        gap:          14,
        padding:      "14px 16px",
        borderRadius: 14,
        border:       accepted
          ? `1px solid ${term.accentColor}40`
          : "1px solid rgba(255,255,255,0.07)",
        background:   accepted
          ? `${term.accentColor}0a`
          : "rgba(255,255,255,0.025)",
        transition:   "all 0.3s ease",
        position:     "relative",
        overflow:     "hidden",
      }}
    >
      {/* Accepted glow strip */}
      {accepted && (
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
          background: `linear-gradient(180deg, ${term.accentColor}, ${term.accentColor}66)`,
          borderRadius: "14px 0 0 14px",
        }} />
      )}

      {/* Icon */}
      <div style={{
        width: 40, height: 40, borderRadius: 11, flexShrink: 0,
        background: accepted ? `${term.accentColor}22` : term.iconBg,
        border:     `1px solid ${accepted ? term.accentColor + "55" : term.iconBorder}`,
        display:    "flex", alignItems: "center", justifyContent: "center",
        fontSize:   17, transition: "all 0.3s",
      }}>
        {term.icon}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0, fontSize: 13.5, fontWeight: 700,
          color:  accepted ? term.accentColor : "#f0f0f8",
          transition: "color 0.3s",
        }}>
          {term.title}
        </p>
        <p style={{
          margin: "2px 0 0", fontSize: 11.5, lineHeight: 1.55,
          color:  "rgba(240,240,248,0.42)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {term.description}
        </p>
      </div>

      {/* Action area */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
        {accepted ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 14, stiffness: 350 }}
            style={{
              display:    "flex", alignItems: "center", gap: 5,
              padding:    "5px 12px", borderRadius: 99,
              background: `${term.accentColor}18`,
              border:     `1px solid ${term.accentColor}50`,
              fontSize:   11.5, fontWeight: 700, color: term.accentColor,
              animation:  "tam-pop 0.3s ease",
            }}
          >
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="5.5" fill={`${term.accentColor}30`} stroke={term.accentColor} strokeWidth="1"/>
              <path d="M3.5 6l2 2 3-3" stroke={term.accentColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Accepted
          </motion.div>
        ) : (
          <>
            {/* Read link */}
            <a
              href={term.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 11.5, fontWeight: 600, color: "rgba(240,240,248,0.38)",
                textDecoration: "none", padding: "5px 10px", borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.07)",
                background: "rgba(255,255,255,0.03)",
                display: "flex", alignItems: "center", gap: 4,
                transition: "all 0.15s", whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = term.accentColor; e.currentTarget.style.borderColor = term.accentColor + "40"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(240,240,248,0.38)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}
            >
              {term.linkLabel}
              <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2 8L8 2M8 2H4M8 2v4"/>
              </svg>
            </a>

            {/* Accept button */}
            <motion.button
              whileHover={{ scale: loading ? 1 : 1.04 }}
              whileTap={{   scale: loading ? 1 : 0.95 }}
              onClick={onAccept}
              disabled={loading}
              style={{
                padding:    "5px 13px", borderRadius: 8, cursor: loading ? "not-allowed" : "pointer",
                background: term.accentColor + "20",
                border:     `1px solid ${term.accentColor}50`,
                fontSize:   11.5, fontWeight: 700, color: term.accentColor,
                display:    "flex", alignItems: "center", gap: 5,
                transition: "all 0.15s", opacity: loading ? 0.6 : 1,
                whiteSpace: "nowrap",
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: 10, height: 10, borderRadius: "50%",
                    border: `1.5px solid ${term.accentColor}44`,
                    borderTopColor: term.accentColor,
                    animation: "tam-spin 0.7s linear infinite",
                  }} />
                  Saving…
                </>
              ) : (
                <>
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M3 6l2.5 2.5L9 3.5" stroke={term.accentColor} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  I Accept
                </>
              )}
            </motion.button>
          </>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Progress bar ───────────────────────────────────────────────────────── */
function ProgressBar({ count, total }) {
  const pct = Math.round((count / total) * 100);
  const color = count === total ? "#34d399" : count >= 2 ? "#a78bfa" : "#60a5fa";
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: "rgba(240,240,248,0.45)" }}>
          Acceptance progress
        </span>
        <span style={{ fontSize: 12, fontWeight: 800, color }}>
          {count} / {total} accepted
        </span>
      </div>
      <div style={{ height: 5, borderRadius: 99, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          style={{ height: "100%", borderRadius: 99, background: `linear-gradient(90deg, ${color}, ${color}bb)` }}
        />
      </div>
    </div>
  );
}

/* ─── Left panel ─────────────────────────────────────────────────────────── */
function LeftPanel({ acceptedCount, total }) {
  const done = acceptedCount === total;
  return (
    <div style={{
      width:        280, flexShrink: 0,
      background:   "linear-gradient(155deg, #1a0842 0%, #2d1278 45%, #0a0520 100%)",
      borderRadius: "20px 0 0 20px",
      padding:      "40px 30px",
      display:      "flex", flexDirection: "column", gap: 0,
      position:     "relative", overflow: "hidden",
    }}>
      {/* Decorative blobs */}
      <div style={{ position:"absolute", top:-50, right:-50, width:180, height:180, borderRadius:"50%", background:"radial-gradient(circle,rgba(124,58,237,0.3) 0%,transparent 70%)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:-30, left:-30, width:140, height:140, borderRadius:"50%", background:"radial-gradient(circle,rgba(6,182,212,0.1) 0%,transparent 70%)", pointerEvents:"none" }} />

      {/* Logo */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:36 }}>
        <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#7c3aed,#4f46e5)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, boxShadow:"0 4px 16px rgba(124,58,237,0.5)", flexShrink:0 }}>✦</div>
        <div>
          <p style={{ margin:0, fontSize:14, fontWeight:800, color:"#f0f0f8", letterSpacing:"-0.2px" }}>Intellixy</p>
          <p style={{ margin:0, fontSize:9.5, fontWeight:600, color:"rgba(167,139,250,0.65)", letterSpacing:"0.1em", textTransform:"uppercase" }}>AI PDF Platform</p>
        </div>
      </div>

      {/* Shield icon */}
      <motion.div
        animate={{ scale: done ? [1, 1.08, 1] : 1 }}
        transition={{ duration: 0.5 }}
        style={{
          width:        72, height:72, borderRadius:20,
          background:   done ? "rgba(52,211,153,0.15)" : "rgba(124,58,237,0.16)",
          border:       `1.5px solid ${done ? "rgba(52,211,153,0.4)" : "rgba(124,58,237,0.38)"}`,
          display:      "flex", alignItems:"center", justifyContent:"center",
          fontSize:     30, marginBottom:20,
          boxShadow:    done ? "0 0 32px rgba(52,211,153,0.2)" : "0 0 28px rgba(124,58,237,0.18)",
          transition:   "all 0.4s",
        }}
      >
        {done ? "✅" : "🛡️"}
      </motion.div>

      {/* Headline */}
      <h2 style={{ fontSize:20, fontWeight:900, color:"#f0f0f8", margin:"0 0 8px", letterSpacing:"-0.5px", lineHeight:1.22 }}>
        {done ? "All set!" : "One-time\nsetup required"}
      </h2>
      <p style={{ fontSize:12.5, color:"rgba(240,240,248,0.5)", lineHeight:1.7, margin:"0 0 32px" }}>
        {done
          ? "You've accepted all required policies. Click Continue to start using Intellixy."
          : "Please review and accept each policy below. This is required by regulation and only happens once."}
      </p>

      {/* Trust list */}
      <div style={{ display:"flex", flexDirection:"column", gap:11, marginBottom:"auto" }}>
        {[
          { icon:"🔒", text:"End-to-end encrypted storage"   },
          { icon:"🇪🇺", text:"GDPR & AI Act compliant"        },
          { icon:"🗑️", text:"Delete your data anytime"       },
          { icon:"🚫", text:"We never sell your documents"    },
        ].map(({ icon, text }) => (
          <div key={text} style={{ display:"flex", alignItems:"center", gap:9 }}>
            <span style={{ fontSize:13 }}>{icon}</span>
            <span style={{ fontSize:12, color:"rgba(240,240,248,0.5)", fontWeight:500 }}>{text}</span>
          </div>
        ))}
      </div>

      {/* Accept progress mini */}
      <div style={{ marginTop:28, padding:"12px 14px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
          <span style={{ fontSize:10.5, fontWeight:600, color:"rgba(240,240,248,0.35)" }}>Progress</span>
          <span style={{ fontSize:11, fontWeight:800, color: done ? "#34d399" : "#a78bfa" }}>{acceptedCount}/{total}</span>
        </div>
        <div style={{ height:4, borderRadius:99, background:"rgba(255,255,255,0.07)", overflow:"hidden" }}>
          <motion.div
            animate={{ width:`${(acceptedCount/total)*100}%` }}
            transition={{ duration:0.4, ease:"easeOut" }}
            style={{ height:"100%", borderRadius:99, background: done ? "#34d399" : "linear-gradient(90deg,#7c3aed,#a78bfa)" }}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Main modal ─────────────────────────────────────────────────────────── */
export default function TermsAcceptanceModal({ initialStatus = {}, onAccepted }) {
  const [accepted, setAccepted] = useState({
    terms_of_service:      initialStatus.terms_of_service      ?? false,
    privacy_policy:        initialStatus.privacy_policy        ?? false,
    ai_processing_consent: initialStatus.ai_processing_consent ?? false,
    content_policy:        initialStatus.content_policy        ?? false,
  });
  const [loadingKey, setLoadingKey] = useState(null);
  const [error,      setError]      = useState(null);
  const [continuing, setContinuing] = useState(false);
  const [isMobile,   setIsMobile]   = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 720);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const acceptedCount = Object.values(accepted).filter(Boolean).length;
  const total         = TERMS.length;
  const allAccepted   = acceptedCount === total;

  async function handleAccept(key) {
    if (accepted[key] || loadingKey) return;
    setLoadingKey(key);
    setError(null);
    try {
      const res = await fetch("/api/user/terms", {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        body:        JSON.stringify({ [key]: true }),
        credentials: "include",
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Request failed");
      }
      setAccepted((p) => ({ ...p, [key]: true }));
    } catch (err) {
      setError(err.message ?? "Could not save acceptance. Please try again.");
    } finally {
      setLoadingKey(null);
    }
  }

  async function handleContinue() {
    if (!allAccepted || continuing) return;
    setContinuing(true);
    onAccepted?.();
  }

  return (
    <>
      <InjectCSS />

      {/* ── Full-screen backdrop — intentionally non-dismissable ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          position:       "fixed", inset: 0, zIndex: 9000,
          background:     "rgba(2,1,10,0.92)",
          backdropFilter: "blur(22px) saturate(1.3)",
          display:        "flex", alignItems: "center", justifyContent: "center",
          padding:        isMobile ? "0" : 20,
          overflowY:      "auto",
        }}
      >
        {/* ── Modal card ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.90, y: 32 }}
          animate={{ opacity: 1, scale: 1,    y: 0   }}
          transition={{ type: "spring", damping: 22, stiffness: 280, mass: 0.85 }}
          style={{
            display:       "flex",
            flexDirection: isMobile ? "column" : "row",
            width:         "100%",
            maxWidth:      isMobile ? "100%" : 820,
            maxHeight:     isMobile ? "100dvh" : "90vh",
            borderRadius:  isMobile ? 0 : 22,
            overflow:      "hidden",
            border:        "1px solid rgba(124,58,237,0.32)",
            boxShadow:     "0 0 0 1px rgba(124,58,237,0.06), 0 48px 160px rgba(0,0,0,0.98), 0 0 100px rgba(124,58,237,0.08)",
            alignSelf:     isMobile ? "stretch" : "center",
          }}
        >
          {/* ── Left panel (desktop only) ── */}
          {!isMobile && (
            <LeftPanel acceptedCount={acceptedCount} total={total} />
          )}

          {/* ── Right panel ── */}
          <div style={{
            flex:           1, minWidth: 0,
            background:     "rgba(6,4,20,0.98)",
            borderRadius:   isMobile ? 0 : "0 20px 20px 0",
            padding:        isMobile ? "28px 20px 32px" : "38px 34px 34px",
            display:        "flex", flexDirection: "column",
            overflowY:      "auto",
          }}>
            {/* Mobile logo */}
            {isMobile && (
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:24 }}>
                <div style={{ width:32, height:32, borderRadius:9, background:"linear-gradient(135deg,#7c3aed,#4f46e5)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>✦</div>
                <p style={{ margin:0, fontSize:14, fontWeight:800, color:"#f0f0f8" }}>Intellixy</p>
              </div>
            )}

            {/* Heading */}
            <div style={{ marginBottom: 22 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                <h3 style={{ margin:0, fontSize:20, fontWeight:900, color:"#f0f0f8", letterSpacing:"-0.5px" }}>
                  Review & Accept Policies
                </h3>
                <span style={{ fontSize:9.5, fontWeight:800, letterSpacing:"0.06em", color:"#f87171", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.28)", padding:"3px 8px", borderRadius:6 }}>
                  REQUIRED
                </span>
              </div>
              <p style={{ margin:0, fontSize:12.5, color:"rgba(240,240,248,0.42)", lineHeight:1.6 }}>
                Accept all four policies to continue. Click <strong style={{ color:"rgba(240,240,248,0.65)" }}>Read</strong> to review each one, then <strong style={{ color:"rgba(240,240,248,0.65)" }}>I Accept</strong> to confirm.
              </p>
            </div>

            {/* Progress bar */}
            <ProgressBar count={acceptedCount} total={total} />

            {/* Terms list */}
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
              {TERMS.map((term, i) => (
                <TermRow
                  key={term.key}
                  term={term}
                  index={i}
                  accepted={accepted[term.key]}
                  loading={loadingKey === term.key}
                  onAccept={() => handleAccept(term.key)}
                />
              ))}
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                  style={{ marginBottom:14, padding:"10px 14px", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:11, fontSize:12.5, color:"#fca5a5", display:"flex", alignItems:"center", gap:8 }}
                >
                  <span>⚠️</span>
                  <span>{error}</span>
                  <button onClick={() => setError(null)} style={{ marginLeft:"auto", background:"none", border:"none", cursor:"pointer", color:"rgba(252,165,165,0.6)", fontSize:14, lineHeight:1 }}>×</button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* All-accepted success state */}
            <AnimatePresence>
              {allAccepted && (
                <motion.div
                  initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
                  style={{ marginBottom:16, padding:"12px 16px", background:"rgba(52,211,153,0.07)", border:"1px solid rgba(52,211,153,0.28)", borderRadius:12, display:"flex", alignItems:"center", gap:10 }}
                >
                  <span style={{ fontSize:18 }}>🎉</span>
                  <div>
                    <p style={{ margin:0, fontSize:12.5, fontWeight:700, color:"#34d399" }}>All policies accepted!</p>
                    <p style={{ margin:0, fontSize:11, color:"rgba(52,211,153,0.65)" }}>You're all set. Click Continue to start using Intellixy.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Continue button */}
            <motion.button
              whileHover={allAccepted ? { scale: 1.02, boxShadow: "0 16px 48px rgba(52,211,153,0.4)" } : {}}
              whileTap={allAccepted ? { scale: 0.98 } : {}}
              onClick={handleContinue}
              disabled={!allAccepted || continuing}
              style={{
                width:        "100%", padding:"15px 20px",
                borderRadius: 14, border:"none",
                fontSize:     15, fontWeight:800, letterSpacing:"-0.2px",
                cursor:       allAccepted && !continuing ? "pointer" : "not-allowed",
                background:   allAccepted
                  ? "linear-gradient(135deg, #059669 0%, #34d399 50%, #10b981 100%)"
                  : "rgba(255,255,255,0.05)",
                color:        allAccepted ? "white" : "rgba(240,240,248,0.2)",
                boxShadow:    allAccepted ? "0 8px 32px rgba(52,211,153,0.35)" : "none",
                transition:   "all 0.3s ease",
                display:      "flex", alignItems:"center", justifyContent:"center", gap:8,
              }}
            >
              {continuing ? (
                <>
                  <div style={{ width:16, height:16, border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"white", borderRadius:"50%", animation:"tam-spin 0.7s linear infinite" }} />
                  Starting Intellixy…
                </>
              ) : allAccepted ? (
                <>
                  Continue to Intellixy
                  <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2.2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </>
              ) : (
                `Accept all ${total - acceptedCount} remaining ${total - acceptedCount === 1 ? "policy" : "policies"} to continue`
              )}
            </motion.button>

            {/* Footer note */}
            <p style={{ marginTop:14, textAlign:"center", fontSize:10.5, color:"rgba(240,240,248,0.22)", lineHeight:1.55 }}>
              By continuing, you confirm that you have read and agree to all the policies listed above.
              Your acceptance is recorded with a timestamp.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}
