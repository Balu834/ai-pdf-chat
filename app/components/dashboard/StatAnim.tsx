"use client";
import { useEffect, useState } from "react";
import { animate, motion, useReducedMotion } from "framer-motion";

/** Number that counts up from 0 when it first appears (or jumps straight there for reduced motion). */
export function CountUp({ value, duration = 0.9 }: { value: number; duration?: number }) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? value : 0);
  useEffect(() => {
    if (reduce || !Number.isFinite(value)) { setN(value); return; }
    const c = animate(0, value, { duration, ease: [0.22, 1, 0.36, 1], onUpdate: v => setN(Math.round(v)) });
    return () => c.stop();
  }, [value, duration, reduce]);
  return <>{Number.isFinite(value) ? n : "∞"}</>;
}

/** Thin progress bar that fills smoothly to `pct` (0-100). */
export function FillBar({ pct, delay = 0.2 }: { pct: number; delay?: number }) {
  const p = Math.max(0, Math.min(100, pct || 0));
  return (
    <div className="ix-stat-bar-wrap">
      <motion.div
        className="ix-stat-bar-fill ix-bar-gold"
        initial={{ width: 0 }}
        animate={{ width: `${p}%` }}
        transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

/** Mini PDF page used as the document card cover: a paper sheet with text lines and the file's initial. */
export function DocCover({ name }: { name: string }) {
  const initial = (name.trim()[0] || "D").toUpperCase();
  // deterministic line widths per document so each cover looks a little different
  let h = 0; for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const widths = Array.from({ length: 6 }, (_, i) => 55 + ((h >> (i * 3)) % 40));
  return (
    <div className="ix-cover" aria-hidden>
      <div className="ix-cover-sheet">
        <div className="ix-cover-top">
          <span className="ix-cover-initial">{initial}</span>
          <span className="ix-cover-tag">PDF</span>
        </div>
        {widths.map((w, i) => <div key={i} className="ix-cover-line" style={{ width: `${w}%` }} />)}
      </div>
      <div className="ix-cover-sheet ix-cover-back" />
    </div>
  );
}
