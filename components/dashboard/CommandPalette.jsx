"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { C } from "./tokens";

/* ── Icons ──────────────────────────────────────────────────────────────── */
function Icon({ d, size = 15 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  dashboard: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z",
  pdfs:      "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z",
  chat:      "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
  billing:   "M12 2a10 10 0 100 20A10 10 0 0012 2zm0 6v4l3 3",
  settings:  "M12 15a3 3 0 100-6 3 3 0 000 6zm7.22-1.93a7 7 0 00.14-1.07 7 7 0 00-.14-1.07l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46a.5.5 0 00-.61-.22l-2.49 1a7.37 7.37 0 00-1.83-1.06l-.38-2.65C13.95 2.11 13.5 2 13 2h-2c-.5 0-.95.11-1.13.43l-.38 2.65A7.37 7.37 0 007.66 6.14l-2.49-1a.5.5 0 00-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65A7.13 7.13 0 004.65 12a7.13 7.13 0 00.14 1.07l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46a.5.5 0 00.61.22l2.49-1a7.37 7.37 0 001.83 1.06l.38 2.65C9.05 21.89 9.5 22 10 22h2c.5 0 .95-.11 1.13-.43l.38-2.65a7.37 7.37 0 001.83-1.06l2.49 1a.5.5 0 00.61-.22l2-3.46c.13-.22.07-.49-.12-.64l-2.1-1.65z",
  upload:    "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12",
  newchat:   "M12 5v14M5 12h14",
  clear:     "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
  share:     "M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13",
  insights:  "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  compare:   "M18 4H6M18 20H6M16 12H8",
  signout:   "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  agents:    "M12 2a2 2 0 012 2v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 000 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 00-4 0v1a1 1 0 01-1 1H5a1 1 0 01-1-1v-3a1 1 0 011-1h1a2 2 0 000-4H5a1 1 0 01-1-1V7a1 1 0 011-1h3a1 1 0 001-1V4a2 2 0 012-2z",
  workflows: "M22 12h-4l-3 9L9 3l-3 9H2",
  team:      "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M9 7a4 4 0 100 8 4 4 0 000-8z",
};

/* ── Command definitions ────────────────────────────────────────────────── */
function buildCommands({ docs, view, selectedDoc, plan, onViewChange, onUpload, onSelectDoc, onNewChat, onClearChat, onShare, onInsights, onCompare, onUpgrade, onSignOut }) {
  const navItems = [
    { id: "nav-dashboard",  category: "Navigate",  label: "Go to Dashboard",     icon: ICONS.dashboard,  kbd: null, action: () => onViewChange("dashboard") },
    { id: "nav-pdfs",       category: "Navigate",  label: "My PDFs",              icon: ICONS.pdfs,       kbd: null, action: () => onViewChange("pdfs") },
    { id: "nav-chat",       category: "Navigate",  label: "Chat",                 icon: ICONS.chat,       kbd: null, action: () => onViewChange("chat") },
    { id: "nav-agents",     category: "Navigate",  label: "AI Agents",            icon: ICONS.agents,     kbd: null, action: () => onViewChange("agents") },
    { id: "nav-workflows",  category: "Navigate",  label: "Workflows",            icon: ICONS.workflows,  kbd: null, action: () => onViewChange("workflows") },
    { id: "nav-team",       category: "Navigate",  label: "Team",                 icon: ICONS.team,       kbd: null, action: () => onViewChange("team") },
    { id: "nav-billing",    category: "Navigate",  label: "Billing & Plan",       icon: ICONS.billing,    kbd: null, action: () => onViewChange("billing") },
    { id: "nav-settings",   category: "Navigate",  label: "Settings",             icon: ICONS.settings,   kbd: "⌘,", action: () => onViewChange("settings") },
  ];

  const actionItems = [
    { id: "act-upload",     category: "Actions",   label: "Upload PDF",           icon: ICONS.upload,     kbd: "⌘U", action: onUpload },
    { id: "act-newchat",    category: "Actions",   label: "New Chat",             icon: ICONS.newchat,    kbd: "⌘N", action: onNewChat,   disabled: !selectedDoc },
    { id: "act-clear",      category: "Actions",   label: "Clear Chat",           icon: ICONS.clear,      kbd: null, action: onClearChat, disabled: !selectedDoc },
    { id: "act-share",      category: "Actions",   label: "Share Chat",           icon: ICONS.share,      kbd: null, action: onShare,     disabled: !selectedDoc },
    { id: "act-insights",   category: "Actions",   label: "Toggle Insights",      icon: ICONS.insights,   kbd: null, action: onInsights,  disabled: !selectedDoc },
    { id: "act-compare",    category: "Actions",   label: "Compare PDFs",         icon: ICONS.compare,    kbd: null, action: onCompare },
    ...(plan !== "pro" ? [{ id: "act-upgrade", category: "Actions", label: "Upgrade to Pro ✨", icon: ICONS.billing, kbd: null, action: onUpgrade, highlight: true }] : []),
    { id: "act-signout",    category: "Actions",   label: "Sign Out",             icon: ICONS.signout,    kbd: null, action: onSignOut,   danger: true },
  ];

  const docItems = docs.slice(0, 8).map((doc) => ({
    id: `doc-${doc.id}`,
    category: "Recent PDFs",
    label: doc.file_name,
    icon: ICONS.pdfs,
    kbd: null,
    action: () => onSelectDoc(doc),
    subtitle: doc.file_name === selectedDoc?.file_name ? "Currently open" : null,
  }));

  return [...navItems, ...actionItems, ...docItems];
}

/* ── CommandPalette component ────────────────────────────────────────────── */
export default function CommandPalette({ open, onClose, docs = [], view, selectedDoc, plan, onViewChange, onUpload, onSelectDoc, onNewChat, onClearChat, onShare, onInsights, onCompare, onUpgrade, onSignOut }) {
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const commands = buildCommands({ docs, view, selectedDoc, plan, onViewChange, onUpload, onSelectDoc, onNewChat, onClearChat, onShare, onInsights, onCompare, onUpgrade, onSignOut });

  const filtered = query.trim()
    ? commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()) || c.category.toLowerCase().includes(query.toLowerCase()))
    : commands;

  // Group by category
  const grouped = filtered.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  // Flat list for keyboard nav
  const flat = Object.values(grouped).flat();

  useEffect(() => { setActiveIdx(0); }, [query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector("[data-active='true']");
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  const runCommand = useCallback((cmd) => {
    if (cmd.disabled) return;
    onClose();
    setTimeout(() => cmd.action(), 80);
  }, [onClose]);

  function handleKeyDown(e) {
    if (e.key === "Escape") { onClose(); return; }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const cmd = flat[activeIdx];
      if (cmd) runCommand(cmd);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="cp-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(4,4,16,0.72)", backdropFilter: "blur(8px)" }}
          />

          {/* Panel */}
          <motion.div
            key="cp-panel"
            initial={{ opacity: 0, scale: 0.94, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -16 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "fixed", top: "14vh", left: "50%", transform: "translateX(-50%)",
              width: "min(640px, 94vw)", zIndex: 9001,
              background: "rgba(10,10,30,0.96)", backdropFilter: "blur(28px)",
              border: "1px solid rgba(124,58,237,0.22)",
              borderRadius: 20,
              boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(124,58,237,0.08) inset",
              overflow: "hidden",
            }}
          >
            {/* Search input */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <svg width="17" height="17" fill="none" stroke="rgba(124,58,237,0.7)" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a command or search…"
                style={{
                  flex: 1, background: "transparent", border: "none", outline: "none",
                  fontSize: 15, fontWeight: 500, color: C.textPrimary,
                  fontFamily: "inherit",
                }}
              />
              {query && (
                <button onClick={() => setQuery("")}
                  style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: "2px 4px", borderRadius: 5, lineHeight: 1, fontSize: 13 }}>
                  ✕
                </button>
              )}
              <kbd style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "3px 7px", letterSpacing: "0.03em", flexShrink: 0 }}>
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div ref={listRef} style={{ maxHeight: "min(420px, 56vh)", overflowY: "auto", padding: "8px 0" }}>
              {flat.length === 0 ? (
                <div style={{ padding: "32px 20px", textAlign: "center", color: C.textMuted, fontSize: 13 }}>
                  No commands match "{query}"
                </div>
              ) : (
                Object.entries(grouped).map(([category, items]) => (
                  <div key={category}>
                    <div style={{ padding: "6px 18px 4px", fontSize: 10.5, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      {category}
                    </div>
                    {items.map((cmd) => {
                      const globalIdx = flat.indexOf(cmd);
                      const isActive = globalIdx === activeIdx;
                      return (
                        <motion.div
                          key={cmd.id}
                          data-active={isActive}
                          onMouseEnter={() => setActiveIdx(globalIdx)}
                          onClick={() => runCommand(cmd)}
                          animate={{ background: isActive ? "rgba(124,58,237,0.14)" : "transparent" }}
                          transition={{ duration: 0.1 }}
                          style={{
                            display: "flex", alignItems: "center", gap: 12,
                            padding: "9px 18px", cursor: cmd.disabled ? "not-allowed" : "pointer",
                            opacity: cmd.disabled ? 0.4 : 1,
                            transition: "background 0.1s",
                          }}
                        >
                          {/* Icon */}
                          <div style={{
                            width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            background: isActive
                              ? (cmd.danger ? "rgba(239,68,68,0.18)" : cmd.highlight ? "rgba(124,58,237,0.25)" : "rgba(124,58,237,0.18)")
                              : "rgba(255,255,255,0.05)",
                            border: `1px solid ${isActive
                              ? (cmd.danger ? "rgba(239,68,68,0.3)" : "rgba(124,58,237,0.3)")
                              : "rgba(255,255,255,0.08)"}`,
                            color: isActive
                              ? (cmd.danger ? "#f87171" : cmd.highlight ? "#c4b5fd" : "#a78bfa")
                              : (cmd.danger ? "#f87171" : cmd.highlight ? "#c4b5fd" : C.textMuted),
                            transition: "all 0.12s",
                          }}>
                            <Icon d={cmd.icon} size={14} />
                          </div>

                          {/* Label + subtitle */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: 13.5, fontWeight: 600,
                              color: cmd.danger ? "#f87171" : cmd.highlight ? "#c4b5fd" : C.textPrimary,
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            }}>
                              {cmd.label}
                            </div>
                            {cmd.subtitle && (
                              <div style={{ fontSize: 11, color: C.accentLight, marginTop: 1 }}>{cmd.subtitle}</div>
                            )}
                          </div>

                          {/* Keyboard shortcut or active arrow */}
                          {cmd.kbd ? (
                            <kbd style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "2px 7px", flexShrink: 0, letterSpacing: "0.02em" }}>
                              {cmd.kbd}
                            </kbd>
                          ) : isActive ? (
                            <svg width="14" height="14" fill="none" stroke={C.textMuted} strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
                              <polyline points="9 18 15 12 9 6"/>
                            </svg>
                          ) : null}
                        </motion.div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer hint */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "9px 18px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.2)" }}>
              {[
                { keys: ["↑","↓"], label: "navigate" },
                { keys: ["↵"], label: "select" },
                { keys: ["Esc"], label: "close" },
              ].map(({ keys, label }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {keys.map((k) => (
                    <kbd key={k} style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 5, padding: "2px 5px" }}>{k}</kbd>
                  ))}
                  <span style={{ fontSize: 11, color: "rgba(240,240,248,0.3)" }}>{label}</span>
                </div>
              ))}
              <div style={{ marginLeft: "auto", fontSize: 11, color: "rgba(240,240,248,0.25)" }}>Intellixy</div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
