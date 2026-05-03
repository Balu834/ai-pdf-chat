"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:       "#07071a",
  surface:  "rgba(255,255,255,0.03)",
  card:     "rgba(255,255,255,0.04)",
  border:   "rgba(255,255,255,0.07)",
  text:     "#f0f0f8",
  muted:    "rgba(240,240,248,0.45)",
  accent:   "#7c3aed",
  green:    "#4ade80",
  gold:     "#f59e0b",
  red:      "#f87171",
  cyan:     "#06b6d4",
  blue:     "#60a5fa",
  purple:   "#a78bfa",
};

// ── Formatters ────────────────────────────────────────────────────────────────
const fmtINR = (p) => `₹${(p / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const fmtNum = (n) => (n ?? 0).toLocaleString("en-IN");
const fmtPct = (n) => `${n ?? 0}%`;
const fmtK   = (n) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n ?? 0);

// ── CSS (injected once) ───────────────────────────────────────────────────────
let CSS_INJECTED = false;
function InjectCSS() {
  useEffect(() => {
    if (CSS_INJECTED || typeof document === "undefined") return;
    CSS_INJECTED = true;
    const s = document.createElement("style");
    s.textContent = `
      *{box-sizing:border-box}
      body{background:#07071a}
      .adm-scroll::-webkit-scrollbar{width:4px;height:4px}
      .adm-scroll::-webkit-scrollbar-track{background:transparent}
      .adm-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}
      @keyframes adm-spin{to{transform:rotate(360deg)}}
      @keyframes adm-pulse{0%,100%{opacity:.4}50%{opacity:1}}
      @keyframes adm-fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
      .adm-card{animation:adm-fadein 0.3s ease both}
      .adm-range-btn{transition:all 0.15s}
      .adm-range-btn:hover{border-color:rgba(124,58,237,0.5)!important;color:#f0f0f8!important}
      @media(max-width:700px){
        .adm-grid-4{grid-template-columns:repeat(2,1fr)!important}
        .adm-grid-3{grid-template-columns:repeat(2,1fr)!important}
        .adm-grid-2{grid-template-columns:1fr!important}
        .adm-header-right{display:none!important}
      }
      @media(max-width:480px){
        .adm-grid-4{grid-template-columns:1fr!important}
        .adm-grid-3{grid-template-columns:1fr!important}
      }
    `;
    document.head.appendChild(s);
  }, []);
  return null;
}

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner({ size = 18, color = C.muted }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      style={{ animation: "adm-spin 0.8s linear infinite", flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2.5" strokeOpacity="0.2" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// ── Metric card ───────────────────────────────────────────────────────────────
function Card({ label, value, sub, color, icon, trend }) {
  const trendColor = trend > 0 ? C.green : trend < 0 ? C.red : C.muted;
  const trendArrow = trend > 0 ? "↑" : trend < 0 ? "↓" : null;
  return (
    <div className="adm-card" style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16,
      padding: "18px 20px", display: "flex", flexDirection: "column", gap: 6,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {label}
        </span>
        {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 28, fontWeight: 900, color: color || C.text, letterSpacing: "-0.5px", lineHeight: 1 }}>
          {value ?? "—"}
        </span>
        {trendArrow && (
          <span style={{ fontSize: 12, fontWeight: 700, color: trendColor }}>
            {trendArrow} {Math.abs(trend)}%
          </span>
        )}
      </div>
      {sub && <span style={{ fontSize: 11, color: C.muted, lineHeight: 1.4 }}>{sub}</span>}
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function Section({ title, desc }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <h2 style={{ fontSize: 13, fontWeight: 800, color: C.text, margin: 0, letterSpacing: "0.02em" }}>{title}</h2>
      {desc && <p style={{ fontSize: 11, color: C.muted, margin: "3px 0 0" }}>{desc}</p>}
    </div>
  );
}

// ── SVG Line chart ────────────────────────────────────────────────────────────
function LineChart({ data = [], color = C.accent, label = "", height = 100, formatY }) {
  if (!data.length) return <NoData />;

  const W  = 500;
  const H  = height;
  const PL = 36, PR = 8, PT = 8, PB = 24;
  const iW = W - PL - PR;
  const iH = H - PT - PB;

  const values = data.map((d) => d.value);
  const min    = Math.min(...values);
  const max    = Math.max(...values) || 1;
  const range  = max - min || 1;

  const xOf = (i)   => PL + (i / Math.max(data.length - 1, 1)) * iW;
  const yOf = (val) => PT + ((max - val) / range) * iH;

  const points = data.map((d, i) => ({ x: xOf(i), y: yOf(d.value), ...d }));
  const lineD  = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const fillD  = `${lineD} L ${points.at(-1).x.toFixed(1)} ${H - PB} L ${PL} ${H - PB} Z`;

  // Y-axis labels (3 ticks)
  const yTicks = [max, (max + min) / 2, min];

  // X-axis labels (show first, middle, last)
  const xLabels = [
    data[0],
    data[Math.floor(data.length / 2)],
    data.at(-1),
  ].filter(Boolean);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }} aria-label={label}>
      <defs>
        <linearGradient id={`lg-${color.replace(/[^a-z0-9]/gi, "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {yTicks.map((v, i) => {
        const y = yOf(v);
        return (
          <g key={i}>
            <line x1={PL} y1={y} x2={W - PR} y2={y}
              stroke={C.border} strokeWidth="1" strokeDasharray="3,3" />
            <text x={PL - 4} y={y + 4} textAnchor="end" fontSize="9" fill={C.muted}>
              {formatY ? formatY(v) : fmtK(v)}
            </text>
          </g>
        );
      })}

      {/* Fill */}
      <path d={fillD} fill={`url(#lg-${color.replace(/[^a-z0-9]/gi, "")})`} />

      {/* Line */}
      <path d={lineD} fill="none" stroke={color} strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" />

      {/* Dots on last point */}
      <circle cx={points.at(-1)?.x} cy={points.at(-1)?.y} r="3.5" fill={color} />

      {/* X-axis labels */}
      {xLabels.map((d, i) => {
        const idx   = data.indexOf(d);
        const align = i === 0 ? "start" : i === xLabels.length - 1 ? "end" : "middle";
        return (
          <text key={i} x={xOf(idx)} y={H - 2} textAnchor={align} fontSize="9" fill={C.muted}>
            {d.date?.slice(5)}
          </text>
        );
      })}
    </svg>
  );
}

