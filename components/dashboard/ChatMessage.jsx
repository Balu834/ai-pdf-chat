"use client";

import { useState, useEffect } from "react";
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
  "📄": { bg: "rgba(99,102,241,0.08)",  border: "rgba(99,102,241,0.2)",  label: "indigo"  },
  "💡": { bg: "rgba(234,179,8,0.07)",   border: "rgba(234,179,8,0.22)",  label: "amber"   },
  "⚠️": { bg: "rgba(239,68,68,0.07)",   border: "rgba(239,68,68,0.22)",  label: "red"     },
  "❓": { bg: "rgba(6,182,212,0.07)",   border: "rgba(6,182,212,0.22)",  label: "cyan"    },
  "🔑": { bg: "rgba(124,58,237,0.08)",  border: "rgba(124,58,237,0.22)", label: "purple"  },
};

function isSectionHeader(line) {
  return Object.keys(SECTION_MAP).some((emoji) => line.trimStart().startsWith(emoji));
}

function getSectionStyle(line) {
  for (const [emoji, style] of Object.entries(SECTION_MAP)) {
    if (line.trimStart().startsWith(emoji)) return { emoji, ...style };
  }
  return null;
}

/* ─── FULL MARKDOWN + STRUCTURED RENDERER ───────────────────────────────── */
export function renderMarkdown(text) {
  // Split into sections by emoji headers
  const lines = text.split("\n");
  const output = [];
  let sectionLines = [];
  let currentSection = null;
  let key = 0;

  function flushSection() {
    if (!currentSection && sectionLines.length === 0) return;
    if (currentSection) {
      output.push(
        <motion.div
          key={`section-${key++}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          style={{
            margin: "10px 0 4px",
            padding: "11px 14px",
            background: currentSection.bg,
            border: `1px solid ${currentSection.border}`,
            borderRadius: 12,
            display: "flex",
            flexDirection: "column",
            gap: 5,
          }}
        >
          {/* Section header line */}
          <p style={{ margin: 0, fontSize: 12.5, fontWeight: 800, color: "#f0f0f8", letterSpacing: "-0.1px" }}>
            {parseBold(currentSection.headerText)}
          </p>
          {/* Section body lines */}
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
    const sectionStyle = getSectionStyle(line);
    if (sectionStyle) {
      flushSection();
      currentSection = { ...sectionStyle, headerText: line.trim() };
    } else {
      sectionLines.push(line);
    }
  }
  flushSection();

  return output;
}

function renderLine(line, key) {
  // Code blocks handled separately — this is called per-line
  if (/^### /.test(line)) return <p key={key} style={{ fontSize: 13, fontWeight: 800, color: "#f0f0f8", margin: "12px 0 4px", letterSpacing: "-0.2px" }}>{parseBold(line.slice(4))}</p>;
  if (/^## /.test(line))  return <p key={key} style={{ fontSize: 14, fontWeight: 800, color: "#f0f0f8", margin: "14px 0 5px", letterSpacing: "-0.3px" }}>{parseBold(line.slice(3))}</p>;
  if (/^# /.test(line))   return <p key={key} style={{ fontSize: 15, fontWeight: 900, color: "#f0f0f8", margin: "16px 0 6px", letterSpacing: "-0.4px" }}>{parseBold(line.slice(2))}</p>;

  // Bullet — styled nicely
  if (/^[-*•] /.test(line)) {
    const content = line.slice(2).trim();
    // Detect "Label: **Value**" pattern for key-value bullets
    const kvMatch = content.match(/^(.+?):\s+(\*\*.+\*\*)(.*)$/);
    if (kvMatch) {
      return (
        <div key={key} style={{ display: "flex", gap: 8, margin: "3px 0", alignItems: "baseline" }}>
          <span style={{ color: C.accentLight, flexShrink: 0, marginTop: 1 }}>•</span>
          <span style={{ fontSize: 13, color: "rgba(240,240,248,0.82)" }}>
            <span style={{ color: "rgba(240,240,248,0.55)", fontWeight: 500 }}>{kvMatch[1]}: </span>
            {parseBold(kvMatch[2] + kvMatch[3])}
          </span>
        </div>
      );
    }
    return (
      <div key={key} style={{ display: "flex", gap: 8, margin: "3px 0", alignItems: "baseline" }}>
        <span style={{ color: C.accentLight, flexShrink: 0, marginTop: 1 }}>•</span>
        <span style={{ fontSize: 13, color: "rgba(240,240,248,0.82)", lineHeight: 1.65 }}>{parseBold(content)}</span>
      </div>
    );
  }

  // Numbered list
  const numMatch = line.match(/^(\d+)\. /);
  if (numMatch) return (
    <div key={key} style={{ display: "flex", gap: 8, margin: "3px 0", alignItems: "baseline" }}>
      <span style={{ color: C.accentLight, flexShrink: 0, minWidth: 16, marginTop: 1, fontSize: 12, fontWeight: 700 }}>{numMatch[1]}.</span>
      <span style={{ fontSize: 13, color: "rgba(240,240,248,0.82)", lineHeight: 1.65 }}>{parseBold(line.slice(numMatch[0].length))}</span>
    </div>
  );

  if (/^---+$/.test(line.trim())) return <hr key={key} style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.07)", margin: "10px 0" }} />;
  if (line.trim() === "") return <div key={key} style={{ height: 6 }} />;

  return <span key={key} style={{ display: "block", fontSize: 14, color: "rgba(240,240,248,0.88)", lineHeight: 1.75 }}>{parseBold(line)}</span>;
}

/* ─── THINKING ANIMATION ────────────────────────────────────────────────── */
const THINKING_STEPS = [
  { text: "Reading document…",    icon: "📄" },
  { text: "Analyzing context…",   icon: "🔍" },
  { text: "Extracting insights…", icon: "💡" },
  { text: "Thinking…",            icon: "🧠" },
  { text: "Composing answer…",    icon: "✍️" },
];

export function ThinkingIndicator() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % THINKING_STEPS.length), 1800);
    return () => clearInterval(id);
  }, []);

  const current = THINKING_STEPS[step];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Pulsing status row */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25 }}
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <span style={{ fontSize: 15 }}>{current.icon}</span>
          <span style={{ fontSize: 12.5, color: C.accentLight, fontWeight: 600 }}>{current.text}</span>
          <span className="animate-blink" style={{ display: "inline-block", width: 2, height: 12, background: C.accentLight, borderRadius: 2, marginLeft: 1 }} />
        </motion.div>
      </AnimatePresence>

      {/* Skeleton lines */}
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {[90, 75, 55].map((w, i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
            style={{ height: 10, borderRadius: 6, background: "rgba(255,255,255,0.07)", width: `${w}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── TYPING DOTS (kept for streaming cursor) ────────────────────────────── */
export function TypingDots() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 2px" }}>
      {[0, 1, 2].map((i) => (
        <motion.span key={i}
          animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
          style={{ display: "block", width: 7, height: 7, borderRadius: "50%", background: C.accentLight }}
        />
      ))}
    </div>
  );
}

/* ─── CODE BLOCK SPLITTER ────────────────────────────────────────────────── */
function renderWithCodeBlocks(text) {
  const segments = text.split(/(```[\s\S]*?```)/g);
  return segments.map((seg, i) => {
    if (seg.startsWith("```")) {
      const inner = seg.slice(3).replace(/^[a-z]*\n/, "").replace(/```$/, "").trimEnd();
      return (
        <pre key={i} style={{ margin: "10px 0", padding: "13px 16px", background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, fontSize: 12.5, lineHeight: 1.65, overflowX: "auto", fontFamily: "'Fira Code','Cascadia Code',monospace", color: "#e2e8f0", whiteSpace: "pre" }}>
          {inner}
        </pre>
      );
    }
    return <div key={i}>{renderMarkdown(seg)}</div>;
  });
}

/* ─── CHAT MESSAGE ───────────────────────────────────────────────────────── */
export default function ChatMessage({ msg, onCopy, onShare, userInitial, onUpgrade }) {
  const isUser     = msg.role === "user";
  const isThinking = msg.streaming && !msg.content;

  if (msg.locked) return <LockedMessage onUpgrade={onUpgrade} />;

  const [feedback, setFeedback] = useState(null);
  const [copied,   setCopied]   = useState(false);

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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      style={{ display: "flex", gap: 12, justifyContent: isUser ? "flex-end" : "flex-start", alignItems: "flex-start" }}
    >
      {/* AI avatar */}
      {!isUser && (
        <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2, boxShadow: "0 4px 18px rgba(124,58,237,0.35)" }}>
          <SparkleIcon />
        </div>
      )}

      <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{
          padding: isUser ? "12px 17px" : "14px 18px",
          borderRadius: isUser ? "20px 20px 5px 20px" : "5px 20px 20px 20px",
          fontSize: 14,
          lineHeight: 1.82,
          wordBreak: "break-word",
          overflowWrap: "break-word",
          background: isUser
            ? "linear-gradient(135deg,#7c3aed,#6d28d9)"
            : msg.isError
              ? "rgba(239,68,68,0.06)"
              : "rgba(255,255,255,0.04)",
          border: isUser ? "none" : msg.isError ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(255,255,255,0.08)",
          color: isUser ? "white" : "rgba(240,240,248,0.92)",
          boxShadow: isUser ? "0 4px 22px rgba(124,58,237,0.28)" : "none",
          backdropFilter: isUser ? "none" : "blur(8px)",
          minWidth: isThinking ? 220 : undefined,
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

        {/* Action bar — only on complete AI messages */}
        {!isUser && !msg.streaming && msg.content && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.05 }}
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

            <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.07)", margin: "0 2px" }} />

            {/* Thumbs */}
            <ThumbBtn active={feedback === "up"} color="green" onClick={() => setFeedback(feedback === "up" ? null : "up")}>👍</ThumbBtn>
            <ThumbBtn active={feedback === "down"} color="red"  onClick={() => setFeedback(feedback === "down" ? null : "down")}>👎</ThumbBtn>
          </motion.div>
        )}
      </div>

      {/* User avatar */}
      {isUser && (
        <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2, fontSize: 13, fontWeight: 800, color: C.textSecondary }}>
          {userInitial}
        </div>
      )}
    </motion.div>
  );
}

/* ─── SHARED MICRO COMPONENTS ────────────────────────────────────────────── */
function ActionBtn({ onClick, active, activeColor, children }) {
  return (
    <motion.button
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 4,
        fontSize: 11, fontWeight: 600,
        color: active && activeColor ? activeColor : C.textMuted,
        background: active && activeColor ? `rgba(74,222,128,0.08)` : "rgba(255,255,255,0.04)",
        border: `1px solid ${active && activeColor ? "rgba(74,222,128,0.22)" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 7, padding: "4px 9px", cursor: "pointer", transition: "all 0.15s",
      }}
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
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, background: active ? bg : "rgba(255,255,255,0.04)", border: `1px solid ${active ? bd : "rgba(255,255,255,0.07)"}`, borderRadius: 7, cursor: "pointer", transition: "all 0.15s" }}
    >
      {children}
    </motion.button>
  );
}
