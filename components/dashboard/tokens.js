/* ─── DESIGN TOKENS ─────────────────────────────────────────────────────── */
export const C = {
  bg:           "#07071a",
  sidebar:      "rgba(10,10,28,0.92)",
  glass:        "rgba(255,255,255,0.04)",
  glassBorder:  "rgba(255,255,255,0.08)",
  glassHover:   "rgba(255,255,255,0.07)",
  surface:      "rgba(255,255,255,0.05)",
  surfaceHover: "rgba(255,255,255,0.08)",
  accent:       "#7c3aed",
  accentLight:  "#a78bfa",
  accentGlow:   "rgba(124,58,237,0.4)",
  cyan:         "#06b6d4",
  textPrimary:  "#f0f0f8",
  textSecondary:"rgba(240,240,248,0.6)",
  textMuted:    "rgba(240,240,248,0.3)",
  danger:       "#ef4444",
  dangerSoft:   "rgba(239,68,68,0.1)",
  gold:         "#fbbf24",
  green:        "#4ade80",
};

/* ─── NAV ITEMS ──────────────────────────────────────────────────────────── */
// Note: Icon components are injected at usage time to avoid circular imports.
// NAV_ITEMS_IDS used for reference; Sidebar builds the full list with icons directly.
export const NAV_ITEM_IDS = ["dashboard", "pdfs", "chat", "billing", "settings"];

/* ─── SMART ACTIONS ──────────────────────────────────────────────────────── */
export const SMART_ACTIONS = [
  { label: "✦ Summarize", prompt: "Summarize this document in 3-4 sentences covering the main points." },
  { label: "🧒 ELI5",      prompt: "Explain this document like I'm 5 years old, in simple plain language." },
  { label: "📌 Key Points", prompt: "List the most important key points from this document as bullet points." },
  { label: "⚠️ Risks",     prompt: "Identify any risks, warnings, issues or concerns mentioned in this document." },
  { label: "❓ Questions",  prompt: "Generate 5 insightful questions someone might ask about this document." },
];

/* ─── HELPERS ────────────────────────────────────────────────────────────── */
export function timeAgo(ts) {
  if (!ts) return "";
  const diff = (Date.now() - new Date(ts)) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return "Yesterday";
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
