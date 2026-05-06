"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { C, timeAgo } from "./tokens";
import {
  PlusIcon, LogoutIcon, TrashIcon, CrownIcon, PdfIcon,
  HomeIcon, FilesIcon, ChatNavIcon, BillingNavIcon, SettingsNavIcon, TeamNavIcon, GiftIcon,
  BotIcon, ZapIcon, ShopIcon, CreatorIcon,
} from "./icons";
import { SidebarSkeleton } from "./Shimmer";

const NAV_GROUPS = [
  {
    label: "Core",
    items: [
      { id: "dashboard",   label: "Dashboard",   Icon: HomeIcon },
      { id: "pdfs",        label: "My PDFs",     Icon: FilesIcon },
      { id: "chat",        label: "Chat",        Icon: ChatNavIcon },
    ],
  },
  {
    label: "AI Tools",
    items: [
      { id: "agents",      label: "AI Agents",   Icon: BotIcon },
      { id: "workflows",   label: "Workflows",   Icon: ZapIcon },
    ],
  },
  {
    label: "Platform",
    items: [
      { id: "marketplace", label: "Marketplace", Icon: ShopIcon },
      { id: "creator",     label: "Creator",     Icon: CreatorIcon },
      { id: "team",        label: "Team",        Icon: TeamNavIcon },
    ],
  },
  {
    label: "Account",
    items: [
      { id: "billing",     label: "Billing",     Icon: BillingNavIcon },
      { id: "settings",    label: "Settings",    Icon: SettingsNavIcon },
    ],
  },
];

const PencilIcon = () => (
  <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
  </svg>
);

const ChatBubbleIcon = () => (
  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
  </svg>
);

