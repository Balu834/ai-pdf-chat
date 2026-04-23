"use client";

import { useState, useEffect, useMemo } from "react";
import { useTTS } from "@/hooks/useTTS";
import { motion, AnimatePresence } from "framer-motion";
import { C } from "./tokens";
import { SparkleIcon, CopyIcon, ShareIcon } from "./icons";
import { LockedMessage } from "./UpgradePopup";

/* ─── BOLD INLINE RENDERER ───────────────────────────────────────────────── */
export function parseBold(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i} style={{ color: "#f0f0f8", fontWeight: 700 }}>{part.slice(2, -2)}</strong>
      : part
  );
}

/* ─── SECTION HEADER DETECTOR ───────────────────────────────────────────── */
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
  const parseRow = (line) =>
    line.split("|").map((c) => c.trim()).filter((_, i, a) => i > 0 && i < a.length - 1);
  const headers = parseRow(tableLines[0]);
  const rows    = tableLines.slice(2).map(parseRow);
  return (
    <div key={key} style={{ overflowX: "auto", margin: "10px 0" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={{ padding: "8px 12px", background: "rgba(124,58,237,0.12)", border: "1px solid rgba(255,255,255,0.1)", color: "#f0f0f8", fontWeight: 700, textAlign: "left", whiteSpace: "nowrap" }}>
                {parseBold(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ background: ri % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
              {row.map((cell, ci) => (
                <td key={ci} style={{ padding: "7px 12px", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(240,240,248,0.82)", verticalAlign: "top" }}>
                  {parseBold(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── FULL MARKDOWN RENDERER ─────────────────────────────────────────────── */
export function renderMarkdown(text) {
  const lines = text.split("\n");
  const output = [];
  let sectionLines = [];
  let currentSection = null;
  let key = 0;
  let tableBuffer = [];

  function flushTable() {
    if (tableBuffer.length < 3) {
      tableBuffer.forEach((l) => sectionLines.push(l));
    } else {
      flushSection();
      output.push(renderTable(tableBuffer, `tbl-${key++}`));
    }
    tableBuffer = [];
  }

  function flushSection() {
    if (!currentSection && sectionLines.length === 0) return;
    if (currentSection) {
      output.push(
        <motion.div
          key={`section-${key++}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          style={{ margin: "10px 0 4px", padding: "11px 14px", background: currentSection.bg, border: `1px solid ${currentSection.border}`, borderRadius: 12, display: "flex", flexDirection: "column", gap: 5 }}
        >
          <p style={{ margin: 0, fontSize: 12.5, fontWeight: 800, color: "#f0f0f8" }}>
            {parseBold(currentSection.headerText)}
          </p>
          {sectionLines.map((sl, si) => renderLine(sl, `sl-${key}-${si}`))}
        </motion.div>
      );
    } else {
      sectionLines.forEach((sl, si) => {
        const rendered = renderLine(sl, `loose-${key++}-${si}`);
        if (rendered) output.push(rendered);
      });
    }
    sectionLines = [];
    currentSection = null;
  }

  for (const line of lines) {
    const isTableRow = line.trim().startsWith("|") && line.trim().endsWith("|");
    if (isTableRow) {
      if (tableBuffer.length === 0) flushSection();
      tableBuffer.push(line);
      continue;
    }
    if (tableBuffer.length > 0) flushTable();
    const sectionStyle = getSectionStyle(line);
    if (sectionStyle) {
      flushSection();
      currentSection = { ...sectionStyle, headerText: line.trim() };
    } else {
      sectionLines.push(line);
    }
  }

  if (tableBuffer.length > 0) flushTable();
  flushSection();
  return output;
}

function renderLine(line, key) {
  if (/^### /.test(line)) return <p key={key} style={{ fontSize: 13, fontWeight: 800, color: "#f0f0f8", margin: "12px 0 4px" }}>{parseBold(line.slice(4))}</p>;
  if (/^## /.test(line))  return <p key={key} style={{ fontSize: 14, fontWeight: 800, color: "#f0f0f8", margin: "14px 0 5px" }}>{parseBold(line.slice(3))}</p>;
  if (/^# /.test(line))   return <p key={key} style={{ fontSize: 15, fontWeight: 900, color: "#f0f0f8", margin: "16px 0 6px" }}>{parseBold(line.slice(2))}</p>;

  if (/^[-*•] /.test(line)) {
    const content = line.slice(2).trim();
    const kvMatch = content.match(/^(.+?):\s+(\*\*.+\*\*)(.*)$/);
    if (kvMatch) {
      return (
        <div key={key} style={{ display: "flex", gap: 8, margin: "3px 0", alignItems: "baseline" }}>
          <span style={{ color: C.accentLight, flexShrink: 0 }}>•</span>
          <span style={{ fontSize: 13, color: "rgba(240,240,248,0.82)" }}>
            <span style={{ color: "rgba(240,240,248,0.55)", fontWeight: 500 }}>{kvMatch[1]}: </span>
            {parseBold(kvMatch[2] + kvMatch[3])}
          </span>
        </div>
      );
    }
    return (
      <div key={key} style={{ display: "flex", gap: 8, margin: "3px 0", alignItems: "baseline" }}>
        <span style={{ color: C.accentLight, flexShrink: 0 }}>•</span>
        <span style={{ fontSize: 13, color: "rgba(240,240,248,0.82)", lineHeight: 1.65 }}>{parseBold(content)}</span>
      </div>
    );
  }

  const numMatch = line.match(/^(\d+)\. /);
  if (numMatch) return (
    <div key={key} style={{ display: "flex", gap: 8, margin: "3px 0", alignItems: "baseline" }}>
      <span style={{ color: C.accentLight, flexShrink: 0, minWidth: 16, fontSize: 12, fontWeight: 700 }}>{numMatch[1]}.</span>
      <span style={{ fontSize: 13, color: "rgba(240,240,248,0.82)", lineHeight: 1.65 }}>{parseBold(line.slice(numMatch[0].length))}</span>
    </div>
  );

  if (/^---+$/.test(line.trim())) return <hr key={key} style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.07)", margin: "10px 0" }} />;
  if (line.trim() === "") return <div key={key} style={{ height: 6 }} />;
  return <span key={key} style={{ display: "block", fontSize: 14, color: "rgba(240,240,248,0.88)", lineHeight: 1.75 }}>{parseBold(line)}</span>;
}

/* ─── THINKING INDICATOR  ─  3 bouncing dots (ChatGPT / WhatsApp style) ──── */
export function ThinkingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 2px" }}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ y: [0, -7, 0], opacity: [0.45, 1, 0.45] }}
          transition={{ duration: 0.75, repeat: Infinity, delay: i * 0.16, ease: "easeInOut" }}
          style={{ display: "block", width: 9, height: 9, borderRadius: "50%", background: C.accentLight }}
        />
      ))}
    </div>
  );
}

/* kept as alias */
export function TypingDots() { return <ThinkingIndicator />; }

/* ─── CODE BLOCK WITH COPY BUTTON ───────────────────────────────────────── */
function CodeBlock({ lang, code }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div style={{ position: "relative", margin: "10px 0", borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 14px", background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(180,180,220,0.5)", textTransform: "lowercase", letterSpacing: "0.3px" }}>{lang || "code"}</span>
        <motion.button
          whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.92 }}
          onClick={copy}
          style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 9px", background: copied ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.06)", border: `1px solid ${copied ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.1)"}`, borderRadius: 6, fontSize: 11, fontWeight: 600, color: copied ? "#4ade80" : "rgba(200,200,230,0.7)", cursor: "pointer", transition: "all 0.15s" }}
        >
          {copied
            ? <><svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> Copied!</>
            : <><svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Copy</>
          }
        </motion.button>
      </div>
      <pre style={{ margin: 0, padding: "13px 16px", background: "rgba(0,0,0,0.4)", fontSize: 12.5, lineHeight: 1.65, overflowX: "auto", fontFamily: "'Fira Code','Cascadia Code','Consolas',monospace", color: "#e2e8f0", whiteSpace: "pre" }}>
        {code}
      </pre>
    </div>
  );
}

function renderWithCodeBlocks(text) {
  const segments = text.split(/(```[\s\S]*?```)/g);
  return segments.map((seg, i) => {
    if (seg.startsWith("```")) {
      const firstNewline = seg.indexOf("\n");
      const lang = firstNewline > 3 ? seg.slice(3, firstNewline).trim() : "";
      const code = seg.slice(firstNewline > 3 ? firstNewline + 1 : 3).replace(/```$/, "").trimEnd();
      return <CodeBlock key={i} lang={lang} code={code} />;
    }
    return <div key={i}>{renderMarkdown(seg)}</div>;
  });
}

/* ─── SPEAK BUTTON ───────────────────────────────────────────────────────── */
function SpeakBtn({ state, onSpeak, onPause, onResume, onStop }) {
  const isSpeaking = state === "speaking";
  const isPaused   = state === "paused";
  function handleClick() {
    if (state === "idle") onSpeak();
    else if (isSpeaking) onPause();
    else if (isPaused)   onResume();
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
      <motion.button
        whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.92 }}
        onClick={handleClick}
        title={state === "idle" ? "Listen" : isSpeaking ? "Pause" : "Resume"}
        style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: isSpeaking ? "#a78bfa" : isPaused ? "#60a5fa" : C.textMuted, background: isSpeaking ? "rgba(124,58,237,0.12)" : isPaused ? "rgba(96,165,250,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${isSpeaking ? "rgba(124,58,237,0.3)" : isPaused ? "rgba(96,165,250,0.25)" : "rgba(255,255,255,0.07)"}`, borderRadius: 7, padding: "4px 9px", cursor: "pointer", transition: "all 0.15s" }}
      >
        {isSpeaking ? (
          <>
            <span style={{ display: "flex", alignItems: "flex-end", gap: "2px", height: 11 }}>
              {[0, 1, 2].map((i) => (
                <motion.span key={i}
                  animate={{ scaleY: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
                  style={{ display: "block", width: 2, height: "100%", background: "#a78bfa", borderRadius: 2, transformOrigin: "bottom" }}
                />
              ))}
            </span>
            Pause
          </>
        ) : isPaused ? (
          <><svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg> Resume</>
        ) : (
          <><svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14"/></svg> Listen</>
        )}
      </motion.button>
      {state !== "idle" && (
        <motion.button
          initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={onStop} title="Stop"
          style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, cursor: "pointer", color: "#f87171", flexShrink: 0 }}
        >
          <svg width="9" height="9" fill="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
        </motion.button>
      )}
    </div>
  );
}

/* ─── MICRO BUTTONS ──────────────────────────────────────────────────────── */
function ActionBtn({ onClick, active, activeColor, children }) {
  return (
    <motion.button
      whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.92 }} onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: active && activeColor ? activeColor : C.textMuted, background: active && activeColor ? "rgba(74,222,128,0.08)" : "rgba(255,255,255,0.04)", border: `1px solid ${active && activeColor ? "rgba(74,222,128,0.22)" : "rgba(255,255,255,0.07)"}`, borderRadius: 7, padding: "4px 9px", cursor: "pointer", transition: "all 0.15s" }}
    >
      {children}
    </motion.button>
  );
}

function ThumbBtn({ onClick, active, color, children }) {
  const colors = { green: ["rgba(74,222,128,0.12)", "rgba(74,222,128,0.3)"], red: ["rgba(239,68,68,0.1)", "rgba(239,68,68,0.25)"] };
  const [bg, bd] = colors[color];
  return (
    <motion.button
      whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.88 }} onClick={onClick}
      style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, background: active ? bg : "rgba(255,255,255,0.04)", border: `1px solid ${active ? bd : "rgba(255,255,255,0.07)"}`, borderRadius: 7, cursor: "pointer", transition: "all 0.15s" }}
    >
      {children}
    </motion.button>
  );
}

/* ─── AVATAR ─────────────────────────────────────────────────────────────── */
function AIAvatar() {
  return (
    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2, boxShadow: "0 2px 12px rgba(124,58,237,0.4), 0 0 0 2px rgba(124,58,237,0.15)" }}>
      <SparkleIcon />
    </div>
  );
}

function UserAvatar({ initial }) {
  return (
    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,rgba(124,58,237,0.25),rgba(79,70,229,0.25))", border: "1.5px solid rgba(124,58,237,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2, fontSize: 14, fontWeight: 800, color: C.accentLight }}>
      {initial}
    </div>
  );
}

/* ─── MESSAGE TIMESTAMP ──────────────────────────────────────────────────── */
function MessageTime({ id }) {
  const time = useMemo(() => {
    // msg.id is Date.now() for new messages; skip for history (UUID / small ints)
    if (typeof id === "number" && id > 1_600_000_000_000) {
      return new Date(id).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return "";
  }, [id]);
  if (!time) return null;
  return (
    <span style={{ fontSize: 10, color: "rgba(240,240,248,0.22)", letterSpacing: "0.2px", paddingInline: 4, userSelect: "none" }}>
      {time}
    </span>
  );
}

/* ─── BUBBLE TAIL ─────────────────────────────────────────────────────────── */
// CSS border triangle trick: zero-size box with two borders — one colored, one transparent.
function UserTail() {
  return (
    <div style={{
      position:    "absolute",
      bottom:      0,
      right:       -7,
      width:       0,
      height:      0,
      borderTop:   "10px solid #6d28d9",   // matches gradient bottom
      borderRight: "7px solid transparent",
    }} />
  );
}

function AITail() {
  return (
    <div style={{
      position:   "absolute",
      bottom:     0,
      left:       -7,
      width:      0,
      height:     0,
      borderTop:  "10px solid rgba(28,24,58,0.95)", // matches AI bubble background
      borderLeft: "7px solid transparent",
    }} />
  );
}

/* ─── CHAT MESSAGE ───────────────────────────────────────────────────────── */
export default function ChatMessage({ msg, onCopy, onShare, userInitial, onUpgrade }) {
  const isUser     = msg.role === "user";
  const isThinking = msg.streaming && !msg.content;

  if (msg.locked) return <LockedMessage onUpgrade={onUpgrade} />;

  // useState / hooks must be after early return
  const [feedback, setFeedback] = useState(null);
  const [copied,   setCopied]   = useState(false);
  const [hovered,  setHovered]  = useState(false);
  const { speak, pause, resume, stop, state: ttsState, supported: ttsSupported } = useTTS();

  function handleCopy() {
    onCopy(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([msg.content], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "intellixy-answer.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0,  scale: 1    }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:    "flex",
        gap:        10,
        justifyContent: isUser ? "flex-end" : "flex-start",
        alignItems: "flex-end",        // avatars sit at bubble bottom
        width:      "100%",
      }}
    >
      {/* AI avatar — sits at the bottom-left */}
      {!isUser && <AIAvatar />}

      {/* Bubble + actions column */}
      <div style={{
        maxWidth:      "72%",
        display:       "flex",
        flexDirection: "column",
        gap:           4,
        alignItems:    isUser ? "flex-end" : "flex-start",
      }}>

        {/* ── The bubble ── */}
        <div style={{ position: "relative" }}>
          <div style={{
            padding:     isUser ? "11px 16px" : "13px 17px",
            borderRadius: isUser
              ? "18px 18px 4px 18px"    // WhatsApp user style
              : "4px 18px 18px 18px",   // WhatsApp AI style
            fontSize:    14,
            lineHeight:  1.78,
            wordBreak:   "break-word",
            overflowWrap: "break-word",
            background:  isUser
              ? "linear-gradient(135deg,#7c3aed 0%,#5b21b6 100%)"
              : msg.isError
                ? "rgba(239,68,68,0.07)"
                : "rgba(28,24,58,0.95)",
            border: isUser
              ? "none"
              : msg.isError
                ? "1px solid rgba(239,68,68,0.22)"
                : "1px solid rgba(255,255,255,0.07)",
            color:        isUser ? "rgba(255,255,255,0.95)" : "rgba(240,240,248,0.9)",
            boxShadow:    isUser
              ? "0 6px 28px rgba(124,58,237,0.35), 0 2px 8px rgba(0,0,0,0.4)"
              : "0 2px 12px rgba(0,0,0,0.3)",
            backdropFilter: isUser ? "none" : "blur(12px)",
            minWidth:     isThinking ? 80 : undefined,
            transition:   "box-shadow 0.2s",
          }}>
            {isThinking ? (
              <ThinkingIndicator />
            ) : isUser ? (
              <span style={{ whiteSpace: "pre-wrap" }}>{msg.content}</span>
            ) : (
              <>
                {renderWithCodeBlocks(msg.content)}
                {msg.streaming && (
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.55, repeat: Infinity, ease: "steps(1)" }}
                    style={{ display: "inline-block", width: 2, height: "0.95em", marginLeft: 2, background: C.accentLight, borderRadius: 2, verticalAlign: "text-bottom" }}
                  />
                )}
              </>
            )}
          </div>

          {/* Bubble tails — only on settled messages */}
          {!isThinking && !msg.streaming && (
            isUser ? <UserTail /> : <AITail />
          )}
        </div>

        {/* Timestamp */}
        {!msg.streaming && (
          <MessageTime id={msg.id} />
        )}

        {/* ── Action bar — fades in on hover, only for complete AI messages ── */}
        {!isUser && !msg.streaming && msg.content && (
          <AnimatePresence>
            {(hovered || ttsState !== "idle") && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0  }}
                exit={{    opacity: 0, y: -4  }}
                transition={{ duration: 0.15 }}
                style={{ display: "flex", alignItems: "center", gap: 4, paddingLeft: 2, flexWrap: "wrap" }}
              >
                {/* Copy */}
                <ActionBtn onClick={handleCopy} active={copied} activeColor={C.green}>
                  {copied
                    ? <><svg width="11" height="11" fill="none" stroke={C.green} viewBox="0 0 24 24" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> Copied!</>
                    : <><CopyIcon /> Copy</>
                  }
                </ActionBtn>

                {/* Download */}
                <ActionBtn onClick={handleDownload}>
                  <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M16 12l-4 4m0 0l-4-4m4 4V4"/></svg>
                  Export
                </ActionBtn>

                {/* Share */}
                <ActionBtn onClick={() => onShare(msg.content)}>
                  <ShareIcon /> Share
                </ActionBtn>

                {/* Speak / TTS */}
                {ttsSupported && (
                  <SpeakBtn
                    state={ttsState}
                    onSpeak={() => speak(msg.content)}
                    onPause={pause}
                    onResume={resume}
                    onStop={stop}
                  />
                )}

                <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.07)", margin: "0 2px" }} />

                {/* Thumbs */}
                <ThumbBtn active={feedback === "up"}   color="green" onClick={() => setFeedback(feedback === "up"   ? null : "up")}>👍</ThumbBtn>
                <ThumbBtn active={feedback === "down"} color="red"   onClick={() => setFeedback(feedback === "down" ? null : "down")}>👎</ThumbBtn>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* User avatar */}
      {isUser && <UserAvatar initial={userInitial} />}
    </motion.div>
  );
}
