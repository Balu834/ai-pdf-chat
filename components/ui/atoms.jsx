"use client";

import { useState, useEffect, useRef } from "react";
import { useInView } from "framer-motion";
import { T } from "./tokens";

export function Check({ color = T.green, size = 14 }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24" strokeWidth="2.5" style={{ flexShrink:0 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function Xmark() {
  return (
    <svg width="13" height="13" fill="none" stroke={T.faint} viewBox="0 0 24 24" strokeWidth="2.5" style={{ flexShrink:0 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

export function PdfIcon({ size = 13 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" style={{ flexShrink:0 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline strokeLinecap="round" strokeLinejoin="round" points="14 2 14 8 20 8"/>
    </svg>
  );
}

export function ArrowRight({ size = 14 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

export function ChevronDown({ open }) {
  return (
    <svg width="16" height="16" fill="none" stroke={T.muted} viewBox="0 0 24 24" strokeWidth="2"
      style={{ flexShrink:0, transform: open ? "rotate(180deg)" : "none", transition: "transform .25s ease" }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export function Pill({ children, color = T.purple }) {
  return (
    <span style={{
      display:"inline-block", fontSize:11, fontWeight:700, letterSpacing:"0.09em",
      textTransform:"uppercase", color, background:`${color}18`,
      border:`1px solid ${color}30`, padding:"4px 14px", borderRadius:99,
    }}>
      {children}
    </span>
  );
}

export function Counter({ to, suffix = "", prefix = "" }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    const start = Date.now();
    const dur = 1800;
    const tick = () => {
      const p = Math.min((Date.now() - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(eased * to));
      if (p < 1) requestAnimationFrame(tick);
      else setVal(to);
    };
    requestAnimationFrame(tick);
  }, [inView, to]);
  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>;
}
