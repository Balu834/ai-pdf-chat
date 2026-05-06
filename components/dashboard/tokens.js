/* ─── DESIGN TOKENS ─────────────────────────────────────────────────────── */
export const C = {
  /* Backgrounds */
  bg:           "#07071a",
  bgDeep:       "#050510",
  sidebar:      "rgba(8,8,22,0.98)",

  /* Glass surfaces */
  glass:        "rgba(255,255,255,0.04)",
  glassBorder:  "rgba(255,255,255,0.08)",
  glassHover:   "rgba(255,255,255,0.07)",
  surface:      "rgba(255,255,255,0.05)",
  surfaceHover: "rgba(255,255,255,0.08)",

  /* Brand — purple */
  accent:       "#7c3aed",
  accentLight:  "#a78bfa",
  accentGlow:   "rgba(124,58,237,0.4)",
  accentSoft:   "rgba(124,58,237,0.12)",
  accentBorder: "rgba(124,58,237,0.25)",

  /* Cyan */
  cyan:         "#06b6d4",
  cyanSoft:     "rgba(6,182,212,0.12)",
  cyanBorder:   "rgba(6,182,212,0.25)",

  /* Indigo */
  indigo:       "#6366f1",
  indigoSoft:   "rgba(99,102,241,0.12)",

  /* Text */
  textPrimary:  "#f0f0f8",
  textSecondary:"rgba(240,240,248,0.6)",
  textMuted:    "rgba(240,240,248,0.3)",

  /* Semantic */
  danger:       "#ef4444",
  dangerSoft:   "rgba(239,68,68,0.1)",
  gold:         "#fbbf24",
  goldSoft:     "rgba(245,158,11,0.12)",
  green:        "#4ade80",
  greenSoft:    "rgba(74,222,128,0.12)",
  greenBorder:  "rgba(74,222,128,0.2)",
};

/* ─── GRADIENTS ──────────────────────────────────────────────────────────── */
export const G = {
  brand:     "linear-gradient(135deg,#7c3aed 0%,#4f46e5 50%,#6366f1 100%)",
  brandCyan: "linear-gradient(135deg,#7c3aed 0%,#06b6d4 100%)",
};

/* ─── NAV ITEMS ──────────────────────────────────────────────────────────── */
export const NAV_ITEM_IDS = ["dashboard", "pdfs", "chat", "billing", "settings"];

/* ─── SMART ACTIONS ──────────────────────────────────────────────────────── */
export const SMART_ACTIONS = [
  { label: "📄 Summarize",  prompt: "Give me a structured summary of this document covering the main topics, key details, and any important notes." },
  { label: "💡 Key Points", prompt: "List the most important key points and key values (amounts, dates, names) from this document." },
  { label: "⚠️ Risks",      prompt: "Identify all risks, warnings, conditions, or concerns mentioned in this document." },
  { label: "🧒 ELI5",       prompt: "Explain this document like I'm 5 years old in simple plain language." },
  { label: "❓ Questions",   prompt: "Generate 5 smart follow-up questions someone should ask about this document." },
];

/* ─── HELPERS ─────────────────────────────────────────────────────────── */
export function timeAgo(ts) {
  if (!ts) return "";
  const iso = String(ts).replace(" ", "T");
  const utc = /Z|[+-]\d{2}:\d{2}$/.test(iso) ? iso : iso + "Z";
  const diff = (Date.now() - new Date(utc)) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return "Yesterday";
  return new Date(utc).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}
