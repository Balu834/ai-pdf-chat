"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { C, timeAgo } from "./tokens";
import { PlusIcon, ShieldIcon, PdfIcon, CrownIcon, ChatNavIcon } from "./icons";
import DragDropUploadZone from "./DragDropUploadZone";

/* ─── WELCOME SCREEN ──────────────────────────────────────────────────────── */
export function WelcomeScreen({
  onUpload, onFileDrop, usage, plan, uploading, uploadProgress, uploadPhase, uploadFileName,
}) {
  const isPro          = plan === "pro";
  const questionsLeft  = Math.max(0, (usage?.maxQuestions ?? 5) - (usage?.questions ?? 0));
  const pdfsLeft       = Math.max(0, (usage?.maxPdfs ?? 3) - (usage?.pdfs ?? 0));
  const pdfLimitHit    = !isPro && pdfsLeft === 0;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", textAlign: "center", minHeight: 0 }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: "100%", maxWidth: 520 }}
      >
        {/* Glow orb */}
        <div style={{ position: "relative", marginBottom: 28 }}>
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 320, height: 180, borderRadius: "50%", background: "radial-gradient(ellipse,rgba(124,58,237,0.15) 0%,transparent 70%)", pointerEvents: "none" }} />
          <h2 style={{ fontSize: 28, fontWeight: 900, color: C.textPrimary, margin: "0 0 12px", letterSpacing: "-0.6px", position: "relative" }}>
            Chat with your{" "}
            <span style={{ background: "linear-gradient(135deg,#c4b5fd,#a78bfa,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              PDFs
            </span>
          </h2>
          <p style={{ fontSize: 14, color: C.textSecondary, maxWidth: 360, margin: "0 auto 22px", lineHeight: 1.7, position: "relative" }}>
            Upload any PDF and get instant AI answers, summaries, and key insights in seconds.
          </p>

          {!isPro && (
            <div style={{ display: "inline-flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
              {[
                { icon: "📄", count: pdfsLeft,      label: "PDFs left",       color: pdfsLeft === 0 ? "#f87171" : pdfsLeft <= 1 ? "#f59e0b" : C.green },
                { icon: "💬", count: questionsLeft, label: "Questions left",  color: questionsLeft === 0 ? "#f87171" : questionsLeft <= 3 ? "#f59e0b" : C.green },
              ].map(({ icon, count, label, color }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 99, fontSize: 12, backdropFilter: "blur(8px)" }}>
                  <span>{icon}</span>
                  <span style={{ fontWeight: 800, color }}>{count === 0 ? "None" : count}</span>
                  <span style={{ color: C.textMuted }}>{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <DragDropUploadZone
          onFile={onFileDrop ?? (() => {})}
          uploading={uploading}
          uploadProgress={uploadProgress}
          uploadPhase={uploadPhase}
          uploadFileName={uploadFileName}
          plan={plan}
          pdfLimitHit={pdfLimitHit}
        />

        {!uploading && !pdfLimitHit && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 14, fontSize: 11, color: C.textMuted }}>
            <ShieldIcon /><span>Your files are private and never shared</span>
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22, duration: 0.4 }}
        className="feature-grid"
        style={{ marginTop: 48, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, maxWidth: 520, width: "100%" }}
      >
        {[
          { icon: "💬", title: "Smart Q&A",        desc: "Ask anything, get precise answers", glow: "rgba(124,58,237,0.12)", border: "rgba(124,58,237,0.2)" },
          { icon: "⚡", title: "Instant Insights",  desc: "AI summarizes key points",          glow: "rgba(6,182,212,0.1)",   border: "rgba(6,182,212,0.2)" },
          { icon: "🔒", title: "100% Private",      desc: "Your data is never sold",           glow: "rgba(74,222,128,0.08)", border: "rgba(74,222,128,0.18)" },
        ].map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.07 }}
            whileHover={{ y: -3, borderColor: f.border, boxShadow: `0 8px 24px ${f.glow}` }}
            style={{ background: `linear-gradient(135deg,${f.glow},rgba(255,255,255,0.02))`, border: "1px solid rgba(255,255,255,0.09)", borderRadius: 16, padding: "16px 14px", textAlign: "left", backdropFilter: "blur(8px)", transition: "border-color 0.2s,box-shadow 0.2s" }}
          >
            <div style={{ fontSize: 22, marginBottom: 9 }}>{f.icon}</div>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.textPrimary, margin: "0 0 4px" }}>{f.title}</p>
            <p style={{ fontSize: 11, color: C.textMuted, margin: 0, lineHeight: 1.55 }}>{f.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

/* ─── EMPTY CHAT STATE ────────────────────────────────────────────────────── */
export function EmptyChatState({ doc, onSend }) {
  const prompts = [
    "What is this document about?",
    "List the main topics",
    "Any important dates or numbers?",
    "Summarize in 3 sentences",
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32 }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", padding: "24px 20px" }}
    >
      <div style={{ width: 54, height: 54, borderRadius: 16, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18, boxShadow: "0 12px 36px rgba(124,58,237,0.42)", fontSize: 20 }}>
        ✦
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: C.textPrimary, margin: "0 0 8px", letterSpacing: "-0.2px" }}>{doc.file_name}</h3>
      <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 24px", maxWidth: 360, lineHeight: 1.65 }}>
        Ready to answer questions. Click a prompt to get started instantly.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 520 }}>
        {prompts.map((q) => (
          <motion.button
            key={q}
            whileHover={{ scale: 1.03, borderColor: "rgba(124,58,237,0.35)" }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSend(q)}
            style={{ padding: "8px 14px", background: C.glass, border: `1px solid ${C.glassBorder}`, borderRadius: 9, fontSize: 12, color: C.textSecondary, cursor: "pointer", backdropFilter: "blur(8px)", transition: "all 0.15s" }}
          >
            {q}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── STAT CARD ───────────────────────────────────────────────────────────── */
function StatCard({ label, value, sub, icon, color, glow, hoverShadow, onClick, badge, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick || undefined}
      whileHover={{ scale: 1.02, boxShadow: hoverShadow, y: -2, transition: { duration: 0.2 } }}
      style={{
        background: `linear-gradient(145deg,${glow},rgba(255,255,255,0.015))`,
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20, padding: "20px 20px",
        backdropFilter: "blur(16px)",
        cursor: onClick ? "pointer" : "default",
        transition: "border-color 0.2s",
        position: "relative", overflow: "hidden",
      }}
    >
      {/* Radial ambient */}
      <div style={{ position: "absolute", top: -40, right: -40, width: 120, height: 120, borderRadius: "50%", background: `radial-gradient(circle,${glow} 0%,transparent 70%)`, pointerEvents: "none" }} />

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14, position: "relative" }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(240,240,248,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", lineHeight: 1.4 }}>{label}</span>
        <div style={{ width: 36, height: 36, borderRadius: 11, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
          {icon}
        </div>
      </div>

      <p style={{ fontSize: 38, fontWeight: 900, color, margin: "0 0 6px", letterSpacing: "-2px", lineHeight: 1, position: "relative" }}>{value}</p>
      <p style={{ fontSize: 11.5, color: "rgba(240,240,248,0.32)", margin: 0, position: "relative" }}>{sub}</p>

      {badge && (
        <div style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 700, color: C.accentLight, background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.22)", padding: "3px 9px", borderRadius: 99 }}>
          {badge}
        </div>
      )}
    </motion.div>
  );
}

/* ─── DASHBOARD HOME VIEW ─────────────────────────────────────────────────── */
export default function DashboardHomeView({
  docs, usage, plan, proExpiresAt, isTrial, trialEnd,
  onUpload, onFileDrop, onSelectDoc, onUpgradeClick, onInvite,
  user, onViewChange, uploading, uploadProgress, uploadPhase, uploadFileName,
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const isPro          = plan === "pro";
  const questionsUsed  = usage?.questions ?? 0;
  const questionsMax   = isPro ? "∞" : (usage?.maxQuestions ?? 5);
  const pdfsUsed       = docs.length;
  const pdfsMax        = isPro ? "∞" : (usage?.maxPdfs ?? 3);
  const questionsLeft  = isPro ? "∞" : Math.max(0, (usage?.maxQuestions ?? 5) - questionsUsed);
  const daysLeft       = isTrial && trialEnd ? Math.max(0, Math.ceil((new Date(trialEnd) - Date.now()) / 86400000)) : null;

  const filteredDocs = searchQuery
    ? docs.filter((d) => d.file_name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 8)
    : docs.slice(0, 6);

  const stats = [
    {
      label: "Total PDFs",
      value: pdfsUsed,
      sub: isPro ? "Unlimited plan" : `${pdfsMax} max on free`,
      icon: "📄",
      color: C.accentLight,
      glow: "rgba(124,58,237,0.16)",
      hoverShadow: "0 0 0 1px rgba(124,58,237,0.28), 0 12px 40px rgba(124,58,237,0.2)",
      onClick: null,
    },
    {
      label: "Questions Used",
      value: questionsUsed,
      sub: isPro ? "Unlimited questions" : `${questionsMax} lifetime`,
      icon: "💬",
      color: C.cyan,
      glow: "rgba(6,182,212,0.14)",
      hoverShadow: "0 0 0 1px rgba(6,182,212,0.28), 0 12px 40px rgba(6,182,212,0.18)",
      onClick: null,
    },
    {
      label: "Questions Left",
      value: questionsLeft,
      sub: isPro ? "Unlimited on Pro" : `of ${questionsMax} total`,
      icon: "⚡",
      color: "#a78bfa",
      glow: "rgba(167,139,250,0.14)",
      hoverShadow: "0 0 0 1px rgba(167,139,250,0.28), 0 12px 40px rgba(167,139,250,0.18)",
      onClick: isPro ? null : onUpgradeClick,
      badge: isPro ? null : "Upgrade for ∞",
    },
    {
      label: "Plan",
      value: isPro ? "Pro" : "Free",
      sub: isPro
        ? (proExpiresAt ? `Renews ${new Date(proExpiresAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}` : "Active")
        : "Upgrade for unlimited",
      icon: isPro ? "👑" : "🔓",
      color: isPro ? C.gold : C.textMuted,
      glow: isPro ? "rgba(245,158,11,0.13)" : "rgba(255,255,255,0.04)",
      hoverShadow: isPro
        ? "0 0 0 1px rgba(245,158,11,0.3), 0 12px 40px rgba(245,158,11,0.16)"
        : "0 0 0 1px rgba(124,58,237,0.28), 0 12px 40px rgba(124,58,237,0.16)",
      onClick: isPro ? null : onUpgradeClick,
      badge: isPro ? null : "Upgrade →",
    },
  ];

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "28px 28px 48px" }}>

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{ marginBottom: 28 }}
      >
        <p style={{ fontSize: 11.5, fontWeight: 700, color: C.textMuted, margin: "0 0 5px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Overview</p>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: C.textPrimary, margin: 0, letterSpacing: "-0.7px", lineHeight: 1.15 }}>
          Welcome back
          {user?.email && (
            <span style={{ background: "linear-gradient(135deg,#c4b5fd,#a78bfa,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginLeft: 8 }}>
              {user.email.split("@")[0]}
            </span>
          )}{" "}👋
        </h1>
      </motion.div>

      {/* ── Trial banner ── */}
      {isTrial && daysLeft !== null && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10,
            padding: "14px 18px", borderRadius: 14, marginBottom: 24,
            background: daysLeft <= 2 ? "rgba(239,68,68,0.07)" : "rgba(6,182,212,0.06)",
            border: `1px solid ${daysLeft <= 2 ? "rgba(239,68,68,0.22)" : "rgba(6,182,212,0.2)"}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>{daysLeft <= 2 ? "⚠️" : "🎁"}</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: daysLeft <= 2 ? "#f87171" : C.cyan, margin: "0 0 2px" }}>
                {daysLeft === 0 ? "Your free trial ends today!" : `Free trial — ${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`}
              </p>
              <p style={{ fontSize: 11, color: C.textMuted, margin: 0 }}>
                Ends {new Date(trialEnd).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={onUpgradeClick}
            style={{ padding: "9px 18px", fontSize: 12, fontWeight: 700, color: "white", background: daysLeft <= 2 ? "linear-gradient(135deg,#ef4444,#dc2626)" : "linear-gradient(135deg,#7c3aed,#06b6d4)", border: "none", borderRadius: 10, cursor: "pointer", whiteSpace: "nowrap" }}
          >
            Upgrade — ₹299/mo →
          </motion.button>
        </motion.div>
      )}

      {/* ── Stats grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28 }} className="stats-grid">
        {stats.map((s, i) => (
          <StatCard key={s.label} {...s} delay={i * 0.07} />
        ))}
      </div>

      {/* ── Referral banner ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        onClick={onInvite}
        whileHover={{ borderColor: "rgba(124,58,237,0.38)", scale: 1.003 }}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10,
          padding: "14px 18px", borderRadius: 14, marginBottom: 26,
          background: "linear-gradient(135deg,rgba(124,58,237,0.07),rgba(79,70,229,0.04))",
          border: "1px solid rgba(124,58,237,0.16)", cursor: "pointer", transition: "all 0.15s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🎁</div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#c4b5fd", margin: "0 0 3px" }}>Invite friends — Earn rewards for every referral</p>
            <p style={{ fontSize: 11.5, color: C.textMuted, margin: 0 }}>
              {usage?.referral_invites
                ? `${usage.referral_invites} friend${usage.referral_invites !== 1 ? "s" : ""} joined via your link`
                : "Share your referral link and earn bonus credits"}
            </p>
          </div>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.accentLight, flexShrink: 0 }}>Invite now →</span>
      </motion.div>

      {/* ── Quick actions ── */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>Quick Actions</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: "0 8px 28px rgba(124,58,237,0.45)", y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={onUpload}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 18px", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", border: "1px solid rgba(124,58,237,0.4)", borderRadius: 12, fontSize: 13, fontWeight: 700, color: "white", cursor: "pointer", boxShadow: "0 4px 18px rgba(124,58,237,0.32)" }}
          >
            <PlusIcon /> Upload New PDF
          </motion.button>

          {docs.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.02, borderColor: "rgba(6,182,212,0.35)" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onViewChange("chat")}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 18px", background: C.glass, border: `1px solid ${C.glassBorder}`, borderRadius: 12, fontSize: 13, fontWeight: 600, color: C.textSecondary, cursor: "pointer", backdropFilter: "blur(8px)", transition: "all 0.15s" }}
            >
              <ChatNavIcon /> Start Chatting
            </motion.button>
          )}

          {!isPro && (
            <motion.button
              whileHover={{ scale: 1.02, borderColor: "rgba(245,158,11,0.4)" }}
              whileTap={{ scale: 0.97 }}
              onClick={onUpgradeClick}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 18px", background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 12, fontSize: 13, fontWeight: 600, color: C.gold, cursor: "pointer", backdropFilter: "blur(8px)", transition: "all 0.15s" }}
            >
              <CrownIcon /> Upgrade to Pro
            </motion.button>
          )}
        </div>
      </div>

      {/* ── Recent PDFs ── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 12, flexWrap: "wrap" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
            Recent PDFs
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {docs.length > 4 && (
              <div style={{ position: "relative" }}>
                <svg width="13" height="13" fill="none" stroke="rgba(240,240,248,0.3)" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24" style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search PDFs…"
                  style={{ paddingLeft: 30, paddingRight: 10, paddingTop: 6, paddingBottom: 6, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 12, color: C.textSecondary, outline: "none", width: 160, fontFamily: "inherit", transition: "border-color 0.15s" }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(124,58,237,0.4)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                />
              </div>
            )}
            {docs.length > 6 && !searchQuery && (
              <button onClick={() => onViewChange("pdfs")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, color: C.accentLight, padding: 0 }}>
                View all →
              </button>
            )}
          </div>
        </div>

        {filteredDocs.length === 0 ? (
          <DragDropUploadZone
            onFile={onFileDrop ?? (() => {})}
            uploading={uploading}
            uploadProgress={uploadProgress}
            uploadPhase={uploadPhase}
            uploadFileName={uploadFileName}
            plan={plan}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <AnimatePresence>
              {filteredDocs.map((doc, i) => (
                <motion.div
                  key={doc.id}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => { onSelectDoc(doc); onViewChange("chat"); }}
                  whileHover={{
                    background: "rgba(124,58,237,0.07)",
                    borderColor: "rgba(124,58,237,0.22)",
                    boxShadow: "0 0 0 1px rgba(124,58,237,0.1), 0 4px 20px rgba(124,58,237,0.1)",
                    x: 2,
                    transition: { duration: 0.18 },
                  }}
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, cursor: "pointer", transition: "border-color 0.18s" }}
                >
                  {/* Icon */}
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,rgba(124,58,237,0.2),rgba(79,70,229,0.14))", border: "1px solid rgba(124,58,237,0.22)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 12px rgba(124,58,237,0.14)" }}>
                    <PdfIcon />
                  </div>

                  {/* Name + time */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13.5, fontWeight: 600, color: C.textPrimary, margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.file_name}</p>
                    <p style={{ fontSize: 11, color: C.textMuted, margin: 0 }}>{timeAgo(doc.created_at)}</p>
                  </div>

                  {/* CTA */}
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: C.accentLight, flexShrink: 0, opacity: 0.7, transition: "opacity 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
                  >
                    Chat
                    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6"/></svg>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {searchQuery && filteredDocs.length === 0 && (
              <div style={{ textAlign: "center", padding: "32px 20px", color: C.textMuted, fontSize: 13 }}>
                No PDFs match &ldquo;{searchQuery}&rdquo;
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
