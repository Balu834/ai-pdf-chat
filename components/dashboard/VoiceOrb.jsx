"use client";

import { motion, AnimatePresence } from "framer-motion";

/* ── Language options ───────────────────────────────────────────────────── */
const LANGS = [
  { code: "en-US", label: "🇺🇸 English (US)" },
  { code: "en-GB", label: "🇬🇧 English (UK)" },
  { code: "hi-IN", label: "🇮🇳 Hindi" },
  { code: "es-ES", label: "🇪🇸 Spanish" },
  { code: "fr-FR", label: "🇫🇷 French" },
  { code: "de-DE", label: "🇩🇪 German" },
  { code: "ja-JP", label: "🇯🇵 Japanese" },
  { code: "zh-CN", label: "🇨🇳 Chinese" },
  { code: "ar-SA", label: "🇸🇦 Arabic" },
  { code: "pt-BR", label: "🇧🇷 Portuguese" },
];

/* ── Per-state design tokens ─────────────────────────────────────────────── */
const CFG = {
  idle:      { color: "#7c7ca8",  glow: "rgba(124,124,168,0.18)", label: "Voice Ready",   hint: "Tap the orb to start listening" },
  listening: { color: "#a78bfa",  glow: "rgba(167,139,250,0.28)", label: "Listening…",    hint: "Speak now — I'm all ears" },
  thinking:  { color: "#60a5fa",  glow: "rgba(96,165,250,0.25)",  label: "Thinking…",     hint: "AI is generating your answer" },
  speaking:  { color: "#34d399",  glow: "rgba(52,211,153,0.25)",  label: "Speaking…",     hint: "Tap the orb to interrupt" },
};

/* ── Waveform bars ───────────────────────────────────────────────────────── */
function WaveBars({ color }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 38 }}>
      {[0.4, 0.7, 1, 0.85, 0.6, 0.9, 0.5].map((base, i) => (
        <motion.div
          key={i}
          animate={{ scaleY: [base * 0.3, base, base * 0.3] }}
          transition={{ duration: 0.45 + i * 0.06, repeat: Infinity, delay: i * 0.07, ease: "easeInOut" }}
          style={{
            width: 4, height: "100%", background: color,
            borderRadius: 4, transformOrigin: "bottom", opacity: 0.8,
          }}
        />
      ))}
    </div>
  );
}

/* ── 3 concentric pulse rings ────────────────────────────────────────────── */
function PulseRings({ color, glow }) {
  return (
    <>
      {[1.5, 1.28, 1.12].map((s, i) => (
        <motion.div
          key={i}
          animate={{ scale: [1, s, 1], opacity: [0.22, 0, 0.22] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.6, ease: "easeOut" }}
          style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            border: `2px solid ${color}`,
            boxShadow: `0 0 32px ${glow}`,
          }}
        />
      ))}
    </>
  );
}

/* ── Spinning gradient ring (thinking) ──────────────────────────────────── */
function SpinRing({ color }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
      style={{
        position: "absolute", inset: -5, borderRadius: "50%",
        background: `conic-gradient(${color} 0deg, transparent 220deg, ${color} 360deg)`,
        opacity: 0.65,
      }}
    />
  );
}