// ── SVG Bar chart ─────────────────────────────────────────────────────────────
function BarChart({ data = [], color = C.accent, height = 80, formatY }) {
  if (!data.length) return <NoData />;
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height }}>
      {data.map((d, i) => (
        <div key={i} title={`${d.date}: ${formatY ? formatY(d.value) : d.value}`}
          style={{
            flex: 1, minWidth: 2,
            height: `${Math.max(2, (d.value / max) * 100)}%`,
            background: `linear-gradient(to top, ${color}, ${C.cyan})`,
            borderRadius: "2px 2px 0 0", opacity: 0.8,
            transition: "opacity 0.2s",
          }}
        />
      ))}
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────
const BADGE = {
  active:    { bg: "rgba(74,222,128,0.1)",  text: "#4ade80",  border: "rgba(74,222,128,0.25)" },
  trial:     { bg: "rgba(6,182,212,0.1)",   text: "#06b6d4",  border: "rgba(6,182,212,0.25)" },
  cancelled: { bg: "rgba(248,113,113,0.1)", text: "#f87171",  border: "rgba(248,113,113,0.25)" },
  expired:   { bg: "rgba(156,163,175,0.1)", text: "#9ca3af",  border: "rgba(156,163,175,0.2)" },
  free:      { bg: "rgba(255,255,255,0.04)",text: C.muted,    border: C.border },
  premium:   { bg: "rgba(167,139,250,0.1)", text: "#a78bfa",  border: "rgba(167,139,250,0.25)" },
};
function Badge({ status }) {
  const s = BADGE[status] ?? BADGE.free;
  return (
    <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 99,
      background: s.bg, color: s.text, border: `1px solid ${s.border}`, whiteSpace: "nowrap" }}>
      {status?.toUpperCase()}
    </span>
  );
}

