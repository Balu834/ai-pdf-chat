"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useTTS } from "@/hooks/useTTS";
import {
  motion, AnimatePresence,
  useMotionValue, useTransform,
} from "framer-motion";
import { C } from "./tokens";
import { SparkleIcon, CopyIcon, ShareIcon } from "./icons";
import { LockedMessage } from "./UpgradePopup";
import VoiceNotePlayer from "./VoiceNotePlayer";

/* ─── BOLD INLINE RENDERER ───────────────────────────────────────────────── */
export function parseBold(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i} style={{ color: "#f0f0f8", fontWeight: 700 }}>{part.slice(2, -2)}</strong>
      : part
  );
}

/* ─── SECTION HEADERS ────────────────────────────────────────────────────── */
const SECTION_MAP = {
  "📄": { bg: "rgba(99,102,241,0.08)",  border: "rgba(99,102,241,0.2)" },
  "💡": { bg: "rgba(234,179,8,0.07)",   border: "rgba(234,179,8,0.22)" },
  "⚠️": { bg: "rgba(239,68,68,0.07)",   border: "rgba(239,68,68,0.22)" },
  "❓": { bg: "rgba(6,182,212,0.07)",   border: "rgba(6,182,212,0.22)" },
  "🔑": { bg: "rgba(124,58,237,0.08)",  border: "rgba(124,58,237,0.22)" },
};
function getSectionStyle(line) {
  for (const [emoji, style] of Object.entries(SECTION_MAP)) {
    if (line.trimStart().startsWith(emoji)) return { emoji, ...style };
  }
  return null;
}