export default function Sidebar({
  user, plan, docs, docsLoading, selectedDoc, view, usage, uploading,
  sessions, sessionsLoading, activeSession,
  onViewChange, onSignOut, onSelectDoc, onDelete, onUploadClick, onUpgradeClick,
  onNewChat, onSelectSession, onDeleteSession, onRenameSession, onInvite,
}) {
  const userEmail   = user?.email || "";
  const userInitial = userEmail.charAt(0).toUpperCase();
  const userName    = userEmail.split("@")[0];
  const isPro       = plan === "pro";
  const pdfLimitHit = !isPro && usage.pdfs >= usage.maxPdfs;
  const [sessionsExpanded, setSessionsExpanded] = useState(true);
  const [hoveredSession,   setHoveredSession]   = useState(null);

  return (
    <aside className="sidebar" style={{
      width: 252,
      background: "linear-gradient(180deg,rgba(9,9,24,0.99) 0%,rgba(6,6,18,0.99) 100%)",
      backdropFilter: "blur(24px)",
      borderRight: "1px solid rgba(255,255,255,0.06)",
      display: "flex", flexDirection: "column", flexShrink: 0,
      position: "relative", zIndex: 1,
    }}>

      {/* Ambient top glow */}
      <div style={{ position: "absolute", top: -80, left: -40, width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,58,237,0.12) 0%,transparent 70%)", pointerEvents: "none" }} />

      {/* ── Logo ── */}
      <div style={{
        height: 62, display: "flex", alignItems: "center", gap: 11, padding: "0 16px",
        borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 11,
          background: "linear-gradient(135deg,#7c3aed 0%,#4f46e5 55%,#06b6d4 100%)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          boxShadow: "0 0 0 1px rgba(124,58,237,0.4), 0 4px 24px rgba(124,58,237,0.55), 0 0 48px rgba(124,58,237,0.18)",
        }}>
          <span style={{ fontSize: 15, fontWeight: 900, color: "white", letterSpacing: "-0.5px" }}>I</span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.textPrimary, letterSpacing: "-0.4px", lineHeight: 1.15 }}>
            Intellixy
          </div>
          <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: "0.06em", marginTop: 1, color: isPro ? C.gold : "rgba(240,240,248,0.28)" }}>
            {isPro ? "PRO PLAN" : "AI PLATFORM"}
          </div>
        </div>

        {isPro && (
          <div style={{
            width: 26, height: 26, borderRadius: 8,
            background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.22)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <CrownIcon />
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav style={{ padding: "10px 8px 4px", flexShrink: 0 }}>
        {NAV_GROUPS.map((group) => (
          <div key={group.label} style={{ marginBottom: 2 }}>
            <div style={{
              fontSize: 9, fontWeight: 700, letterSpacing: "0.12em",
              textTransform: "uppercase", color: "rgba(240,240,248,0.18)",
              padding: "5px 10px 3px",
            }}>
              {group.label}
            </div>
            {group.items.map(({ id, label, Icon }) => {
              const isActive = view === id;
              return (
                <motion.button
                  key={id}
                  onClick={() => onViewChange(id)}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 9,
                    padding: "8px 10px", marginBottom: 1, borderRadius: 9,
                    fontSize: 13, fontWeight: isActive ? 600 : 450,
                    color: isActive ? "#c4b5fd" : "rgba(240,240,248,0.42)",
                    background: isActive ? "rgba(124,58,237,0.15)" : "transparent",
                    border: isActive ? "1px solid rgba(124,58,237,0.22)" : "1px solid transparent",
                    cursor: "pointer", textAlign: "left",
                    transition: "color 0.14s,background 0.14s,border-color 0.14s",
                    boxShadow: isActive
                      ? "inset 3px 0 0 0 rgba(124,58,237,0.85), 0 2px 16px rgba(124,58,237,0.1)"
                      : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = "rgba(240,240,248,0.72)";
                      e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = "rgba(240,240,248,0.42)";
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <span style={{ color: isActive ? C.accentLight : "rgba(240,240,248,0.32)", flexShrink: 0, transition: "color 0.14s" }}>
                    <Icon />
                  </span>
                  {label}
                  {id === "chat" && activeSession && (
                    <span style={{ marginLeft: "auto", width: 7, height: 7, borderRadius: "50%", background: C.green, boxShadow: "0 0 8px rgba(74,222,128,0.65)", flexShrink: 0 }} />
                  )}
                </motion.button>
              );
            })}
          </div>
        ))}
      </nav>

      <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "4px 12px 8px" }} />

      {/* ── Upload button ── */}
      <div style={{ padding: "0 8px 8px", flexShrink: 0 }}>
        <motion.button
          whileHover={{ scale: 1.01, boxShadow: pdfLimitHit ? "none" : "0 8px 28px rgba(124,58,237,0.42)" }}
          whileTap={{ scale: 0.97 }}
          onClick={pdfLimitHit ? onUpgradeClick : onUploadClick}
          disabled={uploading}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            padding: "10px 14px", fontSize: 12.5, fontWeight: 700, color: "white",
            background: pdfLimitHit ? "rgba(239,68,68,0.1)" : "linear-gradient(135deg,#7c3aed 0%,#4f46e5 60%,#6366f1 100%)",
            border: pdfLimitHit ? "1px solid rgba(239,68,68,0.22)" : "1px solid rgba(124,58,237,0.35)",
            borderRadius: 10, cursor: uploading ? "not-allowed" : "pointer",
            opacity: uploading ? 0.7 : 1,
            boxShadow: pdfLimitHit ? "none" : "0 4px 20px rgba(124,58,237,0.3)",
            position: "relative", overflow: "hidden",
          }}
        >
          {!pdfLimitHit && !uploading && (
            <motion.div
              animate={{ x: ["-100%", "210%"] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
              style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.16),transparent)", transform: "skewX(-20deg)", pointerEvents: "none" }}
            />
          )}
          {uploading ? (
            <><div style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> Uploading…</>
          ) : pdfLimitHit ? (
            <><span>🔒</span> PDF limit reached</>
          ) : (
            <><PlusIcon /> Upload PDF</>
          )}
        </motion.button>
      </div>

      {/* ── Scrollable: PDFs + Sessions ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 4px", display: "flex", flexDirection: "column" }}>

        <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(240,240,248,0.18)", textTransform: "uppercase", letterSpacing: "0.12em", padding: "4px 6px 6px" }}>
          Recent PDFs
        </div>

        {docsLoading ? (
          <SidebarSkeleton />
        ) : docs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px 12px" }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(124,58,237,0.07)", border: "1px solid rgba(124,58,237,0.14)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", fontSize: 18 }}>📂</div>
            <p style={{ fontSize: 11, color: C.textMuted, margin: 0, lineHeight: 1.6 }}>No PDFs yet<br/>Upload one to get started</p>
          </div>
        ) : (
          docs.map((doc) => {
            const isSel = selectedDoc?.id === doc.id;
            return (
              <motion.div
                key={doc.id}
                layout
                onClick={() => onSelectDoc(doc)}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 10px",
                  borderRadius: 9, cursor: "pointer", marginBottom: 1,
                  background: isSel ? "rgba(124,58,237,0.14)" : "transparent",
                  border: isSel ? "1px solid rgba(124,58,237,0.22)" : "1px solid transparent",
                  boxShadow: isSel ? "inset 3px 0 0 0 rgba(124,58,237,0.75)" : "none",
                  transition: "all 0.14s",
                }}
                onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: isSel ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${isSel ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.07)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ color: isSel ? C.accentLight : "rgba(240,240,248,0.32)" }}><PdfIcon /></span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: isSel ? "#e2d9f7" : "rgba(240,240,248,0.58)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {doc.file_name}
                  </p>
                  <p style={{ fontSize: 10, color: C.textMuted, margin: "2px 0 0" }}>{timeAgo(doc.created_at)}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(doc); }}
                  title={plan !== "pro" ? "Pro feature" : "Delete"}
                  style={{ background: "none", border: "none", cursor: "pointer", color: plan !== "pro" ? C.textMuted : C.danger, padding: 2, borderRadius: 5, opacity: 0, transition: "opacity 0.14s", fontSize: plan !== "pro" ? 11 : undefined, flexShrink: 0 }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
                >
                  {plan !== "pro" ? "🔒" : <TrashIcon />}
                </button>
              </motion.div>
            );
          })
        )}

        {/* ── Chat Sessions ── */}
        <AnimatePresence>
          {selectedDoc && (
            <motion.div
              key="sessions"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: "hidden", marginTop: 6 }}
            >
              <div style={{ height: 1, background: "rgba(255,255,255,0.05)", marginBottom: 8 }} />
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, padding: "0 4px" }}>
                <button
                  onClick={() => setSessionsExpanded((v) => !v)}
                  style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", padding: 0, flex: 1, minWidth: 0 }}
                >
                  <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(240,240,248,0.18)", textTransform: "uppercase", letterSpacing: "0.12em", flex: 1, textAlign: "left" }}>Chats</span>
                  <svg width="10" height="10" fill="none" stroke={C.textMuted} viewBox="0 0 24 24" strokeWidth="2.5"
                    style={{ transform: sessionsExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0 }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                <motion.button
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={onNewChat} title="New chat"
                  style={{ width: 22, height: 22, borderRadius: 6, background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.22)", cursor: "pointer", color: C.accentLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                >
                  <PlusIcon />
                </motion.button>
              </div>

              <AnimatePresence>
                {sessionsExpanded && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
                    {sessionsLoading ? (
                      <div style={{ padding: "8px 10px", display: "flex", gap: 8, alignItems: "center" }}>
                        <div style={{ width: 12, height: 12, border: "2px solid rgba(124,58,237,0.2)", borderTopColor: C.accentLight, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                        <span style={{ fontSize: 11, color: C.textMuted }}>Loading…</span>
                      </div>
                    ) : !sessions?.length ? (
                      <p style={{ fontSize: 11, color: C.textMuted, margin: 0, padding: "6px 10px 4px" }}>No chats yet — start asking!</p>
                    ) : (
                      sessions.map((session) => {
                        const isActive = activeSession?.id === session.id;
                        return (
                          <motion.div
                            key={session.id}
                            layout
                            onClick={() => onSelectSession(session)}
                            onMouseEnter={() => setHoveredSession(session.id)}
                            onMouseLeave={() => setHoveredSession(null)}
                            style={{
                              display: "flex", alignItems: "center", gap: 7, padding: "7px 10px",
                              borderRadius: 9, cursor: "pointer", marginBottom: 1,
                              background: isActive ? "rgba(124,58,237,0.13)" : hoveredSession === session.id ? "rgba(255,255,255,0.04)" : "transparent",
                              border: isActive ? "1px solid rgba(124,58,237,0.22)" : "1px solid transparent",
                              transition: "all 0.14s",
                            }}
                          >
                            <span style={{ color: isActive ? C.accentLight : C.textMuted, flexShrink: 0 }}><ChatBubbleIcon /></span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 12, fontWeight: isActive ? 600 : 400, color: isActive ? "#e2d9f7" : C.textSecondary, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {session.title}
                              </p>
                              <p style={{ fontSize: 10, color: C.textMuted, margin: "1px 0 0" }}>{timeAgo(session.updated_at)}</p>
                            </div>
                            <div style={{ display: "flex", gap: 2, opacity: hoveredSession === session.id ? 1 : 0, transition: "opacity 0.14s" }}>
                              <button onClick={(e) => { e.stopPropagation(); onRenameSession(session); }} title="Rename"
                                style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: 2, borderRadius: 4 }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = C.accentLight)}
                                onMouseLeave={(e) => (e.currentTarget.style.color = C.textMuted)}
                              ><PencilIcon /></button>
                              <button onClick={(e) => { e.stopPropagation(); onDeleteSession(session); }} title="Delete"
                                style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: 2, borderRadius: 4 }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = C.danger)}
                                onMouseLeave={(e) => (e.currentTarget.style.color = C.textMuted)}
                              ><TrashIcon /></button>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Usage meter — free users only ── */}
      {!isPro && (
        <div style={{ margin: "0 8px 8px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "10px 12px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
            <span style={{ fontSize: 9.5, fontWeight: 700, color: "rgba(240,240,248,0.22)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Free Plan Usage</span>
            <button onClick={onUpgradeClick} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, fontWeight: 700, color: C.accentLight, padding: 0 }}>Upgrade →</button>
          </div>
          {[
            { label: "PDFs",      used: usage.pdfs,      max: usage.maxPdfs },
            { label: "Questions", used: usage.questions,  max: usage.maxQuestions },
          ].map(({ label, used, max }) => {
            const pct    = Math.min((used / max) * 100, 100);
            const isOut  = used >= max;
            const isHigh = !isOut && pct >= 60;
            const color  = isOut ? "#ef4444" : isHigh ? "#f59e0b" : "#7c3aed";
            const txt    = isOut ? "#f87171" : isHigh ? "#f59e0b" : C.textMuted;
            return (
              <div key={label} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: txt, fontWeight: isOut || isHigh ? 700 : 400 }}>{label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: txt }}>{used}/{max}</span>
                </div>
                <div style={{ height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 99, overflow: "hidden" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    style={{ height: "100%", borderRadius: 99, background: `linear-gradient(90deg,${color},${color}cc)` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Invite & Earn ── */}
      <div style={{ padding: "0 8px 6px", flexShrink: 0 }}>
        <motion.button
          whileHover={{ borderColor: "rgba(124,58,237,0.4)", background: "rgba(124,58,237,0.1)" }}
          whileTap={{ scale: 0.97 }}
          onClick={onInvite}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.16)", borderRadius: 10, cursor: "pointer", transition: "all 0.15s" }}
        >
          <GiftIcon />
          <div style={{ flex: 1, textAlign: "left" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#c4b5fd", margin: 0 }}>Invite & Earn</p>
            <p style={{ fontSize: 10, color: C.textMuted, margin: 0 }}>+50 credits per referral</p>
          </div>
          <span style={{ fontSize: 9, fontWeight: 700, color: C.green, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.18)", padding: "2px 6px", borderRadius: 99 }}>FREE</span>
        </motion.button>
      </div>

      {/* ── Footer: Upgrade + Profile ── */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "8px 8px 10px", flexShrink: 0 }}>
        {!isPro && (
          <motion.button
            whileHover={{ scale: 1.01, boxShadow: "0 8px 36px rgba(124,58,237,0.48)" }}
            whileTap={{ scale: 0.98 }}
            onClick={onUpgradeClick}
            style={{
              width: "100%", padding: "11px 14px", marginBottom: 8,
              background: "linear-gradient(135deg,#7c3aed 0%,#4f46e5 50%,#06b6d4 100%)",
              border: "none", borderRadius: 10, cursor: "pointer",
              position: "relative", overflow: "hidden",
              boxShadow: "0 4px 24px rgba(124,58,237,0.38)",
            }}
          >
            <motion.div
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "linear", repeatDelay: 1.5 }}
              style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)", transform: "skewX(-15deg)", pointerEvents: "none" }}
            />
            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
              <CrownIcon />
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: "white", letterSpacing: "-0.2px" }}>Upgrade to Pro</div>
                <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.65)", marginTop: 1 }}>₹299/month · Unlimited everything</div>
              </div>
            </div>
          </motion.button>
        )}

        {/* Profile card */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 9px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "white", flexShrink: 0, boxShadow: "0 4px 12px rgba(124,58,237,0.42)" }}>
            {userInitial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userName}</p>
            <p style={{ fontSize: 10, color: C.textMuted, margin: 0 }}>{isPro ? "Pro Plan" : "Free Plan"}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={onSignOut}
            style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: 4, borderRadius: 6, transition: "color 0.14s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = C.danger)}
            onMouseLeave={(e) => (e.currentTarget.style.color = C.textMuted)}
          >
            <LogoutIcon />
          </motion.button>
        </div>
      </div>
    </aside>
  );
}