// ── Plan donut ────────────────────────────────────────────────────────────────
function PlanDonut({ free, pro, premium, trial, total }) {
  const segments = [
    { label: "Pro",     value: pro,     color: C.accent },
    { label: "Premium", value: premium, color: C.purple },
    { label: "Trial",   value: trial,   color: C.cyan   },
    { label: "Free",    value: free,    color: C.muted  },
  ].filter((s) => s.value > 0);

  const tot    = segments.reduce((s, x) => s + x.value, 0) || 1;
  const R      = 40;
  const CX     = 50;
  const CY     = 50;

  let angle = -90;
  const arcs = segments.map((seg) => {
    const pct   = seg.value / tot;
    const start = angle;
    angle += pct * 360;
    return { ...seg, start, end: angle, pct };
  });

  function arc(cx, cy, r, startDeg, endDeg) {
    if (Math.abs(endDeg - startDeg) >= 359.9) endDeg = startDeg + 359.9;
    const toRad = (d) => (d * Math.PI) / 180;
    const x1 = cx + r * Math.cos(toRad(startDeg));
    const y1 = cy + r * Math.sin(toRad(startDeg));
    const x2 = cx + r * Math.cos(toRad(endDeg));
    const y2 = cy + r * Math.sin(toRad(endDeg));
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <svg viewBox="0 0 100 100" style={{ width: 90, height: 90, flexShrink: 0 }}>
        {arcs.map((s, i) => (
          <path key={i} d={arc(CX, CY, R, s.start, s.end)} fill={s.color} opacity={0.85} />
        ))}
        <circle cx={CX} cy={CY} r={24} fill={C.bg} />
        <text x={CX} y={CY - 4} textAnchor="middle" fontSize="9" fill={C.muted}>Users</text>
        <text x={CX} y={CY + 8} textAnchor="middle" fontSize="12" fontWeight="700" fill={C.text}>
          {fmtK(total)}
        </text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {segments.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
            <span style={{ color: C.muted }}>{s.label}</span>
            <span style={{ color: C.text, fontWeight: 700, marginLeft: "auto", paddingLeft: 8 }}>
              {fmtNum(s.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── No data placeholder ───────────────────────────────────────────────────────
function NoData() {
  return (
    <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center",
      color: C.muted, fontSize: 11, border: `1px dashed ${C.border}`, borderRadius: 8 }}>
      No data yet
    </div>
  );
}

// ── Chart panel ───────────────────────────────────────────────────────────────
function ChartPanel({ title, desc, children }) {
  return (
    <div className="adm-card" style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px 20px 16px",
    }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: C.text, margin: "0 0 2px" }}>{title}</p>
      {desc && <p style={{ fontSize: 10, color: C.muted, margin: "0 0 14px" }}>{desc}</p>}
      {children}
    </div>
  );
}

