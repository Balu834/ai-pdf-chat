"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

/* ─── MODULE-LEVEL SINGLETON ─────────────────────────────────────────────────
   Tracks the currently-playing HTMLAudioElement so we can pause it
   when a different VoiceNotePlayer starts — one audio at a time.      */
let activePLayer = null;

/* ─── WAVEFORM DATA ──────────────────────────────────────────────────────────
   28 bars with a sine-envelope distribution (tallest in the middle).
   Values are deterministic so SSR and client produce identical markup.  */
const BARS = Array.from({ length: 28 }, (_, i) => {
  const pos = i / 27;
  const env = Math.sin(pos * Math.PI);
  const det = ((i * 9 + 5) % 11) / 22; // 0 – 0.5 jitter, no Math.random()
  return Math.max(0.12, env * 0.75 + det * 0.25);
});

function fmtTime(sec) {
  const s = Math.floor(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function VoiceNotePlayer({ url, durationMs = 0, isUser = false }) {
  const [playing,  setPlaying]  = useState(false);
  const [progress, setProgress] = useState(0);    // 0–1
  const [elapsed,  setElapsed]  = useState(0);    // seconds
  const [total,    setTotal]    = useState(durationMs / 1000);
  const [speed,    setSpeed]    = useState(1);

  const audioRef = useRef(null);
  const rafRef   = useRef(null);

  /* ── keep state in sync with audio element ── */
  function tick() {
    const el = audioRef.current;
    if (!el) return;
    setElapsed(el.currentTime);
    setProgress(el.duration > 0 ? el.currentTime / el.duration : 0);
    if (!el.paused) rafRef.current = requestAnimationFrame(tick);
  }

  function play() {
    const el = audioRef.current;
    if (!el) return;

    // Pause whatever was playing before
    if (activePLayer && activePLayer !== el) {
      activePLayer.pause();
    }
    activePLayer = el;
    el.playbackRate = speed;
    el.play().catch(() => {});
    setPlaying(true);
    rafRef.current = requestAnimationFrame(tick);
  }

  function pause() {
    audioRef.current?.pause();
    cancelAnimationFrame(rafRef.current);
    setPlaying(false);
  }

  function togglePlay() {
    playing ? pause() : play();
  }

  function handleSeek(e) {
    const el = audioRef.current;
    if (!el || !el.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    el.currentTime = pct * el.duration;
    setElapsed(el.currentTime);
    setProgress(pct);
  }

  function cycleSpeed() {
    const next = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1;
    setSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  }

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    function onMeta() { setTotal(el.duration || durationMs / 1000); }
    function onEnded() {
      setPlaying(false);
      setProgress(0);
      setElapsed(0);
      cancelAnimationFrame(rafRef.current);
      if (audioRef.current) audioRef.current.currentTime = 0;
      if (activePLayer === el) activePLayer = null;
    }

    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("ended", onEnded);
      cancelAnimationFrame(rafRef.current);
    };
  }, [durationMs]);

  /* Theme colors — user messages use white-on-purple; AI uses purple-on-dark */
  const iconColor    = isUser ? "rgba(255,255,255,0.9)"    : "#a78bfa";
  const btnBg        = isUser ? "rgba(255,255,255,0.15)"   : "rgba(124,58,237,0.15)";
  const btnBorder    = isUser ? "rgba(255,255,255,0.28)"   : "rgba(124,58,237,0.38)";
  const barPlayed    = isUser ? "rgba(255,255,255,0.9)"    : "#a78bfa";
  const barUnplayed  = isUser ? "rgba(255,255,255,0.3)"    : "rgba(124,58,237,0.35)";
  const timeColor    = isUser ? "rgba(255,255,255,0.55)"   : "rgba(240,240,248,0.4)";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 210, maxWidth: 280 }}>
      <audio ref={audioRef} src={url} preload="metadata" style={{ display: "none" }} />

      {/* ── Play / Pause ── */}
      <motion.button
        whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.91 }}
        onClick={togglePlay}
        style={{ width: 38, height: 38, borderRadius: "50%", background: btnBg, border: `1.5px solid ${btnBorder}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: iconColor }}
      >
        {playing
          ? <svg width="11" height="11" fill="currentColor" viewBox="0 0 24 24"><rect x="5"  y="3" width="5" height="18"/><rect x="14" y="3" width="5" height="18"/></svg>
          : <svg width="11" height="11" fill="currentColor" viewBox="0 0 24 24" style={{ marginLeft: 2 }}><polygon points="5 3 19 12 5 21 5 3"/></svg>
        }
      </motion.button>

      {/* ── Waveform + time ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>

        {/* Waveform bars — clickable progress */}
        <div onClick={handleSeek} style={{ display: "flex", alignItems: "center", gap: 1.5, height: 30, cursor: "pointer" }}>
          {BARS.map((h, i) => {
            const pct     = i / BARS.length;
            const played  = pct < progress;
            const current = Math.abs(pct - progress) < 0.05; // near playhead
            return (
              <motion.div
                key={i}
                animate={playing && current ? { scaleY: [1, 1.4, 1] } : { scaleY: 1 }}
                transition={{ duration: 0.4, repeat: playing && current ? Infinity : 0, ease: "easeInOut" }}
                style={{
                  width:        2.5,
                  height:       `${Math.max(15, h * 100)}%`,
                  borderRadius: 99,
                  background:   played ? barPlayed : barUnplayed,
                  flexShrink:   0,
                  transformOrigin: "center",
                  transition:   "background 0.06s",
                }}
              />
            );
          })}
        </div>

        {/* Elapsed / total */}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 10, color: timeColor }}>{fmtTime(elapsed)}</span>
          <span style={{ fontSize: 10, color: timeColor }}>{fmtTime(total)}</span>
        </div>
      </div>

      {/* ── Speed toggle ── */}
      <motion.button
        whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.91 }}
        onClick={cycleSpeed}
        style={{ fontSize: 10, fontWeight: 800, padding: "3px 7px", borderRadius: 6, border: `1px solid ${btnBorder}`, background: "transparent", cursor: "pointer", color: iconColor, flexShrink: 0 }}
      >
        {speed}×
      </motion.button>
    </div>
  );
}
