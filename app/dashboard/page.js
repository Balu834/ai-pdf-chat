"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import RazorpayButton from "@/components/RazorpayButton";

/* ─── ICONS ──────────────────────────────────────────────────────────────── */
const PdfIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" style={{ flexShrink: 0 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
    <polyline strokeLinecap="round" strokeLinejoin="round" points="14 2 14 8 20 8"/>
    <line strokeLinecap="round" x1="16" y1="13" x2="8" y2="13"/>
    <line strokeLinecap="round" x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);
const SendIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
const MenuIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);
const PlusIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const UploadIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
    <polyline strokeLinecap="round" strokeLinejoin="round" points="17 8 12 3 7 8"/>
    <line strokeLinecap="round" x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);
const LogoutIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
    <polyline strokeLinecap="round" strokeLinejoin="round" points="16 17 21 12 16 7"/>
    <line strokeLinecap="round" x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const SparkleIcon = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
  </svg>
);
const CopyIcon = () => (
  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <rect x="9" y="9" width="13" height="13" rx="2"/>
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <polyline strokeLinecap="round" strokeLinejoin="round" points="3 6 5 6 21 6"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 11v6M14 11v6"/>
  </svg>
);
const CrownIcon = () => (
  <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2L9 9H2l5.5 4L5 20h14l-2.5-7L22 9h-7z"/>
  </svg>
);
const ShareIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
);
const InsightIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
  </svg>
);
const CompareIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01"/>
  </svg>
);
const CloseIcon = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const MicIcon = ({ active }) => (
  <svg width="15" height="15" fill="none" stroke={active ? "#a78bfa" : "currentColor"} viewBox="0 0 24 24" strokeWidth="2">
    <rect x="9" y="2" width="6" height="11" rx="3"/>
    <path strokeLinecap="round" d="M5 10a7 7 0 0014 0"/>
    <line strokeLinecap="round" x1="12" y1="21" x2="12" y2="17"/>
    <line strokeLinecap="round" x1="9" y1="21" x2="15" y2="21"/>
  </svg>
);
const ShieldIcon = () => (
  <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

/* ─── HELPERS ────────────────────────────────────────────────────────────── */
function timeAgo(ts) {
  if (!ts) return "";
  const diff = (Date.now() - new Date(ts)) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return "Yesterday";
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const SMART_ACTIONS = [
  { label: "✦ Summarize", prompt: "Summarize this document in 3-4 sentences covering the main points." },
  { label: "🧒 ELI5",      prompt: "Explain this document like I'm 5 years old, in simple plain language." },
  { label: "📌 Key Points", prompt: "List the most important key points from this document as bullet points." },
  { label: "⚠️ Risks",     prompt: "Identify any risks, warnings, issues or concerns mentioned in this document." },
  { label: "❓ Questions",  prompt: "Generate 5 insightful questions someone might ask about this document." },
];

/* ─── DESIGN TOKENS ─────────────────────────────────────────────────────── */
const C = {
  bg:           "#07071a",
  sidebar:      "rgba(10,10,28,0.92)",
  glass:        "rgba(255,255,255,0.04)",
  glassBorder:  "rgba(255,255,255,0.08)",
  glassHover:   "rgba(255,255,255,0.07)",
  surface:      "rgba(255,255,255,0.05)",
  surfaceHover: "rgba(255,255,255,0.08)",
  accent:       "#7c3aed",
  accentLight:  "#a78bfa",
  accentGlow:   "rgba(124,58,237,0.4)",
  cyan:         "#06b6d4",
  textPrimary:  "#f0f0f8",
  textSecondary:"rgba(240,240,248,0.6)",
  textMuted:    "rgba(240,240,248,0.3)",
  danger:       "#ef4444",
  dangerSoft:   "rgba(239,68,68,0.1)",
  gold:         "#fbbf24",
  green:        "#4ade80",
};

/* ─── SHIMMER SKELETON ───────────────────────────────────────────────────── */
function Shimmer({ w = "100%", h = 14, r = 8, style = {} }) {
  return (
    <div style={{ width: w, height: h, borderRadius: r, background: "linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.09) 50%,rgba(255,255,255,0.04) 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.6s ease-in-out infinite", ...style }} />
  );
}

function SidebarSkeleton() {
  return (
    <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
      {[1,2,3,4].map((i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 10px", borderRadius: 9 }}>
          <Shimmer w={16} h={16} r={4} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
            <Shimmer h={11} r={5} style={{ width: `${60 + i * 8}%` }} />
            <Shimmer h={9} r={4} style={{ width: "40%" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function MessageSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 740, margin: "0 auto" }}>
      {[false, true, false].map((isUser, i) => (
        <div key={i} style={{ display: "flex", gap: 10, justifyContent: isUser ? "flex-end" : "flex-start" }}>
          {!isUser && <Shimmer w={34} h={34} r={10} />}
          <div style={{ maxWidth: "70%", display: "flex", flexDirection: "column", gap: 5 }}>
            <Shimmer w={isUser ? 160 : 260} h={44} r={isUser ? "18px 18px 4px 18px" : "4px 18px 18px 18px"} />
            {!isUser && <Shimmer w={80} h={9} r={4} />}
          </div>
          {isUser && <Shimmer w={34} h={34} r={10} />}
        </div>
      ))}
    </div>
  );
}

/* ─── UPGRADE POPUP ─────────────────────────────────────────────────────── */
function UpgradePopup({ reason, onClose, user }) {
  const isPdf = reason === "pdf";
  return (
    <motion.div
      key="upgrade-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(16px)" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.86, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 420, background: "rgba(15,12,40,0.96)", border: "1px solid rgba(124,58,237,0.4)", borderRadius: 28, padding: "36px 32px", textAlign: "center", boxShadow: "0 0 0 1px rgba(124,58,237,0.1), 0 40px 120px rgba(0,0,0,0.95), 0 0 100px rgba(124,58,237,0.07)", backdropFilter: "blur(24px)", position: "relative" }}
      >
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "4px 9px", cursor: "pointer", color: C.textMuted, fontSize: 12, lineHeight: 1 }}>✕</button>

        {/* Badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 700, color: "#f87171", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", padding: "4px 12px", borderRadius: 99, marginBottom: 16 }}>
          ⚡ FREE LIMIT REACHED
        </div>

        <div style={{ width: 68, height: 68, borderRadius: 22, background: "linear-gradient(135deg,rgba(124,58,237,0.22),rgba(6,182,212,0.12))", border: "1px solid rgba(124,58,237,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", fontSize: 30 }}>
          {isPdf ? "📄" : "💬"}
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 900, color: C.textPrimary, margin: "0 0 8px", letterSpacing: "-0.4px" }}>
          {isPdf ? "You've used all 5 free PDFs" : "You've used all 10 free questions"}
        </h2>
        <p style={{ fontSize: 13, color: C.textSecondary, margin: "0 0 20px", lineHeight: 1.65 }}>
          {isPdf
            ? "Upgrade to Pro and never worry about limits again."
            : "You're clearly getting value — upgrade to keep going."}
        </p>

        {/* Pro card */}
        <div style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.1),rgba(6,182,212,0.05))", border: "1px solid rgba(124,58,237,0.22)", borderRadius: 18, padding: "18px 16px", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <CrownIcon /><span style={{ fontSize: 12, fontWeight: 800, color: C.gold, letterSpacing: "0.04em" }}>INTELLIXY PRO</span>
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#4ade80", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", padding: "3px 8px", borderRadius: 99 }}>Save 60%</span>
          </div>
          {/* Anchored price */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginBottom: 14 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: C.textMuted, textDecoration: "line-through", paddingBottom: 6 }}>₹499</span>
            <span style={{ fontSize: 38, fontWeight: 900, color: C.textPrimary, lineHeight: 1 }}>₹199</span>
            <span style={{ fontSize: 12, color: C.textMuted, paddingBottom: 5 }}>/mo</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {["Unlimited PDF uploads","Unlimited questions","Delete PDFs anytime","PDF Compare & Insights","Share chat links"].map((f) => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: C.textSecondary }}>
                <span style={{ color: C.green, flexShrink: 0 }}><CheckIcon /></span>{f}
              </div>
            ))}
          </div>
        </div>

        <RazorpayButton user={user} style={{ width: "100%", padding: "15px", background: "linear-gradient(135deg,#7c3aed,#06b6d4)", color: "white", fontSize: 14, fontWeight: 800, border: "none", borderRadius: 14, cursor: "pointer", boxShadow: "0 8px 32px rgba(124,58,237,0.5)", marginBottom: 10, transition: "opacity 0.2s" }}>
          Upgrade Now — ₹199/mo →
        </RazorpayButton>
        <p style={{ fontSize: 11, color: C.textMuted, margin: "0 0 4px", textAlign: "center" }}>
          Most users upgrade in under 2 minutes.
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontSize: 11, color: "rgba(240,240,248,0.22)" }}>
          <ShieldIcon /> Secure · Razorpay · Cancel anytime
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── INLINE UPGRADE BANNER ──────────────────────────────────────────────── */
function UpgradeBanner({ type, onUpgrade }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      style={{ margin: "8px 0", padding: "14px 18px", background: "linear-gradient(135deg,rgba(124,58,237,0.1),rgba(6,182,212,0.06))", border: "1px solid rgba(124,58,237,0.25)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, backdropFilter: "blur(8px)" }}
    >
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, margin: "0 0 2px" }}>
          {type === "question" ? "🔒 Daily limit reached" : "📄 PDF limit reached"}
        </p>
        <p style={{ fontSize: 11, color: C.textMuted, margin: 0 }}>
          {type === "question" ? "Upgrade for unlimited questions (lifetime)" : "Upgrade for unlimited PDF uploads"}
        </p>
      </div>
      <motion.button
        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
        onClick={onUpgrade}
        style={{ padding: "8px 16px", background: "linear-gradient(135deg,#7c3aed,#06b6d4)", color: "white", fontSize: 12, fontWeight: 700, border: "none", borderRadius: 10, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
      >
        Upgrade →
      </motion.button>
    </motion.div>
  );
}

/* ─── WELCOME SCREEN ────────────────────────────────────────────────────── */
function WelcomeScreen({ onUpload, usage, plan }) {
  const questionsLeft = Math.max(0, (usage?.maxQuestions ?? 10) - (usage?.questions ?? 0));
  const pdfsLeft      = Math.max(0, (usage?.maxPdfs ?? 5)       - (usage?.pdfs ?? 0));
  const isPro = plan === "pro";
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", textAlign: "center", minHeight: 0 }}>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.4,0,0.2,1] }}>
        {/* Glowing icon */}
        <div style={{ position: "relative", width: 80, height: 80, margin: "0 auto 28px" }}>
          <div style={{ position: "absolute", inset: -12, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)" }} />
          <div style={{ width: 80, height: 80, borderRadius: 24, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 20px 60px rgba(124,58,237,0.45)", position: "relative" }}>
            <svg width="34" height="34" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline strokeLinecap="round" strokeLinejoin="round" points="14 2 14 8 20 8"/>
            </svg>
          </div>
        </div>

        <h2 style={{ fontSize: 26, fontWeight: 900, color: C.textPrimary, margin: "0 0 10px", letterSpacing: "-0.5px" }}>
          Chat with your PDFs
        </h2>
        <p style={{ fontSize: 14, color: C.textSecondary, maxWidth: 340, margin: "0 auto 24px", lineHeight: 1.7 }}>
          Upload any PDF and get instant AI answers, summaries, and key insights — in seconds.
        </p>

        {/* Free plan remaining — shown before first upload to set expectations */}
        {!isPro && (
          <div style={{ display: "inline-flex", gap: 10, marginBottom: 24, flexWrap: "wrap", justifyContent: "center" }}>
            {[
              { icon: "📄", count: pdfsLeft,      label: "PDFs remaining", color: pdfsLeft === 0 ? "#f87171" : pdfsLeft <= 1 ? "#f59e0b" : "#4ade80" },
              { icon: "💬", count: questionsLeft, label: "Questions remaining", color: questionsLeft === 0 ? "#f87171" : questionsLeft <= 3 ? "#f59e0b" : "#4ade80" },
            ].map(({ icon, count, label, color }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 99, fontSize: 12 }}>
                <span>{icon}</span>
                <span style={{ fontWeight: 800, color }}>{count === 0 ? "None" : count}</span>
                <span style={{ color: C.textMuted }}>{label}</span>
              </div>
            ))}
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.04, boxShadow: "0 20px 60px rgba(124,58,237,0.6)" }}
          whileTap={{ scale: 0.96 }}
          onClick={onUpload}
          style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "14px 28px", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "white", fontWeight: 700, fontSize: 14, border: "none", borderRadius: 14, cursor: "pointer", boxShadow: "0 8px 32px rgba(124,58,237,0.45)" }}
        >
          <UploadIcon /> Upload your first PDF
        </motion.button>

        {/* Trust badge */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 16, fontSize: 11, color: C.textMuted }}>
          <ShieldIcon /><span>Your files are private and never shared</span>
        </div>
      </motion.div>

      {/* Feature cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="feature-grid"
        style={{ marginTop: 48, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, maxWidth: 520, width: "100%" }}
      >
        {[
          { icon: "💬", title: "Smart Q&A", desc: "Ask anything, get precise answers" },
          { icon: "⚡", title: "Instant insights", desc: "AI summarizes key points" },
          { icon: "🔒", title: "100% Private", desc: "Your data is never sold" },
        ].map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 + i * 0.07 }}
            style={{ background: C.glass, border: `1px solid ${C.glassBorder}`, borderRadius: 16, padding: "16px 14px", textAlign: "left", backdropFilter: "blur(8px)" }}
          >
            <div style={{ fontSize: 22, marginBottom: 9 }}>{f.icon}</div>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.textPrimary, margin: "0 0 4px" }}>{f.title}</p>
            <p style={{ fontSize: 11, color: C.textMuted, margin: 0, lineHeight: 1.5 }}>{f.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

/* ─── CHAT MESSAGE ───────────────────────────────────────────────────────── */
function ChatMessage({ msg, onCopy, onShare }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.4,0,0.2,1] }}
      style={{ display: "flex", gap: 10, justifyContent: isUser ? "flex-end" : "flex-start", alignItems: "flex-start" }}
    >
      {!isUser && (
        <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1, boxShadow: "0 4px 18px rgba(124,58,237,0.4)" }}>
          <SparkleIcon />
        </div>
      )}
      <div style={{ maxWidth: "78%", display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{
          padding: isUser ? "11px 16px" : "13px 17px",
          borderRadius: isUser ? "20px 20px 5px 20px" : "5px 20px 20px 20px",
          fontSize: 14, lineHeight: 1.72, whiteSpace: "pre-wrap", wordBreak: "break-word",
          background: isUser
            ? "linear-gradient(135deg,#7c3aed,#6d28d9)"
            : "rgba(255,255,255,0.05)",
          border: isUser ? "none" : "1px solid rgba(255,255,255,0.08)",
          color: isUser ? "white" : "rgba(240,240,248,0.92)",
          boxShadow: isUser ? "0 4px 22px rgba(124,58,237,0.3)" : "none",
          backdropFilter: isUser ? "none" : "blur(8px)",
        }}>
          {msg.content}
          {msg.streaming && (
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.85, repeat: Infinity, ease: "steps(1)" }}
              style={{ display: "inline-block", width: 2, height: "1em", marginLeft: 2, background: C.accentLight, borderRadius: 2, verticalAlign: "text-bottom" }}
            />
          )}
        </div>
        {!isUser && !msg.streaming && msg.content && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, paddingLeft: 4 }}>
            <button
              onClick={() => onCopy(msg.content)}
              style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: C.textMuted, background: "none", border: "none", cursor: "pointer", padding: 0, transition: "color 0.15s" }}
              onMouseEnter={(e) => e.currentTarget.style.color = C.textSecondary}
              onMouseLeave={(e) => e.currentTarget.style.color = C.textMuted}
            >
              <CopyIcon /> Copy
            </button>
            <button
              onClick={() => onShare(msg.content)}
              style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "rgba(167,139,250,0.5)", background: "none", border: "none", cursor: "pointer", padding: 0, transition: "color 0.15s" }}
              onMouseEnter={(e) => e.currentTarget.style.color = C.accentLight}
              onMouseLeave={(e) => e.currentTarget.style.color = "rgba(167,139,250,0.5)"}
            >
              🔗 Share
            </button>
          </div>
        )}
      </div>
      {isUser && (
        <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1, fontSize: 12, fontWeight: 700, color: C.textSecondary }}>
          U
        </div>
      )}
    </motion.div>
  );
}

