/* ── Design tokens ─────────────────────────────────────────────────────────── */
export const T = {
  bg:       "#07070e",
  surface:  "rgba(255,255,255,0.04)",
  surfaceHi:"rgba(255,255,255,0.07)",
  border:   "rgba(255,255,255,0.08)",
  borderHi: "rgba(255,255,255,0.16)",
  text:     "#f2f2f7",
  muted:    "rgba(242,242,247,0.52)",
  faint:    "rgba(242,242,247,0.24)",
  purple:   "#7c3aed",
  violet:   "#8b5cf6",
  cyan:     "#06b6d4",
  green:    "#22c55e",
  amber:    "#f59e0b",
  pink:     "#ec4899",
};

/* ── Motion variants ───────────────────────────────────────────────────────── */
export const spring = [0.22, 1, 0.36, 1];

export const FADE_UP = {
  hidden: { opacity: 0, y: 32 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.7, ease: spring } },
};
export const FADE_IN = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: 0.6, ease: "easeOut" } },
};
export const SCALE_IN = {
  hidden: { opacity: 0, scale: 0.91 },
  show:   { opacity: 1, scale: 1, transition: { duration: 0.55, ease: spring } },
};
export const STAGGER = (d = 0.09) => ({
  hidden: {},
  show:   { transition: { staggerChildren: d, delayChildren: 0.06 } },
});
export const VP = { once: true, margin: "-72px" };
