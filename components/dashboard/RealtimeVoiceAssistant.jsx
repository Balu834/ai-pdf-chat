"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Constants ─────────────────────────────────────────────────────────────────
const VOICES = [
  { id: "nova",    label: "Nova",    desc: "Warm"          },
  { id: "alloy",   label: "Alloy",   desc: "Neutral"       },
  { id: "echo",    label: "Echo",    desc: "Deep"          },
  { id: "fable",   label: "Fable",   desc: "Expressive"    },
  { id: "onyx",    label: "Onyx",    desc: "Authoritative" },
  { id: "shimmer", label: "Shimmer", desc: "Soft"          },
];

const AGENT_MODES = [
  { id: "general",   icon: "✦", label: "General",    desc: "All-purpose assistant"      },
  { id: "document",  icon: "◎", label: "Document",   desc: "Analyse uploaded PDFs"      },
  { id: "assistant", icon: "◈", label: "Assistant",  desc: "Concise & action-oriented"  },
  { id: "creative",  icon: "◇", label: "Creative",   desc: "Expressive & imaginative"   },
];

const CFG = {
  idle:      { label: "Tap to start", color: "#94a3b8", glow: "rgba(148,163,184,0.18)", ring: "rgba(148,163,184,0.25)", bg: "rgba(148,163,184,0.07)" },
  listening: { label: "Listening",   color: "#a78bfa", glow: "rgba(167,139,250,0.30)", ring: "rgba(167,139,250,0.35)", bg: "rgba(167,139,250,0.09)" },
  thinking:  { label: "Thinking",    color: "#60a5fa", glow: "rgba(96,165,250,0.30)",  ring: "rgba(96,165,250,0.35)",  bg: "rgba(96,165,250,0.09)"  },
  speaking:  { label: "Speaking",    color: "#34d399", glow: "rgba(52,211,153,0.30)",  ring: "rgba(52,211,153,0.35)",  bg: "rgba(52,211,153,0.09)"  },
};

// ── Pre-compute stable speaking animation params (outside component) ──────────
const N_BARS = 24;
const SPEAKING_PARAMS = Array.from({ length: N_BARS }, (_, i) => ({
  duration: 0.42 + Math.abs(Math.sin(i * 1.3)) * 0.46,
  delay:    (i / N_BARS) * 0.72,
  peak:     10 + Math.abs(Math.sin(i * 0.9 + 0.5)) * 26,
  min:      3,
}));

// ── CSS injection ─────────────────────────────────────────────────────────────
function InjectCSS() {
  const done = useRef(false);
  useEffect(() => {
    if (done.current || typeof document === "undefined") return;
    done.current = true;
    const s = document.createElement("style");
    s.textContent = `
      @keyframes rva-spin    { to { transform: rotate(360deg); } }
      @keyframes rva-cursor  { 0%,100%{opacity:1} 50%{opacity:0} }
      @keyframes rva-fadeIn  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
      .rva-scroll::-webkit-scrollbar       { width: 4px }
      .rva-scroll::-webkit-scrollbar-track { background: transparent }
      .rva-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px }
      @media (max-width: 620px) {
        .rva-two-col { flex-direction: column !important; }
        .rva-orb-col { width: 100% !important; padding-bottom: 0 !important; }
        .rva-hist-col { min-height: 160px; }
      }
    `;
    document.head.appendChild(s);
  }, []);
  return null;
}

// ── Radial waveform (mic data OR synthetic speaking animation) ─────────────────
function RadialWaveform({ waveform, state, color }) {
  const isSpeaking = state === "speaking";
  return (
    <>
      {Array.from({ length: N_BARS }, (_, i) => {
        const angle  = (i / N_BARS) * 2 * Math.PI - Math.PI / 2;
        const baseR  = 68;
        const x      = Math.cos(angle) * baseR;
        const y      = Math.sin(angle) * baseR;
        const deg    = (angle * 180) / Math.PI + 90;

        if (isSpeaking) {
          const p = SPEAKING_PARAMS[i];
          return (
            <motion.div
              key={i}
              animate={{ height: [p.min, p.peak, p.min], opacity: [0.35, 0.85, 0.35] }}
              transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
              style={{
                position:        "absolute",
                width:           3,
                borderRadius:    2,
                background:      color,
                left:            `calc(50% + ${x}px - 1.5px)`,
                top:             `calc(50% + ${y}px - ${p.peak / 2}px)`,
                transform:       `rotate(${deg}deg)`,
                transformOrigin: "center",
                pointerEvents:   "none",
              }}
            />
          );
        }

        // Listening / thinking / idle — driven by mic data
        const v      = waveform[i] ?? 0;
        const active = state === "listening";
        const barLen = active ? Math.max(5, v * 44) : 4;
        return (
          <motion.div
            key={i}
            animate={{ height: barLen, opacity: active ? 0.42 + v * 0.58 : 0.14 }}
            transition={{ duration: 0.07, ease: "linear" }}
            style={{
              position:        "absolute",
              width:           3,
              height:          barLen,
              borderRadius:    2,
              background:      color,
              left:            `calc(50% + ${x}px - 1.5px)`,
              top:             `calc(50% + ${y}px - ${barLen / 2}px)`,
              transform:       `rotate(${deg}deg)`,
              transformOrigin: "center",
              pointerEvents:   "none",
            }}
          />
        );
      })}
    </>
  );
}