/* ─── TABLE RENDERER ─────────────────────────────────────────────────────── */
function renderTable(tableLines, key) {
  const parseRow = (l) => l.split("|").map((c) => c.trim()).filter((_, i, a) => i > 0 && i < a.length - 1);
  const headers  = parseRow(tableLines[0]);
  const rows     = tableLines.slice(2).map(parseRow);
  return (
    <div key={key} style={{ overflowX: "auto", margin: "10px 0" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>{headers.map((h, i) => <th key={i} style={{ padding: "8px 12px", background: "rgba(124,58,237,0.12)", border: "1px solid rgba(255,255,255,0.1)", color: "#f0f0f8", fontWeight: 700, textAlign: "left" }}>{parseBold(h)}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ background: ri % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
              {row.map((cell, ci) => <td key={ci} style={{ padding: "7px 12px", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(240,240,248,0.82)", verticalAlign: "top" }}>{parseBold(cell)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── MARKDOWN RENDERER ──────────────────────────────────────────────────── */
export function renderMarkdown(text) {
  const lines = text.split("\n");
  const output = [];
  let sectionLines = [], currentSection = null, key = 0, tableBuffer = [];

  function flushTable() {
    if (tableBuffer.length < 3) tableBuffer.forEach((l) => sectionLines.push(l));
    else { flushSection(); output.push(renderTable(tableBuffer, `tbl-${key++}`)); }
    tableBuffer = [];
  }

  function flushSection() {
    if (!currentSection && sectionLines.length === 0) return;
    if (currentSection) {
      output.push(
        <motion.div key={`sec-${key++}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}
          style={{ margin: "10px 0 4px", padding: "11px 14px", background: currentSection.bg, border: `1px solid ${currentSection.border}`, borderRadius: 12, display: "flex", flexDirection: "column", gap: 5 }}>
          <p style={{ margin: 0, fontSize: 12.5, fontWeight: 800, color: "#f0f0f8" }}>{parseBold(currentSection.headerText)}</p>
          {sectionLines.map((sl, si) => renderLine(sl, `sl-${key}-${si}`))}
        </motion.div>
      );
    } else {
      sectionLines.forEach((sl, si) => { const r = renderLine(sl, `l-${key++}-${si}`); if (r) output.push(r); });
    }
    sectionLines = []; currentSection = null;
  }

  for (const line of lines) {
    const isTableRow = line.trim().startsWith("|") && line.trim().endsWith("|");
    if (isTableRow) { if (!tableBuffer.length) flushSection(); tableBuffer.push(line); continue; }
    if (tableBuffer.length) flushTable();
    const ss = getSectionStyle(line);
    if (ss) { flushSection(); currentSection = { ...ss, headerText: line.trim() }; }
    else sectionLines.push(line);
  }
  if (tableBuffer.length) flushTable();
  flushSection();
  return output;
}

function renderLine(line, key) {
  if (/^### /.test(line)) return <p key={key} style={{ fontSize: 13, fontWeight: 800, color: "#f0f0f8", margin: "12px 0 4px" }}>{parseBold(line.slice(4))}</p>;
  if (/^## /.test(line))  return <p key={key} style={{ fontSize: 14, fontWeight: 800, color: "#f0f0f8", margin: "14px 0 5px" }}>{parseBold(line.slice(3))}</p>;
  if (/^# /.test(line))   return <p key={key} style={{ fontSize: 15, fontWeight: 900, color: "#f0f0f8", margin: "16px 0 6px" }}>{parseBold(line.slice(2))}</p>;
  if (/^[-*•] /.test(line)) {
    const content = line.slice(2).trim();
    const kv = content.match(/^(.+?):\s+(\*\*.+\*\*)(.*)$/);
    return kv
      ? <div key={key} style={{ display: "flex", gap: 8, margin: "3px 0", alignItems: "baseline" }}><span style={{ color: C.accentLight, flexShrink: 0 }}>•</span><span style={{ fontSize: 13, color: "rgba(240,240,248,0.82)" }}><span style={{ color: "rgba(240,240,248,0.55)", fontWeight: 500 }}>{kv[1]}: </span>{parseBold(kv[2] + kv[3])}</span></div>
      : <div key={key} style={{ display: "flex", gap: 8, margin: "3px 0", alignItems: "baseline" }}><span style={{ color: C.accentLight, flexShrink: 0 }}>•</span><span style={{ fontSize: 13, color: "rgba(240,240,248,0.82)", lineHeight: 1.65 }}>{parseBold(content)}</span></div>;
  }
  const nm = line.match(/^(\d+)\. /);
  if (nm) return <div key={key} style={{ display: "flex", gap: 8, margin: "3px 0", alignItems: "baseline" }}><span style={{ color: C.accentLight, flexShrink: 0, minWidth: 16, fontSize: 12, fontWeight: 700 }}>{nm[1]}.</span><span style={{ fontSize: 13, color: "rgba(240,240,248,0.82)", lineHeight: 1.65 }}>{parseBold(line.slice(nm[0].length))}</span></div>;
  if (/^---+$/.test(line.trim())) return <hr key={key} style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.07)", margin: "10px 0" }} />;
  if (line.trim() === "") return <div key={key} style={{ height: 6 }} />;
  return <span key={key} style={{ display: "block", fontSize: 14, color: "rgba(240,240,248,0.88)", lineHeight: 1.75 }}>{parseBold(line)}</span>;
}

/* ─── CODE BLOCK ─────────────────────────────────────────────────────────── */
function CodeBlock({ lang, code }) {
  const [copied, setCopied] = useState(false);
  function copy() { navigator.clipboard.writeText(code).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  return (
    <div style={{ position: "relative", margin: "10px 0", borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 14px", background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(180,180,220,0.5)", textTransform: "lowercase" }}>{lang || "code"}</span>
        <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.92 }} onClick={copy}
          style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 9px", background: copied ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.06)", border: `1px solid ${copied ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.1)"}`, borderRadius: 6, fontSize: 11, fontWeight: 600, color: copied ? "#4ade80" : "rgba(200,200,230,0.7)", cursor: "pointer" }}>
          {copied ? <><svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> Copied!</> : <><svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Copy</>}
        </motion.button>
      </div>
      <pre style={{ margin: 0, padding: "13px 16px", background: "rgba(0,0,0,0.4)", fontSize: 12.5, lineHeight: 1.65, overflowX: "auto", fontFamily: "'Fira Code','Cascadia Code','Consolas',monospace", color: "#e2e8f0", whiteSpace: "pre" }}>{code}</pre>
    </div>
  );
}
function renderWithCodeBlocks(text) {
  return text.split(/(```[\s\S]*?```)/g).map((seg, i) => {
    if (seg.startsWith("```")) {
      const nl = seg.indexOf("\n"); const lang = nl > 3 ? seg.slice(3, nl).trim() : "";
      const code = seg.slice(nl > 3 ? nl + 1 : 3).replace(/```$/, "").trimEnd();
      return <CodeBlock key={i} lang={lang} code={code} />;
    }
    return <div key={i}>{renderMarkdown(seg)}</div>;
  });
}

/* ─── THINKING INDICATOR — 3 bouncing dots ───────────────────────────────── */
export function ThinkingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 2px" }}>
      {[0, 1, 2].map((i) => (
        <motion.span key={i}
          animate={{ y: [0, -7, 0], opacity: [0.45, 1, 0.45] }}
          transition={{ duration: 0.75, repeat: Infinity, delay: i * 0.16, ease: "easeInOut" }}
          style={{ display: "block", width: 9, height: 9, borderRadius: "50%", background: C.accentLight }}
        />
      ))}
    </div>
  );
}
export function TypingDots() { return <ThinkingIndicator />; }

/* ─── SPEAK BUTTON ───────────────────────────────────────────────────────── */
function SpeakBtn({ state, onSpeak, onPause, onResume, onStop }) {
  const speaking = state === "speaking", paused = state === "paused";
  function handleClick() {
    if (state === "idle") onSpeak(); else if (speaking) onPause(); else if (paused) onResume();
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
      <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.92 }} onClick={handleClick}
        title={state === "idle" ? "Listen" : speaking ? "Pause" : "Resume"}
        style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: speaking ? "#a78bfa" : paused ? "#60a5fa" : C.textMuted, background: speaking ? "rgba(124,58,237,0.12)" : paused ? "rgba(96,165,250,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${speaking ? "rgba(124,58,237,0.3)" : paused ? "rgba(96,165,250,0.25)" : "rgba(255,255,255,0.07)"}`, borderRadius: 7, padding: "4px 9px", cursor: "pointer", transition: "all 0.15s" }}>
        {speaking ? (<><span style={{ display: "flex", alignItems: "flex-end", gap: "2px", height: 11 }}>{[0,1,2].map((i) => <motion.span key={i} animate={{ scaleY: [0.4,1,0.4] }} transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }} style={{ display: "block", width: 2, height: "100%", background: "#a78bfa", borderRadius: 2, transformOrigin: "bottom" }} />)}</span>Pause</>)
          : paused ? <><svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg> Resume</>
          : <><svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14"/></svg> Listen</>}
      </motion.button>
      {state !== "idle" && (
        <motion.button initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onStop}
          style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, cursor: "pointer", color: "#f87171" }}>
          <svg width="9" height="9" fill="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
        </motion.button>
      )}
    </div>
  );
}

/* ─── ACTION / THUMB BUTTONS ─────────────────────────────────────────────── */
function ActionBtn({ onClick, active, activeColor, children }) {
  return (
    <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.92 }} onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: active && activeColor ? activeColor : C.textMuted, background: active ? "rgba(74,222,128,0.08)" : "rgba(255,255,255,0.04)", border: `1px solid ${active ? "rgba(74,222,128,0.22)" : "rgba(255,255,255,0.07)"}`, borderRadius: 7, padding: "4px 9px", cursor: "pointer", transition: "all 0.15s" }}>
      {children}
    </motion.button>
  );
}
function ThumbBtn({ onClick, active, color, children }) {
  const [bg, bd] = { green: ["rgba(74,222,128,0.12)", "rgba(74,222,128,0.3)"], red: ["rgba(239,68,68,0.1)", "rgba(239,68,68,0.25)"] }[color];
  return (
    <motion.button whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.88 }} onClick={onClick}
      style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, background: active ? bg : "rgba(255,255,255,0.04)", border: `1px solid ${active ? bd : "rgba(255,255,255,0.07)"}`, borderRadius: 7, cursor: "pointer", transition: "all 0.15s" }}>
      {children}
    </motion.button>
  );
}

/* ─── AVATARS ────────────────────────────────────────────────────────────── */
function AIAvatar() {
  return <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginBottom: 4, boxShadow: "0 2px 12px rgba(124,58,237,0.4), 0 0 0 2px rgba(124,58,237,0.15)" }}><SparkleIcon /></div>;
}
function UserAvatar({ initial }) {
  return <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,rgba(124,58,237,0.25),rgba(79,70,229,0.25))", border: "1.5px solid rgba(124,58,237,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginBottom: 4, fontSize: 14, fontWeight: 800, color: C.accentLight }}>{initial}</div>;
}

