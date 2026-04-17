"use client";

import { motion } from "framer-motion";
import { C, timeAgo } from "./tokens";
import { PlusIcon, UploadIcon, ShieldIcon, PdfIcon, CrownIcon, ChatNavIcon } from "./icons";

/* ─── WELCOME SCREEN ────────────────────────────────────────────────────── */
export function WelcomeScreen({ onUpload, usage, plan }) {
  const questionsLeft = Math.max(0, (usage?.maxQuestions ?? 5) - (usage?.questions ?? 0));
  const pdfsLeft      = Math.max(0, (usage?.maxPdfs ?? 3)      - (usage?.pdfs ?? 0));
  const isPro = plan === "pro";
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", textAlign: "center", minHeight: 0 }}>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.4,0,0.2,1] }}>
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

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 16, fontSize: 11, color: C.textMuted }}>
          <ShieldIcon /><span>Your files are private and never shared</span>
        </div>
      </motion.div>

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

/* ─── EMPTY CHAT STATE ───────────────────────────────────────────────────── */
export function EmptyChatState({ doc, onSetInput, inputRef }) {
  const prompts = ["What is this document about?", "List the main topics", "Any important dates or numbers?", "Summarize in 3 sentences"];
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32 }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", padding: "24px 20px" }}
    >
      <div style={{ width: 54, height: 54, borderRadius: 16, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18, boxShadow: "0 12px 36px rgba(124,58,237,0.4)" }}>
        ✦
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

/* ─── DASHBOARD HOME VIEW ────────────────────────────────────────────────── */
export default function DashboardHomeView({ docs, usage, plan, proExpiresAt, isTrial, trialEnd, onUpload, onSelectDoc, onUpgradeClick, user, onViewChange }) {
  const isPro = plan === "pro";
  const questionsUsed = usage?.questions ?? 0;
  const questionsMax  = isPro ? "∞" : (usage?.maxQuestions ?? 5);
  const pdfsUsed      = docs.length;
  const pdfsMax       = isPro ? "∞" : (usage?.maxPdfs ?? 3);
  const daysLeft      = isTrial && trialEnd ? Math.max(0, Math.ceil((new Date(trialEnd) - Date.now()) / 86400000)) : null;
  const recentDocs    = [...docs].slice(0, 5);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "28px 28px 40px" }}>
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Overview</p>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: C.textPrimary, margin: 0, letterSpacing: "-0.5px" }}>
          Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""} 👋
        </h1>
      </div>

      {isTrial && daysLeft !== null && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, padding: "14px 18px", borderRadius: 14, marginBottom: 22, background: daysLeft <= 2 ? "rgba(239,68,68,0.08)" : "rgba(6,182,212,0.07)", border: `1px solid ${daysLeft <= 2 ? "rgba(239,68,68,0.25)" : "rgba(6,182,212,0.22)"}` }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>{daysLeft <= 2 ? "⚠️" : "🎁"}</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: daysLeft <= 2 ? "#f87171" : "#06b6d4", margin: "0 0 2px" }}>
                {daysLeft === 0 ? "Your free trial ends today!" : `Free trial — ${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`}
              </p>
              <p style={{ fontSize: 11, color: C.textMuted, margin: 0 }}>
                Ends {new Date(trialEnd).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onUpgradeClick}
            style={{ padding: "9px 18px", fontSize: 12, fontWeight: 700, color: "white", background: daysLeft <= 2 ? "linear-gradient(135deg,#ef4444,#dc2626)" : "linear-gradient(135deg,#7c3aed,#06b6d4)", border: "none", borderRadius: 10, cursor: "pointer", whiteSpace: "nowrap" }}>
            Upgrade — ₹299/mo →
          </motion.button>
        </motion.div>
      )}

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 28 }} className="stats-grid">
        {[
          { label: "Total PDFs", value: pdfsUsed, sub: isPro ? "Unlimited plan" : `${pdfsMax} max on free`, icon: "📄", color: C.accentLight, glow: "rgba(124,58,237,0.12)" },
          { label: "Questions Used", value: questionsUsed, sub: isPro ? "Unlimited questions" : `${questionsMax} lifetime`, icon: "💬", color: "#06b6d4", glow: "rgba(6,182,212,0.1)" },
          { label: "Plan", value: isPro ? "Pro" : "Free", sub: isPro ? (proExpiresAt ? `Renews ${new Date(proExpiresAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}` : "Active") : "Upgrade for unlimited", icon: isPro ? "👑" : "🔓", color: isPro ? C.gold : C.textMuted, glow: isPro ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.03)" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.35 }}
            style={{ background: `linear-gradient(135deg,${stat.glow},rgba(255,255,255,0.02))`, border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "18px 18px", backdropFilter: "blur(12px)" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{stat.label}</span>
              <span style={{ fontSize: 20 }}>{stat.icon}</span>
            </div>
            <p style={{ fontSize: 30, fontWeight: 900, color: stat.color, margin: "0 0 4px", letterSpacing: "-1px", lineHeight: 1 }}>{stat.value}</p>
            <p style={{ fontSize: 11, color: C.textMuted, margin: 0 }}>{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>Quick Actions</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={onUpload}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 18px", background: "linear-gradient(135deg,rgba(124,58,237,0.6),rgba(79,70,229,0.5))", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 12, fontSize: 13, fontWeight: 600, color: "white", cursor: "pointer", backdropFilter: "blur(8px)" }}>
            <PlusIcon /> Upload New PDF
          </motion.button>
          {docs.length > 0 && (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => onViewChange("chat")}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 18px", background: C.glass, border: `1px solid ${C.glassBorder}`, borderRadius: 12, fontSize: 13, fontWeight: 600, color: C.textSecondary, cursor: "pointer", backdropFilter: "blur(8px)" }}>
              <ChatNavIcon /> Start Chatting
            </motion.button>
          )}
          {!isPro && (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={onUpgradeClick}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 18px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 12, fontSize: 13, fontWeight: 600, color: C.gold, cursor: "pointer", backdropFilter: "blur(8px)" }}>
              <CrownIcon /> Upgrade to Pro
            </motion.button>
          )}
        </div>
      </div>

      {/* Recent PDFs */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>Recent PDFs</p>
          {docs.length > 5 && (
            <button onClick={() => onViewChange("pdfs")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, color: C.accentLight }}>View all →</button>
          )}
        </div>
        {recentDocs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 20px", background: C.glass, border: `1px solid ${C.glassBorder}`, borderRadius: 16 }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📂</div>
            <p style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary, margin: "0 0 4px" }}>No PDFs yet</p>
            <p style={{ fontSize: 12, color: C.textMuted, margin: "0 0 16px" }}>Upload your first PDF to get started</p>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onUpload}
              style={{ padding: "9px 18px", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "white", fontSize: 12, fontWeight: 700, border: "none", borderRadius: 10, cursor: "pointer" }}>
              Upload PDF →
            </motion.button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {recentDocs.map((doc, i) => (
              <motion.div key={doc.id}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => { onSelectDoc(doc); onViewChange("chat"); }}
                whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, cursor: "pointer", transition: "all 0.15s" }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,rgba(124,58,237,0.2),rgba(79,70,229,0.15))", border: "1px solid rgba(124,58,237,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <PdfIcon />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.file_name}</p>
                  <p style={{ fontSize: 11, color: C.textMuted, margin: 0 }}>{timeAgo(doc.created_at)}</p>
                </div>
                <span style={{ fontSize: 11, color: C.accentLight, flexShrink: 0, fontWeight: 600 }}>Chat →</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