// ── Orb center icon ───────────────────────────────────────────────────────────
function OrbIcon({ state, color }) {
  if (state === "thinking") {
    return (
      <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
        {[0, 1, 2].map((i) => (
          <motion.div key={i}
            animate={{ y: [0, -10, 0], opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 0.72, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
            style={{ width: 10, height: 10, borderRadius: "50%", background: color }}
          />
        ))}
      </div>
    );
  }
  if (state === "speaking") {
    const heights = [0.3, 0.75, 1, 0.75, 0.3];
    return (
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 32 }}>
        {heights.map((h, i) => (
          <motion.div key={i}
            animate={{ scaleY: [h, 1, h] }}
            transition={{ duration: 0.44 + i * 0.06, repeat: Infinity, delay: i * 0.07, ease: "easeInOut" }}
            style={{ width: 5, height: "100%", borderRadius: 3, background: color, transformOrigin: "bottom" }}
          />
        ))}
      </div>
    );
  }
  // idle / listening — mic
  return (
    <svg width="36" height="36" fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
      <rect x="9" y="2" width="6" height="12" rx="3"
        fill={state === "listening" ? `${color}22` : "none"}
        stroke={color} strokeWidth="1.8"
      />
      <path strokeLinecap="round" d="M5 10a7 7 0 0014 0" />
      <line x1="12" y1="19" x2="12" y2="22" strokeLinecap="round" />
      <line x1="9"  y1="22" x2="15" y2="22" strokeLinecap="round" />
    </svg>
  );
}

// ── Pulse rings ───────────────────────────────────────────────────────────────
function PulseRings({ color }) {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <motion.div key={i}
          animate={{ scale: [1, 1.9 + i * 0.22], opacity: [0.38, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.58, ease: "easeOut" }}
          style={{ position: "absolute", width: 108, height: 108, borderRadius: "50%", border: `1.5px solid ${color}`, pointerEvents: "none" }}
        />
      ))}
    </>
  );
}

// ── Conversation bubble ───────────────────────────────────────────────────────
function Bubble({ role, content }) {
  const isUser = role === "user";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start", gap: 3, animation: "rva-fadeIn 0.2s ease" }}>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", color: isUser ? "#a78bfa" : "#34d399", textTransform: "uppercase", paddingInline: 4 }}>
        {isUser ? "You" : "AI"}
      </span>
      <div style={{
        maxWidth: "92%", padding: "9px 14px",
        borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
        background: isUser ? "rgba(167,139,250,0.1)" : "rgba(52,211,153,0.08)",
        border: isUser ? "1px solid rgba(167,139,250,0.2)" : "1px solid rgba(52,211,153,0.16)",
        fontSize: 13.5, lineHeight: 1.65, color: "rgba(240,240,248,0.88)", wordBreak: "break-word",
      }}>
        {content}
      </div>
    </div>
  );
}

// ── Voice pill ────────────────────────────────────────────────────────────────
function VoicePill({ v, active, onClick }) {
  return (
    <motion.button onClick={() => onClick(v.id)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
      style={{
        padding: "5px 13px", borderRadius: 99, cursor: "pointer", lineHeight: 1, whiteSpace: "nowrap",
        border:      active ? "1px solid rgba(167,139,250,0.55)" : "1px solid rgba(255,255,255,0.1)",
        background:  active ? "rgba(167,139,250,0.18)"           : "rgba(255,255,255,0.04)",
        color:       active ? "#c4b5fd"                          : "rgba(240,240,248,0.4)",
        fontSize:    12, fontWeight: active ? 700 : 400, transition: "all 0.15s",
      }}>
      {v.label}{active && <span style={{ marginLeft: 4, fontSize: 10, opacity: 0.6 }}>{v.desc}</span>}
    </motion.button>
  );
}

// ── Session timer ─────────────────────────────────────────────────────────────
function SessionTimer({ active }) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (!active) { setSecs(0); return; }
    const id = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [active]);
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  return <span style={{ fontSize: 11, color: "rgba(240,240,248,0.28)", fontVariantNumeric: "tabular-nums", letterSpacing: "0.04em" }}>{mm}:{ss}</span>;
}