/* ─── TIMESTAMP ──────────────────────────────────────────────────────────── */
function MessageTime({ id }) {
  const time = useMemo(() => {
    if (typeof id === "number" && id > 1_600_000_000_000)
      return new Date(id).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return "";
  }, [id]);
  if (!time) return null;
  return <span style={{ fontSize: 10, color: "rgba(240,240,248,0.22)", paddingInline: 4, userSelect: "none" }}>{time}</span>;
}

/* ─── BUBBLE TAILS ───────────────────────────────────────────────────────── */
const UserTail = () => <div style={{ position: "absolute", bottom: 0, right: -7, width: 0, height: 0, borderTop: "10px solid #5b21b6", borderRight: "7px solid transparent" }} />;
const AITail   = () => <div style={{ position: "absolute", bottom: 0, left:  -7, width: 0, height: 0, borderTop: "10px solid rgba(28,24,58,0.95)", borderLeft: "7px solid transparent" }} />;

/* ─── REACTION PICKER ────────────────────────────────────────────────────── */
const REACTION_EMOJIS = ["👍", "❤️", "😂", "🔥", "👎"];

function ReactionPicker({ myReaction, onSelect, isUser }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 6 }}
      animate={{ opacity: 1, scale: 1,   y: 0 }}
      exit={{    opacity: 0, scale: 0.8, y: 6 }}
      transition={{ duration: 0.15, ease: "backOut" }}
      style={{
        position:       "absolute",
        bottom:         "calc(100% + 10px)",
        [isUser ? "right" : "left"]: 0,
        display:        "flex",
        gap:            2,
        padding:        "5px 6px",
        background:     "rgba(10,8,30,0.97)",
        border:         "1px solid rgba(255,255,255,0.1)",
        borderRadius:   99,
        backdropFilter: "blur(20px)",
        boxShadow:      "0 8px 36px rgba(0,0,0,0.7)",
        zIndex:         60,
        whiteSpace:     "nowrap",
      }}
    >
      {REACTION_EMOJIS.map((emoji) => (
        <motion.button key={emoji}
          whileHover={{ scale: 1.35, y: -3 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onSelect(emoji)}
          style={{
            width: 34, height: 34, borderRadius: "50%",
            background: myReaction === emoji ? "rgba(124,58,237,0.22)" : "transparent",
            border: "none", cursor: "pointer", fontSize: 19,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.15s",
          }}
        >
          {emoji}
        </motion.button>
      ))}
    </motion.div>
  );
}

