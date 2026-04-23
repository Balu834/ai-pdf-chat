"use client";

import { motion, AnimatePresence } from "framer-motion";

const STATE_LABEL = {
  listening: "Listening…",
  thinking:  "Thinking…",
  speaking:  "Speaking…",
  idle:      "Voice Mode",
};

const STATE_COLOR = {
  listening: "#a78bfa",
  thinking:  "#60a5fa",
  speaking:  "#34d399",
  idle:      "rgba(200,200,230,0.5)",
};

/* Animated waveform — 4 bars that bounce while listening */
function Waveform({ active }) {
  return (
    <span style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 14 }}>
      {[0, 1, 2, 3].map((i) => (
        <motion.span
          key={i}
          animate={active ? { scaleY: [0.3, 1, 0.3] } : { scaleY: 0.3 }}
          transition={{ duration: 0.6, repeat: active ? Infinity : 0, delay: i * 0.1, ease: "easeInOut" }}
          style={{ display: "block", width: 3, height: "100%", background: STATE_COLOR.listening, borderRadius: 3, transformOrigin: "bottom" }}
        />
      ))}
    </span>
  );
}

/* Pulsing dot for thinking */
function ThinkingDot() {
  return (
    <motion.span
      animate={{ opacity: [1, 0.2, 1] }}
      transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
      style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: STATE_COLOR.thinking }}
    />
  );
}

export default function VoiceConvBar({ convState, onStop, onInterrupt, error, onClearError }) {
  const color = STATE_COLOR[convState] ?? STATE_COLOR.idle;

  return (
    <AnimatePresence>
      <motion.div
        key="voice-bar"
        initial={{ opacity: 0, y: -10, height: 0 }}
        animate={{ opacity: 1, y: 0,   height: "auto" }}
        exit={{    opacity: 0, y: -6,  height: 0 }}
        style={{ flexShrink: 0, overflow: "hidden" }}
      >
        <div style={{
          margin: "6px 16px 0",
          padding: "10px 14px",
          background: "rgba(10,10,28,0.85)",
          border: `1px solid ${color}44`,
          borderRadius: 14,
          backdropFilter: "blur(16px)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}>
          {/* State indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
            {convState === "listening" && <Waveform active />}
            {convState === "thinking"  && <ThinkingDot />}
            {convState === "speaking"  && (
              <motion.span
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
                style={{ fontSize: 14 }}
              >
                🔊
              </motion.span>
            )}

            <span style={{ fontSize: 12, fontWeight: 700, color, letterSpacing: "0.2px" }}>
              {STATE_LABEL[convState]}
            </span>

            <span style={{ fontSize: 11, color: "rgba(180,180,220,0.4)", marginLeft: 2 }}>
              {convState === "listening" ? "Speak now" :
               convState === "thinking"  ? "AI is answering…" :
               convState === "speaking"  ? "Tap mic to interrupt" : ""}
            </span>
          </div>

          {/* Interrupt button — only when AI is speaking */}
          {convState === "speaking" && (
            <motion.button
              whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
              onClick={onInterrupt}
              title="Interrupt — start listening now"
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", background: "rgba(124,58,237,0.14)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 8, fontSize: 11, fontWeight: 700, color: "#a78bfa", cursor: "pointer" }}
            >
              <svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a3 3 0 013 3v6a3 3 0 11-6 0V5a3 3 0 013-3z"/><path d="M19 10v1a7 7 0 01-14 0v-1"/></svg>
              Interrupt
            </motion.button>
          )}

          {/* Stop voice mode */}
          <motion.button
            whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
            onClick={onStop}
            title="Stop voice mode"
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.22)", borderRadius: 8, fontSize: 11, fontWeight: 700, color: "#f87171", cursor: "pointer", flexShrink: 0 }}
          >
            <svg width="9" height="9" fill="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
            Stop
          </motion.button>
        </div>

        {/* Error banner inside voice bar */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ margin: "6px 16px 0", padding: "9px 13px", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.22)", borderRadius: 10, display: "flex", alignItems: "flex-start", gap: 8 }}
          >
            <span style={{ fontSize: 13, flexShrink: 0 }}>🎙️</span>
            <span style={{ fontSize: 12, color: "#fca5a5", lineHeight: 1.5, flex: 1 }}>{error}</span>
            <button onClick={onClearError} style={{ background: "none", border: "none", cursor: "pointer", color: "#f87171", fontSize: 14, padding: "0 2px", flexShrink: 0 }}>×</button>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