// ── Pre-launch config screen ──────────────────────────────────────────────────
function LaunchScreen({ voice, agentMode, changeVoice, changeAgentMode, onStart }) {
  return (
    <motion.div
      key="launch"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.2 }}
      style={{
        position: "fixed", inset: 0, zIndex: 1200,
        background: "rgba(3,1,12,0.97)", backdropFilter: "blur(32px)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 0, padding: 24,
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 36, textAlign: "center" }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16, margin: "0 auto 16px",
          background: "linear-gradient(135deg, rgba(167,139,250,0.3), rgba(96,165,250,0.3))",
          border: "1px solid rgba(167,139,250,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="26" height="26" fill="none" stroke="#a78bfa" strokeWidth="1.8" viewBox="0 0 24 24">
            <rect x="9" y="2" width="6" height="12" rx="3" fill="rgba(167,139,250,0.15)" stroke="#a78bfa" strokeWidth="1.8"/>
            <path strokeLinecap="round" d="M5 10a7 7 0 0014 0"/>
            <line x1="12" y1="19" x2="12" y2="22" strokeLinecap="round"/>
            <line x1="9" y1="22" x2="15" y2="22" strokeLinecap="round"/>
          </svg>
        </div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "rgba(240,240,248,0.92)", letterSpacing: "-0.01em" }}>
          Voice Agent
        </h2>
        <p style={{ margin: "6px 0 0", fontSize: 13, color: "rgba(240,240,248,0.38)", lineHeight: 1.5 }}>
          Continuous voice conversation · Interruptible · Ultra-low latency
        </p>
      </div>

      {/* Agent mode */}
      <div style={{ width: "100%", maxWidth: 460, marginBottom: 24 }}>
        <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(240,240,248,0.3)", textTransform: "uppercase", marginBottom: 10 }}>
          Agent Mode
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {AGENT_MODES.map((m) => {
            const active = agentMode === m.id;
            return (
              <motion.button key={m.id} onClick={() => changeAgentMode(m.id)}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                style={{
                  padding: "12px 14px", borderRadius: 12, cursor: "pointer", textAlign: "left",
                  border:      active ? "1px solid rgba(167,139,250,0.5)" : "1px solid rgba(255,255,255,0.08)",
                  background:  active ? "rgba(167,139,250,0.12)"          : "rgba(255,255,255,0.03)",
                  transition: "all 0.15s",
                }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 15, color: active ? "#c4b5fd" : "rgba(240,240,248,0.4)" }}>{m.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: active ? "#e9d5ff" : "rgba(240,240,248,0.55)" }}>{m.label}</span>
                </div>
                <p style={{ margin: 0, fontSize: 11, color: "rgba(240,240,248,0.3)", lineHeight: 1.4 }}>{m.desc}</p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Voice selector */}
      <div style={{ width: "100%", maxWidth: 460, marginBottom: 32 }}>
        <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(240,240,248,0.3)", textTransform: "uppercase", marginBottom: 10 }}>
          Voice
        </label>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          {VOICES.map((v) => (
            <VoicePill key={v.id} v={v} active={voice === v.id} onClick={changeVoice} />
          ))}
        </div>
      </div>

      {/* Start button */}
      <motion.button
        onClick={onStart}
        whileHover={{ scale: 1.03, boxShadow: "0 0 40px 8px rgba(167,139,250,0.25)" }}
        whileTap={{ scale: 0.97 }}
        style={{
          padding: "14px 48px", borderRadius: 14, cursor: "pointer",
          background: "linear-gradient(135deg, rgba(167,139,250,0.9), rgba(96,165,250,0.85))",
          border: "1px solid rgba(167,139,250,0.4)",
          color: "#fff", fontSize: 15, fontWeight: 700, letterSpacing: "0.01em",
          boxShadow: "0 0 24px 4px rgba(167,139,250,0.18)",
          transition: "all 0.2s",
        }}
      >
        Start Conversation
      </motion.button>

      <p style={{ marginTop: 14, fontSize: 11, color: "rgba(240,240,248,0.2)", textAlign: "center" }}>
        Microphone access required · Chrome / Edge recommended
      </p>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function RealtimeVoiceAssistant({ rtv }) {
  const {
    state, active, toggle, start, stop,
    transcript, aiText, waveform, error, clearError,
    voice, changeVoice, agentMode, changeAgentMode,
    history, clearHistory,
  } = rtv;

  const [showLaunch, setShowLaunch] = useState(false);
  const cfg        = CFG[state];
  const showRings  = state === "listening" || state === "speaking";
  const histEl     = useRef(null);

  // Toggle launch screen visibility
  const openLaunch = () => setShowLaunch(true);
  const onStart    = () => { setShowLaunch(false); start(); };
  const onClose    = () => { setShowLaunch(false); if (active) stop(); };

  // Expose a "open" trigger so page.js can call rtv.open() if it wants
  useEffect(() => {
    if (rtv) rtv._openLaunch = openLaunch;
  });

  // Auto-scroll conversation to bottom
  useEffect(() => {
    if (histEl.current) histEl.current.scrollTop = histEl.current.scrollHeight;
  }, [history, aiText]);

  // Swallow space-bar while active (no page scroll)
  useEffect(() => {
    if (!active) return;
    const onKey = (e) => {
      if (e.code === "Space" &&
          (e.target).tagName !== "INPUT" &&
          (e.target).tagName !== "TEXTAREA") e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  return (
    <>
      <InjectCSS />

      {/* ── Launch/config screen ── */}
      <AnimatePresence>
        {showLaunch && !active && (
          <LaunchScreen
            voice={voice} agentMode={agentMode}
            changeVoice={changeVoice} changeAgentMode={changeAgentMode}
            onStart={onStart}
          />
        )}
      </AnimatePresence>

      {/* ── Active voice session overlay ── */}
      <AnimatePresence>
        {active && (
          <motion.div
            key="rva-session"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "fixed", inset: 0, zIndex: 1200,
              background: "rgba(3,1,12,0.96)", backdropFilter: "blur(32px)",
              display: "flex", flexDirection: "column",
              overflow: "hidden", userSelect: "none",
            }}
          >

            {/* ── Top bar ── */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 18px", flexShrink: 0,
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}>
              {/* Left: brand + mode */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: "linear-gradient(135deg,rgba(167,139,250,0.35),rgba(96,165,250,0.3))",
                  border: "1px solid rgba(167,139,250,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, color: "#a78bfa",
                }}>
                  {AGENT_MODES.find((m) => m.id === agentMode)?.icon ?? "✦"}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(240,240,248,0.75)", lineHeight: 1.2 }}>
                    Voice Agent
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(240,240,248,0.28)", lineHeight: 1.2, textTransform: "capitalize" }}>
                    {agentMode} · {VOICES.find((v) => v.id === voice)?.label}
                  </div>
                </div>
              </div>

              {/* Center: state badge */}
              <motion.div
                key={state}
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1,  scale: 1 }}
                style={{
                  padding: "4px 13px", borderRadius: 99,
                  background: cfg.bg, border: `1px solid ${cfg.ring}`,
                  fontSize: 11, fontWeight: 700, color: cfg.color, letterSpacing: "0.05em", whiteSpace: "nowrap",
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                <span style={{
                  width: 6, height: 6, borderRadius: "50%", background: cfg.color, display: "inline-block",
                  ...(state !== "idle" ? { animation: "rva-spin 1.1s linear infinite" } : {}),
                }} />
                {cfg.label}
              </motion.div>

              {/* Right: timer + clear + close */}
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <SessionTimer active={active} />
                {history.length > 0 && (
                  <motion.button onClick={clearHistory} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                    title="Clear conversation"
                    style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", cursor: "pointer", color: "rgba(240,240,248,0.38)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, transition: "all 0.15s" }}>
                    ↺
                  </motion.button>
                )}
                <motion.button onClick={onClose} whileHover={{ scale: 1.08, background: "rgba(239,68,68,0.1)" }} whileTap={{ scale: 0.92 }}
                  style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", cursor: "pointer", color: "rgba(240,240,248,0.45)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, lineHeight: 1, transition: "all 0.15s" }}>
                  ✕
                </motion.button>
              </div>
            </div>

            {/* ── Error toast ── */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  onClick={clearError}
                  style={{ position: "absolute", top: 60, left: "50%", transform: "translateX(-50%)", zIndex: 10, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "8px 18px", fontSize: 12, color: "#fca5a5", cursor: "pointer", whiteSpace: "nowrap", maxWidth: "85vw", textAlign: "center" }}>
                  {error}&nbsp;✕
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Body: conversation + orb ── */}
            <div className="rva-two-col" style={{ flex: 1, display: "flex", overflow: "hidden", padding: "0 12px" }}>

              {/* Conversation history */}
              <div ref={histEl} className="rva-hist-col rva-scroll"
                style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14, padding: "18px 8px 18px 4px", minWidth: 0 }}>

                {history.length === 0 && !transcript && !aiText && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 10, opacity: 0.3, paddingTop: 36 }}>
                    <svg width="36" height="36" fill="none" stroke="rgba(240,240,248,0.6)" strokeWidth="1.3" viewBox="0 0 24 24">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    <p style={{ margin: 0, fontSize: 12, color: "rgba(240,240,248,0.5)", textAlign: "center", lineHeight: 1.7 }}>
                      Start speaking.<br />Conversation appears here.
                    </p>
                  </div>
                )}

                {/* Completed turns */}
                {history.map((turn, i) => <Bubble key={i} role={turn.role} content={turn.content} />)}

                {/* Live user transcript */}
                <AnimatePresence>
                  {transcript && state !== "idle" && !history.some((t) => t.role === "user" && t.content === transcript) && (
                    <motion.div key="live-user" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <Bubble role="user" content={transcript} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Live AI stream */}
                <AnimatePresence>
                  {aiText && (state === "thinking" || state === "speaking") && (
                    <motion.div key="live-ai" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 3 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", color: "#34d399", textTransform: "uppercase", paddingInline: 4 }}>AI</span>
                      <div style={{ maxWidth: "92%", padding: "9px 14px", borderRadius: "16px 16px 16px 4px", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.16)", fontSize: 13.5, lineHeight: 1.65, color: "rgba(240,240,248,0.88)" }}>
                        {aiText}
                        {state === "thinking" && (
                          <span style={{ display: "inline-block", width: 2, height: "0.9em", background: "#34d399", marginLeft: 3, borderRadius: 2, verticalAlign: "text-bottom", animation: "rva-cursor 0.55s steps(1) infinite" }} />
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Orb column */}
              <div className="rva-orb-col" style={{ width: 210, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 0", gap: 12 }}>

                {/* Orb arena */}
                <div style={{ position: "relative", width: 200, height: 200, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>

                  {showRings && <PulseRings color={cfg.ring} />}

                  <RadialWaveform waveform={waveform} state={state} color={cfg.color} />

                  {/* Orb */}
                  <motion.div
                    animate={{
                      scale:     state === "speaking"  ? [1, 1.09, 1] :
                                 state === "listening" ? [1, 1.04, 1] : 1,
                      boxShadow: `0 0 52px 14px ${cfg.glow}`,
                    }}
                    transition={{ duration: state === "speaking" ? 1.0 : 1.6, repeat: Infinity, ease: "easeInOut" }}
                    onClick={toggle}
                    style={{
                      width: 100, height: 100, borderRadius: "50%", cursor: "pointer", position: "relative", zIndex: 2,
                      background: `radial-gradient(circle at 35% 30%, ${cfg.color}3a, ${cfg.color}12 70%, transparent)`,
                      border: `2px solid ${cfg.color}42`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <div style={{ position: "absolute", inset: 6, borderRadius: "50%", background: `radial-gradient(circle, ${cfg.color}18, transparent)`, pointerEvents: "none" }} />
                    <OrbIcon state={state} color={cfg.color} />
                  </motion.div>
                </div>

                {/* Interrupt hint */}
                <AnimatePresence>
                  {(state === "speaking" || state === "thinking") && (
                    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <motion.button
                        onClick={() => { rtv.stop && rtv.stop(); rtv.start && setTimeout(rtv.start, 100); }}
                        whileHover={{ scale: 1.05, background: "rgba(239,68,68,0.16)" }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                          padding: "6px 16px", borderRadius: 99, cursor: "pointer",
                          background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
                          color: "#f87171", fontSize: 11, fontWeight: 600, letterSpacing: "0.04em",
                          transition: "all 0.15s",
                        }}
                      >
                        ✕ Interrupt
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* ── Bottom: voice selector ── */}
            <div style={{ padding: "12px 18px 16px", borderTop: "1px solid rgba(255,255,255,0.05)", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(240,240,248,0.25)", textTransform: "uppercase" }}>Voice</span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                {VOICES.map((v) => <VoicePill key={v.id} v={v} active={voice === v.id} onClick={changeVoice} />)}
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