/* ── Orb inner icon ─────────────────────────────────────────────────────── */
function OrbIcon({ convState, color }) {
  if (convState === "listening") return (
    <svg width="54" height="54" fill="none" stroke={color} viewBox="0 0 24 24" strokeWidth="1.5">
      <rect x="9" y="2" width="6" height="11" rx="3"/>
      <path strokeLinecap="round" d="M5 10a7 7 0 0014 0"/>
      <line strokeLinecap="round" x1="12" y1="21" x2="12" y2="17"/>
      <line strokeLinecap="round" x1="9" y1="21" x2="15" y2="21"/>
    </svg>
  );

  if (convState === "thinking") return (
    <div style={{ display: "flex", gap: 9 }}>
      {[0, 1, 2].map((i) => (
        <motion.div key={i}
          animate={{ y: [0, -12, 0], opacity: [0.35, 1, 0.35] }}
          transition={{ duration: 0.72, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
          style={{ width: 11, height: 11, borderRadius: "50%", background: color }}
        />
      ))}
    </div>
  );

  if (convState === "speaking") return (
    <svg width="54" height="54" fill="none" stroke={color} viewBox="0 0 24 24" strokeWidth="1.5">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <path strokeLinecap="round" d="M15.54 8.46a5 5 0 010 7.07"/>
      <path strokeLinecap="round" d="M19.07 4.93a10 10 0 010 14.14"/>
    </svg>
  );

  // idle
  return (
    <svg width="54" height="54" fill="none" stroke={color} viewBox="0 0 24 24" strokeWidth="1.5" opacity="0.7">
      <rect x="9" y="2" width="6" height="11" rx="3"/>
      <path strokeLinecap="round" d="M5 10a7 7 0 0014 0"/>
      <line strokeLinecap="round" x1="12" y1="21" x2="12" y2="17"/>
      <line strokeLinecap="round" x1="9" y1="21" x2="15" y2="21"/>
    </svg>
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */
export default function VoiceOrb({
  convState = "idle",
  onStop, onInterrupt, onOrbTap,
  error, onClearError,
  transcript = "",
  langCode = "en-US",
  onLangChange,
}) {
  const cfg             = CFG[convState] ?? CFG.idle;
  const isListening     = convState === "listening";
  const isThinking      = convState === "thinking";
  const isSpeaking      = convState === "speaking";
  const isIdle          = convState === "idle";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(4,4,18,0.91)",
        backdropFilter: "blur(22px) saturate(140%)",
        WebkitBackdropFilter: "blur(22px) saturate(140%)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}
    >
      {/* ── Top-left: language picker ── */}
      <div style={{ position: "absolute", top: 22, left: 22 }}>
        <select
          value={langCode}
          onChange={(e) => onLangChange?.(e.target.value)}
          style={{
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.13)",
            borderRadius: 10, padding: "7px 13px",
            fontSize: 12, fontWeight: 600,
            color: "rgba(240,240,248,0.72)",
            cursor: "pointer", outline: "none",
            fontFamily: "inherit",
          }}
        >
          {LANGS.map((l) => (
            <option key={l.code} value={l.code} style={{ background: "#07071a" }}>
              {l.label}
            </option>
          ))}
        </select>
      </div>

      {/* ── Top-right: close ── */}
      <motion.button
        whileHover={{ scale: 1.1, background: "rgba(255,255,255,0.1)" }}
        whileTap={{ scale: 0.92 }}
        onClick={onStop}
        style={{
          position: "absolute", top: 22, right: 22,
          width: 40, height: 40, borderRadius: "50%",
          background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "rgba(240,240,248,0.65)", fontSize: 20,
          transition: "background 0.15s",
        }}
      >
        ×
      </motion.button>

      {/* ── Orb ── */}
      <motion.div
        onClick={() => {
          if (isSpeaking) onInterrupt?.();
          else if (isIdle) onOrbTap?.();
        }}
        style={{
          position: "relative",
          width: 190, height: 190,
          cursor: (isIdle || isSpeaking) ? "pointer" : "default",
          marginBottom: isListening ? 24 : 48,
        }}
      >
        {/* Concentric pulse rings */}
        {(isListening || isSpeaking) && <PulseRings color={cfg.color} glow={cfg.glow} />}

        {/* Thinking spin ring */}
        {isThinking && <SpinRing color={cfg.color} />}

        {/* Core orb */}
        <motion.div
          animate={isListening ? { scale: [1, 1.045, 1] } : { scale: 1 }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          style={{
            width: "100%", height: "100%", borderRadius: "50%",
            background: `radial-gradient(circle at 38% 34%, ${cfg.color}60 0%, ${cfg.color}22 50%, rgba(7,7,26,0.97) 100%)`,
            border: `2px solid ${cfg.color}55`,
            boxShadow: [
              `0 0 0 1px ${cfg.color}18`,
              `0 0 55px ${cfg.glow}`,
              `0 0 110px ${cfg.glow}55`,
              `inset 0 0 45px ${cfg.glow}25`,
            ].join(", "),
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <motion.div
            animate={isSpeaking ? { scale: [1, 1.14, 0.92, 1] } : { scale: 1 }}
            transition={{ duration: 0.55, repeat: Infinity, ease: "easeInOut" }}
          >
            <OrbIcon convState={convState} color={cfg.color} />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* ── Waveform (listening only) ── */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            key="wave"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ marginBottom: 28 }}
          >
            <WaveBars color={cfg.color} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── State label ── */}
      <motion.p
        key={convState}
        initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          fontSize: 24, fontWeight: 800,
          color: cfg.color, marginBottom: 8,
          letterSpacing: "-0.4px",
        }}
      >
        {cfg.label}
      </motion.p>
      <p style={{ fontSize: 13, color: "rgba(200,200,230,0.4)", marginBottom: 36 }}>
        {cfg.hint}
      </p>

      {/* ── Transcript bubble ── */}
      <AnimatePresence>
        {transcript && (
          <motion.div
            key="transcript"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
            style={{
              maxWidth: 500, padding: "13px 22px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 18, marginBottom: 36,
              fontSize: 14, color: "rgba(240,240,248,0.84)",
              lineHeight: 1.65, textAlign: "center",
            }}
          >
            {transcript}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Controls ── */}
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <AnimatePresence>
          {isSpeaking && (
            <motion.button
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
              onClick={onInterrupt}
              style={{
                padding: "11px 24px", borderRadius: 99,
                background: "rgba(167,139,250,0.12)",
                border: "1px solid rgba(167,139,250,0.3)",
                fontSize: 13, fontWeight: 700, color: "#a78bfa",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
              }}
            >
              <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2a3 3 0 013 3v6a3 3 0 11-6 0V5a3 3 0 013-3z"/>
                <path d="M19 10v1a7 7 0 01-14 0v-1"/>
              </svg>
              Interrupt
            </motion.button>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
          onClick={onStop}
          style={{
            padding: "11px 30px", borderRadius: 99,
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.28)",
            fontSize: 13, fontWeight: 700, color: "#f87171",
            cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
          }}
        >
          <svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="3"/>
          </svg>
          End Voice Mode
        </motion.button>
      </div>

      {/* ── Error banner ── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{
              position: "absolute", bottom: 28,
              maxWidth: 440, padding: "12px 18px",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: 14,
              display: "flex", alignItems: "flex-start", gap: 10,
            }}
          >
            <span style={{ fontSize: 15 }}>🎙️</span>
            <span style={{ fontSize: 12, color: "#fca5a5", lineHeight: 1.55, flex: 1 }}>{error}</span>
            <button
              onClick={onClearError}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#f87171", fontSize: 16, padding: 0, flexShrink: 0 }}
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
