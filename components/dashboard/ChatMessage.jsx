"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { C } from "./tokens";
import { SparkleIcon, CopyIcon, ShareIcon, CheckIcon } from "./icons";
import { LockedMessage } from "./UpgradePopup";

/* ─── MARKDOWN RENDERER ──────────────────────────────────────────────────── */
export function parseBold(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i} style={{ color: "rgba(240,240,248,0.98)", fontWeight: 700 }}>{part.slice(2, -2)}</strong>
      : part
  );
}

export function renderMarkdown(text) {
  const segments = text.split(/(```[\s\S]*?```|`[^`]+`)/g);
  return segments.map((seg, i) => {
    if (seg.startsWith("```")) {
      const inner = seg.slice(3).replace(/^[a-z]*\n/, "").replace(/```$/, "").trimEnd();
      return (
        <pre key={i} style={{ margin: "10px 0", padding: "13px 16px", background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, fontSize: 12.5, lineHeight: 1.65, overflowX: "auto", fontFamily: "'Fira Code','Cascadia Code',monospace", color: "#e2e8f0", whiteSpace: "pre" }}>
          {inner}
        </pre>
      );
    }
    if (seg.startsWith("`") && seg.endsWith("`")) {
      return <code key={i} style={{ fontSize: 12.5, padding: "2px 6px", background: "rgba(124,58,237,0.18)", border: "1px solid rgba(124,58,237,0.22)", borderRadius: 5, fontFamily: "monospace", color: "#c4b5fd" }}>{seg.slice(1, -1)}</code>;
    }
    const lines = seg.split("\n");
    return lines.map((line, li) => {
      const key = `${i}-${li}`;
      if (/^### /.test(line)) return <p key={key} style={{ fontSize: 13, fontWeight: 800, color: "rgba(240,240,248,0.95)", margin: "14px 0 5px", letterSpacing: "-0.2px" }}>{parseBold(line.slice(4))}</p>;
      if (/^## /.test(line))  return <p key={key} style={{ fontSize: 14, fontWeight: 800, color: "rgba(240,240,248,0.98)", margin: "16px 0 6px", letterSpacing: "-0.3px" }}>{parseBold(line.slice(3))}</p>;
      if (/^# /.test(line))   return <p key={key} style={{ fontSize: 15, fontWeight: 900, color: "rgba(240,240,248,0.98)", margin: "18px 0 8px", letterSpacing: "-0.4px" }}>{parseBold(line.slice(2))}</p>;
      if (/^[-*] /.test(line)) return <div key={key} style={{ display: "flex", gap: 8, margin: "4px 0" }}><span style={{ color: C.accentLight, flexShrink: 0, marginTop: 1 }}>•</span><span>{parseBold(line.slice(2))}</span></div>;
      const numMatch = line.match(/^(\d+)\. /);
      if (numMatch) return <div key={key} style={{ display: "flex", gap: 8, margin: "4px 0" }}><span style={{ color: C.accentLight, flexShrink: 0, minWidth: 16, marginTop: 1 }}>{numMatch[1]}.</span><span>{parseBold(line.slice(numMatch[0].length))}</span></div>;
      if (/^---+$/.test(line.trim())) return <hr key={key} style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.07)", margin: "12px 0" }} />;
      if (line.trim() === "") return li > 0 ? <div key={key} style={{ height: 8 }} /> : null;
      return <span key={key} style={{ display: "block" }}>{parseBold(line)}</span>;
    });
  });
}

/* ─── TYPING DOTS ────────────────────────────────────────────────────────── */
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      style={{ display: "flex", gap: 12, justifyContent: isUser ? "flex-end" : "flex-start", alignItems: "flex-start" }}
    >
      {!isUser && (
        <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2, boxShadow: "0 4px 18px rgba(124,58,237,0.35)" }}>
          <SparkleIcon />
        </div>
      )}

      <div style={{ maxWidth: "65%", display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{
          padding: "14px 18px",
          borderRadius: isUser ? "20px 20px 5px 20px" : "5px 20px 20px 20px",
          fontSize: 14,
          lineHeight: 1.82,
          wordBreak: "break-word",
          overflowWrap: "break-word",
          background: isUser ? "linear-gradient(135deg,#7c3aed,#6d28d9)" : "rgba(255,255,255,0.05)",
          border: isUser ? "none" : "1px solid rgba(255,255,255,0.08)",
          color: isUser ? "white" : "rgba(240,240,248,0.92)",
          boxShadow: isUser ? "0 4px 22px rgba(124,58,237,0.28)" : "none",
          backdropFilter: isUser ? "none" : "blur(8px)",
        }}>
          {isThinking ? (
            <TypingDots />
          ) : isUser ? (
            <span style={{ whiteSpace: "pre-wrap" }}>{msg.content}</span>
          ) : (
            <>
              {renderMarkdown(msg.content)}
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

        {!isUser && !msg.streaming && msg.content && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.05 }}
            style={{ display: "flex", alignItems: "center", gap: 4, paddingLeft: 2 }}
          >
            <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
              onClick={handleCopy}
              style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: copied ? C.green : C.textMuted, background: copied ? "rgba(74,222,128,0.08)" : "rgba(255,255,255,0.04)", border: `1px solid ${copied ? "rgba(74,222,128,0.22)" : "rgba(255,255,255,0.07)"}`, borderRadius: 7, padding: "4px 9px", cursor: "pointer", transition: "all 0.15s" }}>
              {copied ? <svg width="11" height="11" fill="none" stroke={C.green} viewBox="0 0 24 24" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> : <CopyIcon />}
              {copied ? "Copied!" : "Copy"}
            </motion.button>

            <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
              onClick={() => onShare(msg.content)}
              style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: C.textMuted, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 7, padding: "4px 9px", cursor: "pointer", transition: "all 0.15s" }}>
              <ShareIcon /> Share
            </motion.button>

            <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.07)", margin: "0 2px" }} />

            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={() => setFeedback(feedback === "up" ? null : "up")}
              style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, background: feedback === "up" ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${feedback === "up" ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.07)"}`, borderRadius: 7, cursor: "pointer", transition: "all 0.15s" }}>
              👍
            </motion.button>

            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={() => setFeedback(feedback === "down" ? null : "down")}
              style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, background: feedback === "down" ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${feedback === "down" ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.07)"}`, borderRadius: 7, cursor: "pointer", transition: "all 0.15s" }}>
              👎
            </motion.button>
          </motion.div>
        )}
      </div>

      {isUser && (
        <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2, fontSize: 13, fontWeight: 800, color: C.textSecondary }}>
          {userInitial}
        </div>
      )}
    </motion.div>
  );
}
