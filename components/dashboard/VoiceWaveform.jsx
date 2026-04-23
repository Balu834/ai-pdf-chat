"use client";

import { motion, AnimatePresence } from "framer-motion";

// Organic bar envelope: taller in the center, shorter at edges (matches real voice spectra).
// Parameters are deterministic so SSR and client render the same HTML.
const BAR_COUNT = 22;
const BARS = Array.from({ length: BAR_COUNT }, (_, i) => {
  const pos      = i / (BAR_COUNT - 1);          // 0 → 1
  const envelope = Math.sin(pos * Math.PI);       // 0 at edges, 1 at center
  const jitter   = ((i * 7 + 13) % 10) / 10;     // deterministic "random" 0–0.9
  return {
    delay:    (i * 0.04) % 0.6,
    duration: 0.28 + (i % 4) * 0.07,             // 0.28 – 0.49 s
    minH:     3 + envelope * 4,                   // 3 – 7 px
    maxH:     10 + envelope * 34 * (0.5 + jitter * 0.5), // 10 – 44 px
  };
});

export default function VoiceWaveform({ isActive }) {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          key="voice-waveform"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{    opacity: 0, height: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          style={{ overflow: "hidden", display: "flex", justifyContent: "center", paddingBottom: 6 }}
        >
          <div style={{
            display:        "flex",
            alignItems:     "center",
            gap:            10,
            padding:        "8px 18px",
            background:     "rgba(124,58,237,0.07)",
            border:         "1px solid rgba(124,58,237,0.18)",
            borderRadius:   99,
            backdropFilter: "blur(12px)",
          }}>
            {/* Red recording dot */}
            <span style={{
              width: 7, height: 7, borderRadius: "50%",
              background: "#ef4444",
              flexShrink: 0,
              boxShadow: "0 0 6px rgba(239,68,68,0.7)",
              animation: "pulseDot 1.2s ease-in-out infinite",
            }} />

            {/* Waveform bars */}
            <div style={{ display: "flex", alignItems: "center", gap: 2, height: 44 }}>
              {BARS.map((bar, i) => (
                <motion.div
                  key={i}
                  animate={{ height: [bar.minH, bar.maxH, bar.minH] }}
                  transition={{
                    duration: bar.duration,
                    repeat:   Infinity,
                    delay:    bar.delay,
                    ease:     "easeInOut",
                  }}
                  style={{
                    width:        3,
                    borderRadius: 99,
                    background:   "linear-gradient(to top, rgba(124,58,237,0.5), #a78bfa)",
                    flexShrink:   0,
                  }}
                />
              ))}
            </div>

            {/* Label */}
            <span style={{
              fontSize:      11,
              fontWeight:    700,
              color:         "#a78bfa",
              letterSpacing: "0.4px",
              whiteSpace:    "nowrap",
              flexShrink:    0,
            }}>
              Listening…
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