// ── Table ─────────────────────────────────────────────────────────────────────
function Table({ cols, rows, emptyMsg = "No data" }) {
  return (
    <div className="adm-scroll" style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c.key} style={{
                textAlign: c.right ? "right" : "left", padding: "6px 8px",
                color: C.muted, fontWeight: 600,
                borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap",
              }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0
            ? <tr><td colSpan={cols.length} style={{ color: C.muted, padding: "20px 8px", textAlign: "center" }}>{emptyMsg}</td></tr>
            : rows.map((row, i) => (
              <tr key={i}>
                {cols.map((c) => (
                  <td key={c.key} style={{
                    padding: "7px 8px", color: c.color?.(row) ?? C.text,
                    textAlign: c.right ? "right" : "left",
                    borderBottom: i < rows.length - 1 ? `1px solid ${C.border}` : "none",
                    fontFamily: c.mono ? "monospace" : undefined,
                    fontSize: c.mono ? 10 : 11,
                  }}>
                    {c.render ? c.render(row) : (row[c.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  );
}

// ── Range selector ────────────────────────────────────────────────────────────
const RANGES = [
  { id: "today", label: "Today"  },
  { id: "7d",    label: "7 days" },
  { id: "30d",   label: "30 days"},
  { id: "90d",   label: "90 days"},
  { id: "all",   label: "All time"},
];

// ── Main component ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [user,    setUser]    = useState(null);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [range,   setRange]   = useState("30d");
  const [lastRefresh, setLastRefresh] = useState(null);
  const [refreshing,  setRefreshing]  = useState(false);
  const timerRef = useRef(null);

  const loadStats = useCallback(async (r, quiet = false) => {
    if (!quiet) setLoading(true);
    else        setRefreshing(true);
    try {
      const res  = await fetch(`/api/admin/dashboard?range=${r}`, { credentials: "include" });
      const data = await res.json();
      if (data.error) { setError(data.error); }
      else            { setStats(data); setError(null); setLastRefresh(new Date()); }
    } catch { setError("Failed to load stats"); }
    finally  { setLoading(false); setRefreshing(false); }
  }, []);

  // Auth + initial load
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { window.location.href = "/login"; return; }
      setUser(user);
      loadStats(range);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reload when range changes
  useEffect(() => {
    if (user) loadStats(range);
  }, [range]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh every 60s
  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (user) loadStats(range, true);
    }, 60_000);
    return () => clearInterval(timerRef.current);
  }, [user, range, loadStats]);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 14 }}>
      <InjectCSS />
      <Spinner size={28} color={C.accent} />
      <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>Loading admin dashboard…</p>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 12 }}>
      <InjectCSS />
      <p style={{ color: C.red, fontSize: 16, fontWeight: 700, margin: 0 }}>⚠ {error}</p>
      <a href="/dashboard" style={{ color: C.accent, fontSize: 13 }}>← Back to App</a>
    </div>
  );

  const s = stats;

  // Derived display values
  const convDisplay   = `${s.conv_rate ?? 0}%`;
  const arpuDisplay   = fmtINR(s.arpu_paise ?? 0);
  const mrrDisplay    = fmtINR(s.rev_month  ?? 0);
  const profitDisplay = s.estimated_profit_usd >= 0
    ? `$${s.estimated_profit_usd.toFixed(2)}`
    : `-$${Math.abs(s.estimated_profit_usd).toFixed(2)}`;

  const totalPaid = (s.pro_plan ?? 0) + (s.premium_plan ?? 0);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Inter',system-ui,sans-serif", paddingBottom: 80 }}>
      <InjectCSS />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: "14px 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0,
        background: "rgba(7,7,26,0.95)", backdropFilter: "blur(12px)", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 900, color: "#fff" }}>I</span>
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 800, color: C.text, margin: 0 }}>Intellixy Admin</p>
            <p style={{ fontSize: 10, color: C.muted, margin: 0 }}>
              {user?.email}
              {s._cached && <span style={{ marginLeft: 6, color: C.gold }}>(cached)</span>}
            </p>
          </div>
        </div>

        <div className="adm-header-right" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 10, color: C.muted }}>
            {lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString()}` : ""}
          </span>
          <button
            onClick={() => loadStats(range, true)}
            disabled={refreshing}
            style={{ display: "flex", alignItems: "center", gap: 6,
              background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`,
              color: refreshing ? C.muted : C.text, padding: "6px 12px", borderRadius: 8,
              fontSize: 11, fontWeight: 600, cursor: refreshing ? "not-allowed" : "pointer" }}
          >
            {refreshing ? <Spinner size={12} /> : "↺"} Refresh
          </button>
          <a href="/admin" style={{ fontSize: 11, color: C.muted, textDecoration: "none",
            border: `1px solid ${C.border}`, padding: "6px 12px", borderRadius: 8 }}>
            Classic
          </a>
          <a href="/dashboard" style={{ fontSize: 11, color: C.muted, textDecoration: "none",
            border: `1px solid ${C.border}`, padding: "6px 12px", borderRadius: 8 }}>
            ← App
          </a>
        </div>
      </div>

      <div style={{ maxWidth: 1260, margin: "0 auto", padding: "28px 20px" }}>

        {/* ── Page title + range filter ──────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: C.text, margin: "0 0 4px", letterSpacing: "-0.3px" }}>
              Admin Dashboard
            </h1>
            <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              {" · "}Auto-refreshes every 60s
            </p>
          </div>

          {/* Range pills */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {RANGES.map((r) => (
              <button key={r.id} className="adm-range-btn"
                onClick={() => setRange(r.id)}
                style={{
                  padding: "6px 14px", borderRadius: 99, fontSize: 11, fontWeight: 600,
                  cursor: "pointer", border: `1px solid ${range === r.id ? C.accent : C.border}`,
                  background: range === r.id ? "rgba(124,58,237,0.15)" : "transparent",
                  color: range === r.id ? C.accent : C.muted,
                }}>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* ══ SECTION 1: Revenue ═══════════════════════════════════════════════ */}
        <div style={{ marginBottom: 32 }}>
          <Section title="Revenue" desc="All amounts in INR (paise → ₹)" />
          <div className="adm-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
            <Card label="MRR (this month)"  value={mrrDisplay}  sub={s.mrr_change_pct !== null ? `${s.mrr_change_pct >= 0 ? "+" : ""}${s.mrr_change_pct}% vs last month` : "First month"} color={C.green} icon="💰" trend={s.mrr_change_pct} />
            <Card label="Total Revenue"     value={fmtINR(s.rev_total ?? 0)} sub="All time" icon="📈" />
            <Card label={`Revenue (${RANGES.find(r => r.id === range)?.label ?? range})`} value={fmtINR(s.rev_range ?? 0)} sub="Selected period" color={C.cyan} icon="📊" />
            <Card label="Revenue Today"     value={fmtINR(s.rev_today ?? 0)} sub={`This week: ${fmtINR(s.rev_week ?? 0)}`} icon="⚡" />
          </div>
        </div>

        {/* ══ SECTION 2: Users ═════════════════════════════════════════════════ */}
        <div style={{ marginBottom: 32 }}>
          <Section title="Users" />
          <div className="adm-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
            <Card label="Total Users"   value={fmtNum(s.total_users)} sub="All signups" icon="👥" />
            <Card label="New Today"     value={fmtNum(s.new_today)}   sub={`This week: ${fmtNum(s.new_week)}`} color={C.blue} icon="🆕" />
            <Card label="New This Month" value={fmtNum(s.new_month)}  sub="Signups this calendar month" color={C.purple} icon="📅" />
            <Card label="Churn (month)" value={`${s.churn_rate ?? 0}%`} sub={`${s.churned_month ?? 0} cancellations`} color={s.churn_rate > 10 ? C.red : C.muted} icon="📉" />
          </div>
        </div>

        {/* ══ SECTION 3: Plan Breakdown + Engagement ═══════════════════════════ */}
        <div style={{ marginBottom: 32 }}>
          <Section title="Plans & Engagement" />
          <div className="adm-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>

            {/* Plan donut */}
            <div className="adm-card" style={{ background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 16, padding: "18px 20px" }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase",
                letterSpacing: "0.08em", margin: "0 0 14px" }}>Plan Breakdown</p>
              <PlanDonut free={s.free_plan} pro={s.pro_plan} premium={s.premium_plan}
                trial={s.trial_plan} total={s.total_users} />
            </div>

            {/* Active users */}
            <div className="adm-card" style={{ background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 16, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase",
                letterSpacing: "0.08em", margin: 0 }}>Active Users</p>
              {[["DAU", s.dau, "Active today",       C.green],
                ["WAU", s.wau, "Active this week",   C.cyan],
                ["MAU", s.mau, "Active this month",  C.accent]
              ].map(([lbl, val, desc, col]) => (
                <div key={lbl} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "8px 10px", background: "rgba(255,255,255,0.02)", borderRadius: 8 }}>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: C.muted }}>{lbl}</span>
                    <span style={{ fontSize: 10, color: C.muted, marginLeft: 6 }}>{desc}</span>
                  </div>
                  <span style={{ fontSize: 18, fontWeight: 900, color: col }}>{fmtNum(val)}</span>
                </div>
              ))}
            </div>

            {/* KPI strip */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Card label="Conversion Rate" value={convDisplay} sub="Free → Paid" color={C.gold} icon="🎯" />
              <Card label="ARPU"            value={arpuDisplay} sub="Avg revenue per user (all time)" color={C.green} icon="💵" />
              <Card label="Paying Users"    value={fmtNum(totalPaid)} sub={`Pro: ${s.pro_plan} · Premium: ${s.premium_plan} · Trial: ${s.trial_plan}`} color={C.purple} icon="⭐" />
            </div>
          </div>
        </div>

        {/* ══ SECTION 4: Trend Charts ═══════════════════════════════════════════ */}
        <div style={{ marginBottom: 32 }}>
          <Section title="Growth Trends" desc="Last 30 days — filled daily" />
          <div className="adm-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <ChartPanel title="Revenue Trend" desc="Daily payments (last 30 days)">
              <LineChart data={s.rev_trend ?? []} color={C.green} label="Revenue trend"
                formatY={(v) => fmtINR(v)} />
              <div style={{ marginTop: 8 }}>
                <BarChart data={s.rev_trend ?? []} color={C.green} height={40} formatY={fmtINR} />
              </div>
            </ChartPanel>
            <ChartPanel title="Signup Trend" desc="New accounts per day (last 30 days)">
              <LineChart data={s.signup_trend ?? []} color={C.cyan} label="Signup trend"
                formatY={(v) => Math.round(v)} />
            </ChartPanel>
          </div>
        </div>

        {/* ══ SECTION 5: Usage ══════════════════════════════════════════════════ */}
        <div style={{ marginBottom: 32 }}>
          <Section title="Usage & AI Costs" desc="Platform-wide usage metrics" />
          <div className="adm-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
            <Card label="PDFs Uploaded"   value={fmtNum(s.total_pdfs)}     sub="All time"          icon="📄" />
            <Card label="Chats Sent"      value={fmtNum(s.total_messages)} sub="All time"          icon="💬" />
            <Card label="AI Questions (30d)" value={fmtNum(s.ai?.questions)} sub={`${fmtK(s.ai?.tokens ?? 0)} tokens`} color={C.cyan} icon="🤖" />
            <Card label="AI Cost (30d)"   value={`$${(s.ai?.cost_usd ?? 0).toFixed(4)}`}
              sub={`Est. profit: ${profitDisplay}`}
              color={s.estimated_profit_usd >= 0 ? C.green : C.red} icon="⚙️" />
          </div>
        </div>

        {/* ══ SECTION 6: Coupons & Funnel ══════════════════════════════════════ */}
        <div style={{ marginBottom: 32 }}>
          <Section title="Coupons & Upgrade Funnel" />
          <div className="adm-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

            {/* Coupon funnel cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, alignContent: "start" }}>
              <Card label="Total Redemptions" value={fmtNum(s.coupon_redemptions)} sub="All time coupon uses" color={C.gold} icon="🏷️" />
              <Card label="Credits Issued"    value={fmtNum(s.credits_issued)}     sub="Total credits given"  color={C.cyan} icon="🪙" />
              <div className="adm-card" style={{ background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 16, padding: "14px 16px", gridColumn: "span 2" }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase",
                  letterSpacing: "0.08em", margin: "0 0 10px" }}>Upgrade Funnel</p>
                {[
                  ["Signups", s.total_users ?? 0, "#fff"],
                  ["Trials",  s.trial_plan  ?? 0, C.cyan],
                  ["Paid",    totalPaid,           C.accent],
                ].map(([lbl, val, col], i, arr) => {
                  const pct = i === 0 ? 100 : arr[0][1] > 0 ? Math.round((val / arr[0][1]) * 100) : 0;
                  return (
                    <div key={lbl} style={{ marginBottom: i < arr.length - 1 ? 8 : 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, fontSize: 11 }}>
                        <span style={{ color: C.muted }}>{lbl}</span>
                        <span style={{ color: col, fontWeight: 700 }}>{fmtNum(val)} ({pct}%)</span>
                      </div>
                      <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.05)" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: col,
                          borderRadius: 3, transition: "width 0.6s ease", opacity: 0.8 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top coupons table */}
            <div className="adm-card" style={{ background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 16, padding: "18px 20px" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: C.text, margin: "0 0 14px" }}>Top Coupons</p>
              <Table
                cols={[
                  { key: "code",  label: "Code",     mono: true },
                  { key: "type",  label: "Discount",
                    render: (r) => r.discount_value
                      ? `${r.discount_value}${r.discount_type === "percentage" ? "%" : "₹"}`
                      : "—",
                    color: () => C.gold },
                  { key: "uses",  label: "Uses", right: true, color: () => C.green },
                ]}
                rows={s.top_coupons ?? []}
                emptyMsg="No coupons used yet"
              />
            </div>
          </div>
        </div>

        {/* ══ SECTION 7: Recent Activity ════════════════════════════════════════ */}
        <div style={{ marginBottom: 32 }}>
          <Section title="Recent Activity" />
          <div className="adm-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

            <div className="adm-card" style={{ background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 16, padding: "18px 20px" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: C.text, margin: "0 0 14px" }}>Recent Payments</p>
              <Table
                cols={[
                  { key: "amount",      label: "Amount",
                    render: (r) => (
                      <span>
                        <span style={{ color: C.green, fontWeight: 700 }}>{fmtINR(r.amount)}</span>
                        {r.discount_amount > 0 &&
                          <span style={{ fontSize: 9, color: C.muted, marginLeft: 4 }}>
                            (saved {fmtINR(r.discount_amount)})
                          </span>}
                      </span>
                    )},
                  { key: "coupon_code", label: "Coupon", color: (r) => r.coupon_code ? C.gold : C.muted },
                  { key: "created_at",  label: "Date",   color: () => C.muted,
                    render: (r) => new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) },
                ]}
                rows={s.recent_payments ?? []}
                emptyMsg="No payments yet"
              />
            </div>

            <div className="adm-card" style={{ background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 16, padding: "18px 20px" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: C.text, margin: "0 0 14px" }}>Recent Plan Changes</p>
              <Table
                cols={[
                  { key: "user_id", label: "User",    mono: true,
                    render: (r) => r.user_id.slice(0, 8) + "…" },
                  { key: "status",  label: "Status",
                    render: (r) => <Badge status={r.is_trial ? "trial" : r.plan === "premium" ? "premium" : r.subscription_status} /> },
                  { key: "updated_at", label: "Changed", color: () => C.muted,
                    render: (r) => new Date(r.updated_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) },
                ]}
                rows={s.recent_users ?? []}
                emptyMsg="No plan changes yet"
              />
            </div>
          </div>
        </div>

        {/* ══ FOOTER: SQL helpers ═══════════════════════════════════════════════ */}
        <div style={{ background: "rgba(124,58,237,0.05)", border: "1px solid rgba(124,58,237,0.15)",
          borderRadius: 14, padding: "16px 20px" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: C.text, margin: "0 0 8px" }}>
            📋 Recommended DB Indexes (run once in Supabase SQL Editor)
          </p>
          <pre style={{ fontSize: 10, color: C.muted, margin: 0, fontFamily: "monospace",
            whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
{`-- Admin dashboard query performance
CREATE INDEX IF NOT EXISTS idx_payments_status_created     ON payments(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_plans_created          ON user_plans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_plans_status_updated   ON user_plans(subscription_status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created          ON usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coupon_uses_coupon_id       ON coupon_uses(coupon_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_created      ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_user_created       ON messages(user_id, created_at DESC);`}
          </pre>
        </div>

      </div>
    </div>
  );
}