/* ─── SWIPEABLE MESSAGE WRAPPER ──────────────────────────────────────────── */
function SwipeableMessage({ onReply, onCopySwipe, children }) {
  const x = useMotionValue(0);
  const THRESHOLD = 68;

  // Reply hint — fades in as user drags RIGHT
  const replyOpacity = useTransform(x, [0,  20,  THRESHOLD], [0, 0,   1]);
  const replyScale   = useTransform(x, [0,  THRESHOLD], [0.5, 1]);
  // Copy hint — fades in as user drags LEFT
  const copyOpacity  = useTransform(x, [-THRESHOLD, -20, 0], [1, 0,   0]);
  const copyScale    = useTransform(x, [-THRESHOLD,   0],    [1, 0.5]);

  return (
    <div style={{ position: "relative" }}>
      {/* ── Reply hint (left side, revealed when swiping right) ── */}
      <motion.div
        style={{ position: "absolute", left: 4, top: "50%", y: "-50%", opacity: replyOpacity, scale: replyScale, pointerEvents: "none", zIndex: 0 }}
      >
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(124,58,237,0.18)", border: "1.5px solid rgba(124,58,237,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>↩️</div>
      </motion.div>

      {/* ── Copy hint (right side, revealed when swiping left) ── */}
      <motion.div
        style={{ position: "absolute", right: 4, top: "50%", y: "-50%", opacity: copyOpacity, scale: copyScale, pointerEvents: "none", zIndex: 0 }}
      >
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>📋</div>
      </motion.div>

      {/* ── Draggable row ── */}
      <motion.div
        style={{ x, position: "relative", zIndex: 1, touchAction: "pan-y" }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.18, right: 0.18 }}
        dragTransition={{ bounceStiffness: 450, bounceDamping: 35 }}
        onDragEnd={(_, info) => {
          if (info.offset.x > THRESHOLD || info.velocity.x > 350) {
            onReply?.();
            navigator.vibrate?.(12);
          } else if (info.offset.x < -THRESHOLD || info.velocity.x < -350) {
            onCopySwipe?.();
            navigator.vibrate?.(12);
          }
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/* ─── MAIN CHAT MESSAGE ──────────────────────────────────────────────────── */
export default function ChatMessage({ msg, onCopy, onShare, userInitial, onUpgrade, onReply }) {
  const isUser     = msg.role === "user";
  const isThinking = msg.streaming && !msg.content;
  const isAudio    = msg.type === "audio";

  if (msg.locked) return <LockedMessage onUpgrade={onUpgrade} />;

  /* ── State ── */
  const [reactions,  setReactions]  = useState({});  // { '👍': 2, '❤️': 1 }
  const [myReaction, setMyReaction] = useState(null); // currently selected emoji
  const [showPicker, setShowPicker] = useState(false);
  const [hovered,    setHovered]    = useState(false);
  const [copied,     setCopied]     = useState(false);
  const [feedback,   setFeedback]   = useState(null);

  const { speak, pause, resume, stop, state: ttsState, supported: ttsSupported } = useTTS();

  /* ── Refs ── */
  const pickerRef     = useRef(null);
  const longPressRef  = useRef(null);
  const didLongPress  = useRef(false);

  /* ── Close picker on outside click ── */
  useEffect(() => {
    if (!showPicker) return;
    function outsideClick(e) {
      if (!pickerRef.current?.contains(e.target)) setShowPicker(false);
    }
    document.addEventListener("pointerdown", outsideClick, true);
    return () => document.removeEventListener("pointerdown", outsideClick, true);
  }, [showPicker]);

  /* ── Long-press for mobile reaction picker ── */
  function onLongPressStart(e) {
    if (isThinking || msg.streaming) return;
    didLongPress.current = false;
    longPressRef.current = setTimeout(() => {
      didLongPress.current = true;
      setShowPicker(true);
      navigator.vibrate?.(20);
    }, 480);
  }
  function onLongPressEnd() {
    clearTimeout(longPressRef.current);
  }
  function onLongPressMove() {
    // Cancel long press if finger moves (user is swiping)
    clearTimeout(longPressRef.current);
  }

  /* ── Reaction handler ── */
  function handleReaction(emoji) {
    const was = myReaction;
    const next = { ...reactions };
    if (was === emoji) {
      next[emoji] = (next[emoji] ?? 1) - 1;
      if (next[emoji] <= 0) delete next[emoji];
      setMyReaction(null);
    } else {
      if (was) { next[was] = (next[was] ?? 1) - 1; if (next[was] <= 0) delete next[was]; }
      next[emoji] = (next[emoji] ?? 0) + 1;
      setMyReaction(emoji);
    }
    setReactions(next);
    setShowPicker(false);
    navigator.vibrate?.(8);
  }

  /* ── Copy / download ── */
  function handleCopy() {
    onCopy(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  function handleDownload() {
    const blob = new Blob([msg.content], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "intellixy-answer.txt"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0,  scale: 1    }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <SwipeableMessage
        onReply={() => !isThinking && !msg.streaming && onReply?.(msg)}
        onCopySwipe={() => !isThinking && msg.content && handleCopy()}
      >
        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => { setHovered(false); }}
          style={{ display: "flex", gap: 10, justifyContent: isUser ? "flex-end" : "flex-start", alignItems: "flex-end", width: "100%" }}
        >
          {/* AI avatar */}
          {!isUser && <AIAvatar />}

          {/* ── Bubble + meta column ── */}
          <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column", gap: 4, alignItems: isUser ? "flex-end" : "flex-start" }}>

            {/* Bubble with picker */}
            <div
              ref={pickerRef}
              style={{ position: "relative" }}
              onPointerDown={onLongPressStart}
              onPointerUp={onLongPressEnd}
              onPointerCancel={onLongPressEnd}
              onPointerMove={onLongPressMove}
            >
              {/* ── Reaction picker ── */}
              <AnimatePresence>
                {showPicker && (
                  <ReactionPicker
                    myReaction={myReaction}
                    onSelect={handleReaction}
                    isUser={isUser}
                  />
                )}
              </AnimatePresence>

              {/* ── Reaction add button (desktop hover) ── */}
              <AnimatePresence>
                {hovered && !msg.streaming && !isThinking && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1   }}
                    exit={{    opacity: 0, scale: 0.7  }}
                    onClick={(e) => { e.stopPropagation(); setShowPicker((p) => !p); }}
                    style={{
                      position: "absolute",
                      top: "50%", transform: "translateY(-50%)",
                      [isUser ? "right" : "left"]: "calc(100% + 8px)",
                      width: 26, height: 26, borderRadius: "50%",
                      background: "rgba(255,255,255,0.07)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      cursor: "pointer", fontSize: 14,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      zIndex: 20,
                    }}
                  >
                    😊
                  </motion.button>
                )}
              </AnimatePresence>

              {/* ── Bubble ── */}
              <div style={{
                padding:      isUser ? "11px 16px" : (isThinking ? "11px 16px" : "13px 17px"),
                borderRadius: isUser ? "18px 18px 4px 18px" : "4px 18px 18px 18px",
                fontSize: 14, lineHeight: 1.78, wordBreak: "break-word", overflowWrap: "break-word",
                background:   isUser  ? "linear-gradient(135deg,#7c3aed 0%,#5b21b6 100%)"
                            : msg.isError ? "rgba(239,68,68,0.07)"
                            : "rgba(28,24,58,0.95)",
                border: isUser   ? "none"
                      : msg.isError ? "1px solid rgba(239,68,68,0.22)"
                      : "1px solid rgba(255,255,255,0.07)",
                color:      isUser ? "rgba(255,255,255,0.95)" : "rgba(240,240,248,0.9)",
                boxShadow:  isUser ? "0 6px 28px rgba(124,58,237,0.35), 0 2px 8px rgba(0,0,0,0.4)" : "0 2px 12px rgba(0,0,0,0.3)",
                backdropFilter: isUser ? "none" : "blur(12px)",
                minWidth:   isThinking ? 80 : undefined,
              }}>
                {isAudio ? (
                  <VoiceNotePlayer url={msg.audioUrl} durationMs={msg.durationMs ?? 0} isUser={isUser} />
                ) : isThinking ? (
                  <ThinkingIndicator />
                ) : isUser ? (
                  <span style={{ whiteSpace: "pre-wrap" }}>{msg.content}</span>
                ) : (
                  <>
                    {renderWithCodeBlocks(msg.content)}
                    {msg.streaming && (
                      <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.55, repeat: Infinity, ease: "steps(1)" }}
                        style={{ display: "inline-block", width: 2, height: "0.95em", marginLeft: 2, background: C.accentLight, borderRadius: 2, verticalAlign: "text-bottom" }} />
                    )}
                  </>
                )}
              </div>

              {/* Bubble tail */}
              {!isThinking && !msg.streaming && (isUser ? <UserTail /> : <AITail />)}
            </div>

            {/* ── Reaction badges ── */}
            {Object.keys(reactions).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1,  y: 0  }}
                style={{ display: "flex", gap: 3, flexWrap: "wrap" }}
              >
                {Object.entries(reactions).map(([emoji, count]) => (
                  <motion.button
                    key={emoji}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleReaction(emoji)}
                    style={{
                      display: "flex", alignItems: "center", gap: 3,
                      padding: "2px 8px", borderRadius: 99, cursor: "pointer",
                      background:  myReaction === emoji ? "rgba(124,58,237,0.18)" : "rgba(255,255,255,0.05)",
                      border: `1px solid ${myReaction === emoji ? "rgba(124,58,237,0.38)" : "rgba(255,255,255,0.1)"}`,
                      fontSize: 13, transition: "all 0.15s",
                    }}
                  >
                    <span>{emoji}</span>
                    {count > 1 && <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(240,240,248,0.55)" }}>{count}</span>}
                  </motion.button>
                ))}
              </motion.div>
            )}

            {/* Timestamp */}
            {!msg.streaming && <MessageTime id={msg.id} />}

            {/* ── Action bar (hover-reveal, complete AI text messages only) ── */}
            {!isUser && !msg.streaming && msg.content && !isAudio && (
              <AnimatePresence>
                {(hovered || ttsState !== "idle") && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1,  y: 0  }}
                    exit={{    opacity: 0,  y: -4  }}
                    transition={{ duration: 0.15 }}
                    style={{ display: "flex", alignItems: "center", gap: 4, paddingLeft: 2, flexWrap: "wrap" }}
                  >
                    <ActionBtn onClick={handleCopy} active={copied} activeColor={C.green}>
                      {copied ? <><svg width="11" height="11" fill="none" stroke={C.green} viewBox="0 0 24 24" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> Copied!</> : <><CopyIcon /> Copy</>}
                    </ActionBtn>
                    <ActionBtn onClick={handleDownload}>
                      <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M16 12l-4 4m0 0l-4-4m4 4V4"/></svg> Export
                    </ActionBtn>
                    <ActionBtn onClick={() => onShare(msg.content)}><ShareIcon /> Share</ActionBtn>
                    {ttsSupported && <SpeakBtn state={ttsState} onSpeak={() => speak(msg.content)} onPause={pause} onResume={resume} onStop={stop} />}
                    <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.07)", margin: "0 2px" }} />
                    <ThumbBtn active={feedback === "up"}   color="green" onClick={() => setFeedback(feedback === "up"   ? null : "up")}>👍</ThumbBtn>
                    <ThumbBtn active={feedback === "down"} color="red"   onClick={() => setFeedback(feedback === "down" ? null : "down")}>👎</ThumbBtn>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>

          {/* User avatar */}
          {isUser && <UserAvatar initial={userInitial} />}
        </div>
      </SwipeableMessage>
    </motion.div>
  );
}