/* ─── INSIGHTS PANEL ─────────────────────────────────────────────────────── */
function InsightsPanel({ doc, onClose, onAskQuestion, preloaded, preloading }) {
  const [insights, setInsights] = useState(preloaded || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { if (preloaded) setInsights(preloaded); }, [preloaded]);

  useEffect(() => {
    if (!doc) return;
    if (preloaded) { setInsights(preloaded); return; }
    setInsights(null); setError(null);
    fetch(`/api/insights?documentId=${doc.id}`)
      .then((r) => r.json())
      .then((data) => { if (data?.summary) setInsights(data); })
      .catch(() => {});
  }, [doc?.id]);

  async function generateInsights() {
    if (!doc) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/insights", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ documentId: doc.id, fileUrl: doc.file_url }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setInsights(data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <motion.div
      initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }}
      transition={{ duration: 0.26, ease: [0.4,0,0.2,1] }}
      className="right-panel"
      style={{ width: 300, borderLeft: "1px solid rgba(255,255,255,0.06)", background: "rgba(10,10,26,0.9)", backdropFilter: "blur(20px)", display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden" }}
    >
      <div style={{ height: 57, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: C.accentLight }}><InsightIcon /></span>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary }}>AI Insights</span>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: 4 }}>
          <CloseIcon />
        </button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
        {/* Skeleton while preloading */}
        {(loading || preloading) && !insights && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 4 }}>
            <div style={{ background: "rgba(124,58,237,0.07)", border: "1px solid rgba(124,58,237,0.14)", borderRadius: 12, padding: 14 }}>
              <Shimmer h={9} r={5} style={{ width: "35%", marginBottom: 10 }} />
              <Shimmer h={12} r={5} style={{ marginBottom: 6 }} />
              <Shimmer h={12} r={5} style={{ width: "85%", marginBottom: 6 }} />
              <Shimmer h={12} r={5} style={{ width: "70%" }} />
            </div>
            <div style={{ background: C.glass, border: `1px solid ${C.glassBorder}`, borderRadius: 12, padding: 14 }}>
              <Shimmer h={9} r={5} style={{ width: "40%", marginBottom: 12 }} />
              {[0,1,2].map((j) => <div key={j} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}><Shimmer w={13} h={13} r={99} /><Shimmer h={11} r={5} /></div>)}
            </div>
          </div>
        )}

        {!insights && !loading && !preloading && (
          <div style={{ textAlign: "center", paddingTop: 28 }}>
            <div style={{ fontSize: 34, marginBottom: 12 }}>✨</div>
            <p style={{ fontSize: 13, color: C.textSecondary, marginBottom: 18, lineHeight: 1.55 }}>
              Generate AI insights for <strong style={{ color: C.textPrimary }}>{doc?.file_name}</strong>
            </p>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={generateInsights}
              style={{ padding: "11px 20px", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "white", fontSize: 13, fontWeight: 600, border: "none", borderRadius: 10, cursor: "pointer", width: "100%" }}>
              Generate Insights
            </motion.button>
            {error && <p style={{ fontSize: 12, color: "#f87171", marginTop: 10 }}>{error}</p>}
          </div>
        )}

        {insights && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.18)", borderRadius: 12, padding: 14 }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: C.accentLight, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 8px" }}>Summary</p>
              <p style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.65, margin: 0 }}>{insights.summary}</p>
            </div>
            {insights.key_points?.length > 0 && (
              <div style={{ background: C.glass, border: `1px solid ${C.glassBorder}`, borderRadius: 12, padding: 14 }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: C.accentLight, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 10px" }}>Key Points</p>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                  {insights.key_points.map((pt, i) => (
                    <li key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <span style={{ color: C.accent, flexShrink: 0, marginTop: 1 }}><CheckIcon /></span>
                      <span style={{ fontSize: 12, color: C.textSecondary, lineHeight: 1.55 }}>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {insights.suggested_questions?.length > 0 && (
              <div style={{ background: C.glass, border: `1px solid ${C.glassBorder}`, borderRadius: 12, padding: 14 }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: C.accentLight, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 10px" }}>Try asking</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {insights.suggested_questions.map((q, i) => (
                    <motion.button key={i} whileHover={{ scale: 1.01 }} onClick={() => onAskQuestion(q)}
                      style={{ padding: "8px 11px", background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.18)", borderRadius: 8, fontSize: 12, color: C.accentLight, cursor: "pointer", textAlign: "left", lineHeight: 1.4, transition: "all 0.15s" }}>
                      {q}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
            <button onClick={generateInsights} style={{ padding: "8px", background: "transparent", border: `1px solid ${C.glassBorder}`, borderRadius: 8, fontSize: 12, color: C.textMuted, cursor: "pointer" }}>
              Regenerate
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─── COMPARE PANEL ──────────────────────────────────────────────────────── */
function ComparePanel({ docs, onClose }) {
  const [doc1Id, setDoc1Id] = useState(docs[0]?.id || "");
  const [doc2Id, setDoc2Id] = useState(docs[1]?.id || "");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleCompare() {
    if (!doc1Id || !doc2Id) { setError("Select two PDFs."); return; }
    if (doc1Id === doc2Id) { setError("Select two different PDFs."); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch("/api/compare", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ doc1Id, doc2Id }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Comparison failed");
      setResult(data.result);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  const selStyle = { width: "100%", padding: "10px 12px", background: C.glass, border: `1px solid ${C.glassBorder}`, borderRadius: 9, fontSize: 13, color: C.textPrimary, outline: "none", cursor: "pointer" };

  return (
    <motion.div
      initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }}
      transition={{ duration: 0.26, ease: [0.4,0,0.2,1] }}
      className="right-panel"
      style={{ width: 340, borderLeft: "1px solid rgba(255,255,255,0.06)", background: "rgba(10,10,26,0.9)", backdropFilter: "blur(20px)", display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden" }}
    >
      <div style={{ height: 57, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: C.accentLight }}><CompareIcon /></span>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary }}>Compare PDFs</span>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: 4 }}><CloseIcon /></button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
        {docs.length < 2 ? (
          <div style={{ textAlign: "center", paddingTop: 32 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📄</div>
            <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.6 }}>Upload at least <strong style={{ color: C.textPrimary }}>2 PDFs</strong> to compare.</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 10 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, margin: "0 0 6px" }}>Document 1</p>
              <select value={doc1Id} onChange={(e) => { setDoc1Id(e.target.value); setResult(null); setError(null); }} style={selStyle}>
                <option value="" style={{ background: "#0d0d1a" }}>Select PDF…</option>
                {docs.map((d) => <option key={d.id} value={d.id} style={{ background: "#0d0d1a" }}>{d.file_name}</option>)}
              </select>
            </div>
            <div style={{ textAlign: "center", margin: "6px 0", color: C.textMuted, fontSize: 12 }}>vs</div>
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, margin: "0 0 6px" }}>Document 2</p>
              <select value={doc2Id} onChange={(e) => { setDoc2Id(e.target.value); setResult(null); setError(null); }} style={selStyle}>
                <option value="" style={{ background: "#0d0d1a" }}>Select PDF…</option>
                {docs.map((d) => <option key={d.id} value={d.id} style={{ background: "#0d0d1a" }}>{d.file_name}</option>)}
              </select>
            </div>
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={handleCompare} disabled={loading || !doc1Id || !doc2Id}
              style={{ width: "100%", padding: "11px", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "white", fontSize: 13, fontWeight: 600, border: "none", borderRadius: 10, cursor: loading || !doc1Id || !doc2Id ? "not-allowed" : "pointer", opacity: loading || !doc1Id || !doc2Id ? 0.6 : 1, marginBottom: 14 }}>
              {loading ? "Comparing…" : "Compare Documents"}
            </motion.button>
            {loading && <div style={{ textAlign: "center", padding: "12px 0" }}><div style={{ width: 30, height: 30, border: "3px solid rgba(124,58,237,0.22)", borderTopColor: C.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 8px" }} /><p style={{ fontSize: 12, color: C.textMuted }}>Analyzing…</p></div>}
            {error && <div style={{ padding: "10px 12px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: 8, marginBottom: 10 }}><p style={{ fontSize: 12, color: "#f87171", margin: 0 }}>{error}</p></div>}
            {result && (
              <div style={{ background: C.glass, border: `1px solid ${C.glassBorder}`, borderRadius: 12, padding: 16 }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: C.accentLight, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 10px" }}>Comparison Result</p>
                <div style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                  {result.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
                    part.startsWith("**") && part.endsWith("**")
                      ? <strong key={i} style={{ color: C.textPrimary, display: "block", marginTop: i > 0 ? 10 : 0 }}>{part.slice(2,-2)}</strong>
                      : <span key={i}>{part}</span>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

/* ─── HEADER BUTTON ──────────────────────────────────────────────────────── */
function HeaderBtn({ onClick, disabled, active, color = "default", children }) {
  const s = {
    default: { bg: "rgba(255,255,255,0.04)", bd: "rgba(255,255,255,0.08)", cl: "rgba(240,240,248,0.55)", aBg: "rgba(124,58,237,0.16)", aBd: "rgba(124,58,237,0.35)", aCl: "#c4b5fd" },
    purple:  { bg: "rgba(255,255,255,0.04)", bd: "rgba(255,255,255,0.08)", cl: "rgba(240,240,248,0.55)", aBg: "rgba(124,58,237,0.16)", aBd: "rgba(124,58,237,0.35)", aCl: "#c4b5fd" },
    red:     { bg: "rgba(239,68,68,0.06)",   bd: "rgba(239,68,68,0.16)",   cl: "rgba(248,113,113,0.7)",  aBg: "rgba(239,68,68,0.15)",  aBd: "rgba(239,68,68,0.35)",  aCl: "#f87171" },
    green:   { bg: "rgba(34,197,94,0.06)",   bd: "rgba(34,197,94,0.16)",   cl: "rgba(74,222,128,0.7)",   aBg: "rgba(34,197,94,0.14)",  aBd: "rgba(34,197,94,0.32)",  aCl: "#4ade80" },
  }[color] || {};
  return (
    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }} onClick={onClick} disabled={disabled}
      style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 11px", background: active ? s.aBg : s.bg, border: `1px solid ${active ? s.aBd : s.bd}`, borderRadius: 9, fontSize: 12, fontWeight: 600, color: active ? s.aCl : s.cl, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1, backdropFilter: "blur(8px)", transition: "all 0.15s" }}>
      {children}
    </motion.button>
  );
}

/* ─── EMPTY CHAT STATE ───────────────────────────────────────────────────── */
function EmptyChatState({ doc, onSetInput, inputRef }) {
  const prompts = ["What is this document about?", "List the main topics", "Any important dates or numbers?", "Summarize in 3 sentences"];
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32 }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", padding: "24px 20px" }}
    >
      <div style={{ width: 54, height: 54, borderRadius: 16, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18, boxShadow: "0 12px 36px rgba(124,58,237,0.4)" }}>
        <SparkleIcon />
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: C.textPrimary, margin: "0 0 8px", letterSpacing: "-0.2px" }}>{doc.file_name}</h3>
      <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 24px", maxWidth: 360, lineHeight: 1.65 }}>
        Ready to answer questions about this document. Try a prompt or use a smart action above.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 520 }}>
        {prompts.map((q) => (
          <motion.button key={q} whileHover={{ scale: 1.03, borderColor: "rgba(124,58,237,0.35)" }} whileTap={{ scale: 0.97 }}
            onClick={() => { onSetInput(q); inputRef.current?.focus(); }}
            style={{ padding: "8px 14px", background: C.glass, border: `1px solid ${C.glassBorder}`, borderRadius: 9, fontSize: 12, color: C.textSecondary, cursor: "pointer", backdropFilter: "blur(8px)", transition: "all 0.15s" }}>
            {q}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── MAIN DASHBOARD ─────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [docs, setDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [aiStreaming, setAiStreaming] = useState(false);

  const [historyLoading, setHistoryLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [limitError, setLimitError] = useState(null);
  const [plan, setPlan] = useState("free");
  const [subscriptionSource, setSubscriptionSource] = useState(null);
  const [upgradingStripe, setUpgradingStripe] = useState(false);
  const [usage, setUsage] = useState({ pdfs: 0, questions: 0, maxPdfs: 5, maxQuestions: 10, loading: true });

  const [showInsights, setShowInsights] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [showUpgradedToast, setShowUpgradedToast] = useState(false);
  const [upgradePopup, setUpgradePopup] = useState(null);
  const [shareUrl, setShareUrl] = useState(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState(null);
  const recognitionRef = useRef(null);

  const [autoInsights, setAutoInsights] = useState(null);
  const [autoInsightsLoading, setAutoInsightsLoading] = useState(false);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatScrollRef = useRef(null);

  /* ── Auth guard ── */
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { window.location.href = "/login"; }
      else { setUser(user); setLoading(false); fetchDocs(user.id); fetchPlan(user.id); fetchUsage(); }
    });
  }, []);

  /* ── Stripe upgrade toast ── */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgraded") === "1") {
      setShowUpgradedToast(true);
      window.history.replaceState({}, "", "/dashboard");
      setTimeout(() => setShowUpgradedToast(false), 6000);
    }
  }, []);

  async function fetchPlan(userId) {
    try {
      const { data } = await supabase.from("user_plans").select("plan, stripe_subscription_id, razorpay_subscription_id").eq("user_id", userId).maybeSingle();
      if (data?.plan) {
        setPlan(data.plan);
        if (data.plan === "pro") {
          setUsage((p) => ({ ...p, maxPdfs: Infinity, maxQuestions: Infinity }));
          if (data.razorpay_subscription_id) setSubscriptionSource("razorpay");
          else if (data.stripe_subscription_id) setSubscriptionSource("stripe");
        }
      }
    } catch {}
  }

  async function fetchUsage() {
    try {
      const res = await fetch("/api/usage");
      if (!res.ok) return;
      const data = await res.json();
      setUsage({
        pdfs:       data.pdfs?.used      ?? 0,
        questions:  data.questions?.used ?? 0,
        maxPdfs:    data.pdfs?.max       ?? 5,
        maxQuestions: data.questions?.max ?? 10,
        loading: false,
      });
    } catch {
      setUsage((p) => ({ ...p, loading: false }));
    }
  }

  const fetchDocs = useCallback(async (userId) => {
    setDocsLoading(true);
    const { data, error } = await supabase.from("documents").select("id, file_name, file_url, created_at").eq("user_id", userId).order("created_at", { ascending: false });
    if (!error && data) setDocs(data);
    setDocsLoading(false);
  }, []);

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !file.name.endsWith(".pdf")) return;
    setUploading(true);
    try {
      const form = new FormData(); form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) { if (data.limitExceeded) { setUpgradePopup("pdf"); return; } throw new Error(data.error || "Upload failed"); }
      await fetchDocs(user.id); await fetchUsage();
    } catch (err) { alert("Upload failed: " + err.message); }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  }

  async function handleDelete(doc) {
    if (plan !== "pro") { setUpgradePopup("pdf"); return; }
    if (!confirm(`Delete "${doc.file_name}"?`)) return;
    try {
      const res = await fetch("/api/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: doc.id, fileUrl: doc.file_url }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.proRequired) { setUpgradePopup("pdf"); return; }
        throw new Error(data.error || "Delete failed");
      }
      if (selectedDoc?.id === doc.id) { setSelectedDoc(null); setMessages([]); setShowInsights(false); setShowCompare(false); }
      await fetchDocs(user.id);
    } catch (err) { alert("Delete failed: " + err.message); }
  }

  async function selectDoc(doc) {
    setSelectedDoc(doc); setMessages([]); setLimitError(null);
    setSidebarOpen(false); setShowCompare(false); setShareUrl(null); setShowInsights(true);
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/messages?documentId=${doc.id}`);
      if (res.ok) {
        const history = await res.json();
        setMessages(history.map((m) => ({ id: m.id, role: m.role, content: m.message })));
      }
    } catch {}
    finally { setHistoryLoading(false); setTimeout(() => inputRef.current?.focus(), 100); }
  }

  async function handleClearChat() {
    if (!selectedDoc) return;
    if (!confirm(`Clear all chat history for "${selectedDoc.file_name}"?`)) return;
    try {
      await fetch(`/api/messages?documentId=${selectedDoc.id}`, { method: "DELETE" });
      setMessages([]);
    } catch (err) { alert("Could not clear chat: " + err.message); }
  }

  async function handleSend(e, overrideText) {
    e?.preventDefault();
    const text = (overrideText ?? input).trim();
    if (!text || !selectedDoc || aiStreaming) return;
    setInput(""); setLimitError(null);
    const userMsg = { role: "user", content: text, id: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setAiStreaming(true);
    const aiMsgId = Date.now() + 1;
    setMessages((prev) => [...prev, { role: "assistant", content: "", id: aiMsgId, streaming: true }]);
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text, fileUrl: selectedDoc.file_url }) });
      if (!res.ok) {
        const data = await res.json();
        if (data.limitExceeded) { setLimitError(data.error); setMessages((p) => p.filter((m) => m.id !== aiMsgId)); setUpgradePopup("question"); }
        else { setMessages((p) => p.map((m) => m.id === aiMsgId ? { ...m, content: data.error || "Request failed.", streaming: false } : m)); }
        return;
      }
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        setMessages((p) => p.map((m) => m.id === aiMsgId ? { ...m, content: "```json\n" + JSON.stringify(data.data, null, 2) + "\n```", streaming: false } : m));
        return;
      }
      const reader = res.body.getReader(); const decoder = new TextDecoder(); let buffer = ""; let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n"); buffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]" || payload === "[ERROR]") break;
          full += payload.replace(/\\n/g, "\n");
          setMessages((p) => p.map((m) => m.id === aiMsgId ? { ...m, content: full } : m));
        }
      }
      setMessages((p) => p.map((m) => m.id === aiMsgId ? { ...m, streaming: false } : m));
    } catch {
      setMessages((p) => p.map((m) => m.id === aiMsgId ? { ...m, content: "Something went wrong. Please try again.", streaming: false } : m));
    } finally {
      setAiStreaming(false);
      if (user) fetchUsage();
    }
  }

  function handleSmartAction(prompt) { if (!selectedDoc || aiStreaming) return; handleSend(null, prompt); }

  async function handleUpgrade() {
    setUpgradingStripe(true);
    try { const res = await fetch("/api/stripe/checkout", { method: "POST" }); const data = await res.json(); if (data.url) window.location.href = data.url; else alert(data.error || "Checkout failed"); }
    catch { alert("Checkout failed"); } finally { setUpgradingStripe(false); }
  }

  async function handleManageSubscription() {
    setUpgradingStripe(true);
    try { const res = await fetch("/api/stripe/portal", { method: "POST" }); const data = await res.json(); if (data.url) window.location.href = data.url; else alert(data.error || "Could not open portal"); }
    catch { alert("Could not open portal"); } finally { setUpgradingStripe(false); }
  }

  async function handleSignOut() { await supabase.auth.signOut(); window.location.href = "/login"; }

  function copyText(text) { navigator.clipboard.writeText(text).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); }

  function shareAnswer(text) {
    const t = `${text.slice(0, 280)}${text.length > 280 ? "…" : ""}\n\n— via Intellixy`;
    if (navigator.share) { navigator.share({ text: t, url: window.location.href }).catch(() => {}); }
    else { navigator.clipboard.writeText(t).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  }

  async function handleShareChat() {
    if (!selectedDoc || shareLoading) return;
    setShareLoading(true);
    try {
      const res = await fetch("/api/share", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ documentId: selectedDoc.id }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setShareUrl(data.url);
    } catch (err) { alert("Share failed: " + err.message); }
    finally { setShareLoading(false); }
  }

  function copyShareUrl() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).catch(() => {});
    setShareCopied(true); setTimeout(() => setShareCopied(false), 2500);
  }

  /* ── Smart auto-scroll ── */
  useEffect(() => {
    const container = chatScrollRef.current;
    if (!container) return;
    const nearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;
    const lastMsg = messages[messages.length - 1];
    if (nearBottom || (lastMsg && !lastMsg.streaming)) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  function handleKeyDown(e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }

  /* ── Voice input ── */
  function toggleVoice() {
    setVoiceError(null);
    const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SR) { setVoiceError("Voice input not supported in this browser."); return; }
    if (listening) { recognitionRef.current?.stop(); setListening(false); return; }
    const rec = new SR();
    rec.lang = "en-US"; rec.interimResults = true; rec.continuous = false;
    recognitionRef.current = rec;
    rec.onstart = () => setListening(true);
    rec.onresult = (e) => { const t = Array.from(e.results).map((r) => r[0].transcript).join(""); setInput(t); };
    rec.onerror = (e) => { setVoiceError("Mic error: " + e.error); setListening(false); };
    rec.onend = () => setListening(false);
    rec.start();
  }

  /* ── Auto-load insights on doc select ── */
  useEffect(() => {
    if (!selectedDoc) { setAutoInsights(null); return; }
    setAutoInsights(null); setAutoInsightsLoading(true);
    fetch(`/api/insights?documentId=${selectedDoc.id}`)
      .then((r) => r.json())
      .then((data) => { if (data?.summary) setAutoInsights(data); })
      .catch(() => {})
      .finally(() => setAutoInsightsLoading(false));
  }, [selectedDoc?.id]);

  /* ── Loading spinner ── */
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 42, height: 42, border: "3px solid rgba(124,58,237,0.18)", borderTopColor: C.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ fontSize: 13, color: C.textMuted }}>Loading…</p>
        </div>
      </div>
    );
  }

  const userEmail = user?.email || "";
  const userInitial = userEmail.charAt(0).toUpperCase();
  const rightPanelOpen = (showInsights && !!selectedDoc) || showCompare;
  const pdfLimitHit = plan !== "pro" && usage.pdfs >= usage.maxPdfs;
  const qLimitHit = plan !== "pro" && usage.questions >= usage.maxQuestions;

  return (
    <div style={{ display: "flex", height: "100vh", background: C.bg, overflow: "hidden", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" }}>

      {/* ── Ambient background glow ── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-20%", left: "-10%", width: "50%", height: "50%", borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "-10%", right: "-10%", width: "40%", height: "40%", borderRadius: "50%", background: "radial-gradient(circle, rgba(6,182,212,0.05) 0%, transparent 70%)" }} />
      </div>

      {/* ── Mobile sidebar backdrop ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }} />
        )}
      </AnimatePresence>

      {/* ── SIDEBAR ── */}
      <aside className="sidebar" style={{ width: 260, background: C.sidebar, backdropFilter: "blur(24px)", borderRight: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", flexShrink: 0, position: "relative", zIndex: 1 }}>

        {/* Logo row */}
        <div style={{ height: 58, display: "flex", alignItems: "center", gap: 10, padding: "0 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg,#7c3aed,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(124,58,237,0.5)", flexShrink: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 900, color: "white" }}>I</span>
          </div>
          <span style={{ fontSize: 16, fontWeight: 800, color: C.textPrimary, letterSpacing: "-0.3px" }}>Intellixy</span>
          {plan === "pro" && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, fontWeight: 700, color: C.gold, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", padding: "3px 8px", borderRadius: 99, marginLeft: "auto" }}>
              <CrownIcon /> PRO
            </span>
          )}
        </div>

        {/* Upload button */}
        <div style={{ padding: "12px 12px 8px", flexShrink: 0 }}>
          <motion.button
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
            onClick={() => pdfLimitHit ? setUpgradePopup("pdf") : fileInputRef.current?.click()}
            disabled={uploading}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "10px 14px", fontSize: 13, fontWeight: 600, color: "white", background: pdfLimitHit ? "rgba(239,68,68,0.1)" : "linear-gradient(135deg,rgba(124,58,237,0.7),rgba(79,70,229,0.7))", border: pdfLimitHit ? "1px solid rgba(239,68,68,0.22)" : "1px solid rgba(124,58,237,0.3)", borderRadius: 10, cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.7 : 1, backdropFilter: "blur(8px)" }}
          >
            {uploading
              ? <><div style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> Uploading…</>
              : pdfLimitHit ? <><span>🔒</span> PDF limit reached</>
              : <><PlusIcon /> New PDF</>
            }
          </motion.button>
          <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleUpload} style={{ display: "none" }} />
        </div>

        {/* PDF list with skeleton */}
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 8px" }}>
          {docsLoading ? (
            <SidebarSkeleton />
          ) : docs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 16px" }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>📂</div>
              <p style={{ fontSize: 12, color: C.textMuted, margin: "0 0 4px" }}>No PDFs yet</p>
              <p style={{ fontSize: 11, color: "rgba(240,240,248,0.15)", margin: 0 }}>Upload one to get started</p>
            </div>
          ) : (
            docs.map((doc) => {
              const isSel = selectedDoc?.id === doc.id;
              return (
                <motion.div key={doc.id} layout onClick={() => selectDoc(doc)}
                  style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "9px 10px", borderRadius: 9, cursor: "pointer", marginBottom: 2, background: isSel ? "rgba(124,58,237,0.14)" : "transparent", border: isSel ? "1px solid rgba(124,58,237,0.24)" : "1px solid transparent", transition: "all 0.15s", backdropFilter: isSel ? "blur(8px)" : "none" }}
                  whileHover={{ backgroundColor: isSel ? undefined : "rgba(255,255,255,0.04)" }}
                >
                  <span style={{ color: isSel ? C.accentLight : C.textMuted, marginTop: 1 }}><PdfIcon /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 500, color: isSel ? "#e2d9f7" : C.textSecondary, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.file_name}</p>
                    <p style={{ fontSize: 10, color: C.textMuted, margin: "2px 0 0" }}>{timeAgo(doc.created_at)}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(doc); }}
                    title={plan !== "pro" ? "Pro feature — upgrade to delete" : `Delete ${doc.file_name}`}
                    style={{ background: "none", border: "none", cursor: "pointer", color: plan !== "pro" ? C.textMuted : C.danger, padding: 2, borderRadius: 5, opacity: 0, transition: "opacity 0.15s", fontSize: plan !== "pro" ? 11 : undefined }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = "0"}>
                    {plan !== "pro" ? "🔒" : <TrashIcon />}
                  </button>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Usage bars */}
        {plan !== "pro" && (
          <div style={{ margin: "0 10px 8px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 12, backdropFilter: "blur(8px)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>Free Plan Usage</p>
              <span style={{ fontSize: 9, color: C.textMuted }}>lifetime</span>
            </div>
            {[{ label: "PDFs", used: usage.pdfs, max: usage.maxPdfs }, { label: "Questions", used: usage.questions, max: usage.maxQuestions }].map(({ label, used, max }) => {
              const remaining = Math.max(0, max - used);
              const pct = Math.min((used / max) * 100, 100);
              const isOut = used >= max;
              const isLow = !isOut && pct >= 70;
              return (
                <div key={label} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: C.textMuted }}>{label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: isOut ? "#f87171" : isLow ? "#f59e0b" : C.green }}>
                      {isOut ? "Limit reached" : `${remaining} left`}
                    </span>
                  </div>
                  <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 99, overflow: "hidden" }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, ease: "easeOut" }}
                      style={{ height: "100%", borderRadius: 99, background: isOut ? "linear-gradient(90deg,#ef4444,#dc2626)" : isLow ? "linear-gradient(90deg,#f59e0b,#d97706)" : "linear-gradient(90deg,#7c3aed,#4f46e5)" }} />
                  </div>
                  {isOut && (
                    <p style={{ fontSize: 10, color: "#f87171", margin: "4px 0 0", lineHeight: 1.4 }}>
                      Upgrade to Pro for unlimited {label.toLowerCase()}
                    </p>
                  )}
                  {isLow && !isOut && (
                    <p style={{ fontSize: 10, color: "#f59e0b", margin: "4px 0 0", lineHeight: 1.4 }}>
                      Almost used up — upgrade before you run out
                    </p>
                  )}
                </div>
              );
            })}
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => setUpgradePopup("pdf")}
              style={{ width: "100%", padding: "8px", marginTop: 2, fontSize: 11, fontWeight: 700, color: C.gold, background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, cursor: "pointer" }}
            >
              ✦ Get unlimited access — ₹199/mo
            </motion.button>
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: 10, flexShrink: 0 }}>
          {plan !== "pro" ? (
            <RazorpayButton user={user} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px", fontSize: 12, fontWeight: 700, color: C.gold, background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 9, cursor: "pointer", marginBottom: 8, backdropFilter: "blur(8px)" }}>
              <CrownIcon /> Upgrade to Pro · ₹199/mo
            </RazorpayButton>
          ) : (
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginBottom: 6 }}>
                <CrownIcon /><span style={{ fontSize: 11, fontWeight: 700, color: C.gold }}>Pro Plan Active</span>
              </div>
              {subscriptionSource === "razorpay" ? (
                <a href="https://dashboard.razorpay.com/subscriptions" target="_blank" rel="noopener noreferrer" style={{ display: "block", width: "100%", padding: "7px", fontSize: 11, fontWeight: 600, color: C.textMuted, background: "transparent", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, textAlign: "center", textDecoration: "none", boxSizing: "border-box" }}>Manage Subscription ↗</a>
              ) : (
                <button onClick={handleManageSubscription} disabled={upgradingStripe} style={{ width: "100%", padding: "7px", fontSize: 11, fontWeight: 600, color: C.textMuted, background: "transparent", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, cursor: upgradingStripe ? "not-allowed" : "pointer", opacity: upgradingStripe ? 0.6 : 1 }}>
                  {upgradingStripe ? "Loading…" : "Manage Subscription"}
                </button>
              )}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px" }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "white", flexShrink: 0 }}>{userInitial}</div>
            <p style={{ fontSize: 11, color: C.textMuted, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>{userEmail}</p>
            <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={handleSignOut} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: 4, borderRadius: 6 }}>
              <LogoutIcon />
            </motion.button>
          </div>
        </div>
      </aside>

      {/* ── MAIN WRAPPER ── */}
      <div className="main-wrapper" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative", zIndex: 1 }}>

        {/* ── GLASS HEADER ── */}
        <header style={{ height: 58, display: "flex", alignItems: "center", gap: 10, padding: "0 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0, background: "rgba(7,7,26,0.8)", backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 10 }}>
          <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} onClick={() => setSidebarOpen(true)} className="menu-btn" style={{ background: "none", border: "none", cursor: "pointer", color: C.textSecondary, padding: 6, borderRadius: 8, flexShrink: 0 }}>
            <MenuIcon />
          </motion.button>

          {selectedDoc ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
              <span style={{ color: C.accentLight, flexShrink: 0 }}><PdfIcon /></span>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedDoc.file_name}</span>
            </div>
          ) : (
            <span style={{ fontSize: 14, fontWeight: 500, color: C.textMuted, flex: 1 }}>Select a PDF to start chatting</span>
          )}

          <div className="header-actions" style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            {selectedDoc && (
              <>
                {messages.length > 0 && (
                  <HeaderBtn onClick={handleClearChat} color="red">
                    <TrashIcon /><span className="btn-text"> Clear</span>
                  </HeaderBtn>
                )}
                <HeaderBtn onClick={handleShareChat} disabled={shareLoading} active={!!shareUrl} color={shareUrl ? "green" : "default"}>
                  {shareLoading
                    ? <><div style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /><span className="btn-text"> Sharing…</span></>
                    : <><ShareIcon /><span className="btn-text"> Share</span></>
                  }
                </HeaderBtn>
                <HeaderBtn onClick={() => { setShowInsights(!showInsights); setShowCompare(false); }} active={showInsights} color="purple">
                  <InsightIcon /><span className="btn-text"> Insights</span>
                </HeaderBtn>
              </>
            )}
            {docs.length >= 2 && (
              <HeaderBtn onClick={() => { setShowCompare(!showCompare); setShowInsights(false); }} active={showCompare} color="purple">
                <CompareIcon /><span className="btn-text"> Compare</span>
              </HeaderBtn>
            )}
          </div>
        </header>

        {/* ── CONTENT ROW ── */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

          {/* ── CHAT COLUMN ── */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

            {/* Smart action chips */}
            <AnimatePresence>
              {selectedDoc && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="smart-bar"
                  style={{ padding: "10px 16px 6px", display: "flex", gap: 6, flexWrap: "wrap", flexShrink: 0, borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(7,7,26,0.5)", backdropFilter: "blur(12px)" }}
                >
                  {SMART_ACTIONS.map((action, i) => (
                    <motion.button key={action.label}
                      initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.04 }}
                      whileHover={{ scale: 1.04, backgroundColor: "rgba(124,58,237,0.14)", borderColor: "rgba(124,58,237,0.32)" }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSmartAction(action.prompt)} disabled={aiStreaming}
                      style={{ padding: "5px 12px", background: C.glass, border: `1px solid ${C.glassBorder}`, borderRadius: 99, fontSize: 12, fontWeight: 500, color: C.textSecondary, cursor: aiStreaming ? "not-allowed" : "pointer", opacity: aiStreaming ? 0.45 : 1, whiteSpace: "nowrap", backdropFilter: "blur(8px)", transition: "all 0.15s" }}>
                      {action.label}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <div ref={chatScrollRef} style={{ flex: 1, overflowY: "auto", padding: "20px 16px 8px" }}>
              {!selectedDoc ? (
                <WelcomeScreen onUpload={() => fileInputRef.current?.click()} usage={usage} plan={plan} />
              ) : historyLoading ? (
                <div style={{ maxWidth: 740, margin: "0 auto", paddingTop: 16 }}><MessageSkeleton /></div>
              ) : messages.length === 0 ? (
                <EmptyChatState doc={selectedDoc} onSetInput={setInput} inputRef={inputRef} />
              ) : (
                <div style={{ maxWidth: 740, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18, paddingBottom: 8 }}>
                  {messages.map((msg) => (
                    <ChatMessage key={msg.id} msg={msg} onCopy={copyText} onShare={shareAnswer} />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* ── STICKY INPUT AREA ── */}
            <div className="input-area" style={{ padding: "8px 16px 14px", flexShrink: 0, background: "rgba(7,7,26,0.88)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.05)", position: "sticky", bottom: 0, zIndex: 5 }}>
              {!selectedDoc ? (
                /* No PDF selected — nudge */
                <div style={{ maxWidth: 740, margin: "0 auto", padding: "12px 16px", background: C.glass, border: `1px solid ${C.glassBorder}`, borderRadius: 14, display: "flex", alignItems: "center", gap: 10, backdropFilter: "blur(8px)" }}>
                  <span style={{ fontSize: 16 }}>👈</span>
                  <p style={{ fontSize: 13, color: C.textMuted, margin: 0 }}>Select a PDF from the sidebar to start chatting</p>
                </div>
              ) : qLimitHit ? (
                /* Question limit — inline upgrade */
                <div style={{ maxWidth: 740, margin: "0 auto" }}>
                  <UpgradeBanner type="question" onUpgrade={() => setUpgradePopup("question")} />
                </div>
              ) : (
                /* Input form */
                <form
                  onSubmit={handleSend}
                  style={{ maxWidth: 740, margin: "0 auto" }}
                >
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 8, background: C.glass, border: "1px solid rgba(255,255,255,0.09)", borderRadius: 18, padding: "11px 13px", backdropFilter: "blur(12px)", transition: "border-color 0.2s, box-shadow 0.2s", boxShadow: "0 4px 24px rgba(0,0,0,0.35)" }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.45)"; e.currentTarget.style.boxShadow = "0 4px 32px rgba(124,58,237,0.12)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.35)"; }}
                  >
                    <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
                      placeholder={`Ask about ${selectedDoc.file_name}…`} disabled={aiStreaming} rows={1} suppressHydrationWarning
                      style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 14, color: C.textPrimary, resize: "none", lineHeight: 1.6, maxHeight: 120, minHeight: 22, fontFamily: "inherit" }}
                      onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
                    />
                    {/* Mic */}
                    <motion.button type="button" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} onClick={toggleVoice} title={listening ? "Stop" : "Voice input"}
                      style={{ width: 36, height: 36, borderRadius: 10, background: listening ? "rgba(124,58,237,0.18)" : "rgba(255,255,255,0.04)", border: listening ? "1px solid rgba(124,58,237,0.42)" : "1px solid rgba(255,255,255,0.08)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: listening ? C.accentLight : C.textMuted, transition: "all 0.2s", position: "relative" }}>
                      <MicIcon active={listening} />
                      {listening && <span style={{ position: "absolute", top: 7, right: 7, width: 6, height: 6, borderRadius: "50%", background: "#ef4444", animation: "pulseDot 1.2s ease-in-out infinite" }} />}
                    </motion.button>
                    {/* Send */}
                    <motion.button type="submit" disabled={!input.trim() || aiStreaming}
                      whileHover={input.trim() && !aiStreaming ? { scale: 1.08 } : {}}
                      whileTap={input.trim() && !aiStreaming ? { scale: 0.92 } : {}}
                      style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", border: "none", cursor: !input.trim() || aiStreaming ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: !input.trim() || aiStreaming ? 0.38 : 1, transition: "opacity 0.2s", color: "white", boxShadow: input.trim() && !aiStreaming ? "0 4px 16px rgba(124,58,237,0.55)" : "none" }}>
                      {aiStreaming
                        ? <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                        : <SendIcon />
                      }
                    </motion.button>
                  </div>

                  {/* Status lines */}
                  {voiceError && <p style={{ textAlign: "center", fontSize: 11, color: "#f87171", marginTop: 5 }}>{voiceError}</p>}
                  {listening && <p style={{ textAlign: "center", fontSize: 11, color: C.accentLight, marginTop: 5 }}>🎙 Listening… speak now</p>}
                </form>
              )}

              {/* Trust indicator */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 8, fontSize: 10, color: "rgba(240,240,248,0.18)" }}>
                <ShieldIcon />
                <span>End-to-end encrypted · Your data is never sold · Delete anytime</span>
              </div>
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <AnimatePresence>
            {rightPanelOpen && showInsights && selectedDoc && (
              <InsightsPanel key="insights" doc={selectedDoc} onClose={() => setShowInsights(false)}
                onAskQuestion={(q) => { setShowInsights(false); setTimeout(() => handleSend(null, q), 100); }}
                preloaded={autoInsights} preloading={autoInsightsLoading} />
            )}
            {rightPanelOpen && showCompare && (
              <ComparePanel key="compare" docs={docs} onClose={() => setShowCompare(false)} />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── UPGRADE POPUP ── */}
      <AnimatePresence>
        {upgradePopup && <UpgradePopup key="upgrade" reason={upgradePopup} onClose={() => setUpgradePopup(null)} user={user} />}
      </AnimatePresence>

      {/* ── SHARE MODAL ── */}
      <AnimatePresence>
        {shareUrl && (
          <motion.div key="share-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShareUrl(null)}
            style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(16px)" }}
          >
            <motion.div initial={{ opacity: 0, scale: 0.86, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92 }}
              transition={{ type: "spring", damping: 22, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              style={{ width: "100%", maxWidth: 460, background: "rgba(13,12,34,0.96)", border: "1px solid rgba(124,58,237,0.28)", borderRadius: 24, padding: 28, backdropFilter: "blur(24px)", boxShadow: "0 40px 120px rgba(0,0,0,0.95)", position: "relative" }}
            >
              <button onClick={() => setShareUrl(null)} style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, padding: "4px 9px", cursor: "pointer", color: C.textMuted, fontSize: 12 }}>✕</button>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,rgba(124,58,237,0.18),rgba(34,197,94,0.1))", border: "1px solid rgba(124,58,237,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                  <ShareIcon />
                </div>
                <p style={{ fontSize: 17, fontWeight: 800, color: C.textPrimary, margin: "0 0 4px" }}>Your share link is ready!</p>
                <p style={{ fontSize: 13, color: C.textMuted, margin: 0 }}>Anyone with this link can view this chat — read only</p>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14 }}>
                <div style={{ flex: 1, padding: "10px 13px", background: C.glass, border: `1px solid ${C.glassBorder}`, borderRadius: 9, fontSize: 12, color: C.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{shareUrl}</div>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={copyShareUrl}
                  style={{ padding: "10px 16px", background: shareCopied ? "rgba(34,197,94,0.16)" : "linear-gradient(135deg,#7c3aed,#4f46e5)", border: shareCopied ? "1px solid rgba(34,197,94,0.3)" : "none", borderRadius: 9, fontSize: 12, fontWeight: 700, color: shareCopied ? C.green : "white", cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap" }}>
                  {shareCopied ? "✓ Copied!" : "Copy link"}
                </motion.button>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <motion.button whileHover={{ opacity: 0.8 }} onClick={() => { const t = encodeURIComponent(`Check out this AI PDF chat: ${shareUrl}`); window.open(`https://wa.me/?text=${t}`, "_blank"); }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "9px 12px", background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.2)", borderRadius: 9, fontSize: 12, fontWeight: 600, color: C.green, cursor: "pointer" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </motion.button>
                <motion.button whileHover={{ opacity: 0.8 }} onClick={() => { const t = encodeURIComponent("Check out this AI PDF chat on Intellixy 🤖📄"); const u = encodeURIComponent(shareUrl); window.open(`https://twitter.com/intent/tweet?text=${t}&url=${u}`, "_blank"); }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "9px 12px", background: C.glass, border: `1px solid ${C.glassBorder}`, borderRadius: 9, fontSize: 12, fontWeight: 600, color: C.textSecondary, cursor: "pointer" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  Share on X
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── COPY TOAST ── */}
      <AnimatePresence>
        {copied && (
          <motion.div key="copy-toast"
            initial={{ opacity: 0, y: 14, scale: 0.93 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8 }}
            style={{ position: "fixed", bottom: 24, right: 24, padding: "10px 18px", background: "rgba(20,18,48,0.95)", border: "1px solid rgba(255,255,255,0.1)", color: C.textPrimary, fontSize: 13, borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", zIndex: 100, backdropFilter: "blur(12px)" }}>
            Copied to clipboard ✓
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── UPGRADED TOAST ── */}
      <AnimatePresence>
        {showUpgradedToast && (
          <motion.div key="pro-toast"
            initial={{ opacity: 0, y: 24, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 14 }}
            transition={{ type: "spring", damping: 20, stiffness: 260 }}
            style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", padding: "14px 22px", background: "rgba(10,26,16,0.95)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 14, boxShadow: "0 8px 36px rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "center", gap: 12, whiteSpace: "nowrap", backdropFilter: "blur(16px)" }}
          >
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(34,197,94,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <CheckIcon />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, margin: 0 }}>Welcome to Pro! 🎉</p>
              <p style={{ fontSize: 11, color: C.textMuted, margin: "2px 0 0" }}>Unlimited PDFs and questions — forever.</p>
            </div>
            <motion.button whileHover={{ scale: 1.15 }} onClick={() => setShowUpgradedToast(false)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: 4, marginLeft: 4, flexShrink: 0 }}>
              <CloseIcon />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin     { to { transform: rotate(360deg); } }
        @keyframes shimmer  { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes pulseDot { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.4; transform:scale(0.7); } }

        /* Desktop: sidebar inline */
        @media (min-width: 769px) {
          .sidebar    { position: relative !important; transform: none !important; z-index: auto !important; }
          .menu-btn   { display: none !important; }
        }

        /* Mobile */
        @media (max-width: 768px) {
          .sidebar     { position: fixed; top: 0; left: 0; bottom: 0; z-index: 50; transform: ${sidebarOpen ? "translateX(0)" : "translateX(-100%)"}; transition: transform 0.3s cubic-bezier(0.4,0,0.2,1); }
          .main-wrapper{ margin-left: 0 !important; }
          .menu-btn    { display: flex !important; align-items: center; }
          .header-actions .btn-text { display: none; }
          .smart-bar   { overflow-x: auto; flex-wrap: nowrap !important; padding-bottom: 8px; -webkit-overflow-scrolling: touch; }
          .smart-bar::-webkit-scrollbar { display: none; }
          .feature-grid{ grid-template-columns: 1fr !important; max-width: 100% !important; }
          .right-panel { position: fixed !important; inset: 0 !important; width: 100% !important; z-index: 50 !important; border-left: none !important; }
          .input-area  { position: sticky; bottom: 0; }
        }

        textarea::placeholder { color: rgba(240,240,248,0.25); }
        textarea { scrollbar-width: none; }
        textarea::-webkit-scrollbar { display: none; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.25); border-radius: 99px; }
      `}</style>
    </div>
  );
}
