"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const C = {
  bg: "#07071a",
  surface: "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.07)",
  text: "#f0f0f8",
  muted: "rgba(240,240,248,0.45)",
  accent: "#7c3aed",
  green: "#4ade80",
  gold: "#f59e0b",
  red: "#f87171",
  cyan: "#06b6d4",
};

function fmt(paise) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

function MetricCard({ label, value, sub, color }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px 24px" }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>{label}</p>
      <p style={{ fontSize: 32, fontWeight: 900, color: color || C.text, margin: "0 0 4px", letterSpacing: "-0.5px" }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>{sub}</p>}
    </div>
  );
}

function BarChart({ data }) {
  if (!data?.length) return <p style={{ color: C.muted, fontSize: 12, textAlign: "center", padding: 20 }}>No data yet</p>;
  const max = Math.max(...data.map((d) => d.amount), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 80, padding: "0 4px" }}>
      {data.map((d) => (
        <div key={d.date} title={`${d.date}: ${fmt(d.amount)}`}
          style={{ flex: 1, minWidth: 4, height: `${Math.max(4, (d.amount / max) * 100)}%`, background: `linear-gradient(to top, ${C.accent}, ${C.cyan})`, borderRadius: "2px 2px 0 0", opacity: 0.85 }} />
      ))}
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    active:    { bg: "rgba(74,222,128,0.1)",  text: "#4ade80",  border: "rgba(74,222,128,0.25)" },
    trial:     { bg: "rgba(6,182,212,0.1)",   text: "#06b6d4",  border: "rgba(6,182,212,0.25)" },
    cancelled: { bg: "rgba(248,113,113,0.1)", text: "#f87171",  border: "rgba(248,113,113,0.25)" },
    expired:   { bg: "rgba(156,163,175,0.1)", text: "#9ca3af",  border: "rgba(156,163,175,0.2)" },
    free:      { bg: "rgba(255,255,255,0.04)",text: C.muted,    border: C.border },
  };
  const s = colors[status] || colors.free;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>
      {status?.toUpperCase()}
    </span>
  );
}

export default function AdminPage() {
  const [user, setUser]     = useState(null);
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (!user) { window.location.href = "/login"; return; }
      fetch("/api/admin/stats")
        .then((r) => r.json())
        .then((d) => {
          if (d.error) { setError(d.error); }
          else { setStats(d); }
        })
        .catch(() => setError("Failed to load stats"))
        .finally(() => setLoading(false));
    });
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: C.muted, fontSize: 14 }}>Loading admin dashboard…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
        <p style={{ color: C.red, fontSize: 16, fontWeight: 700 }}>Access Denied</p>
        <p style={{ color: C.muted, fontSize: 13 }}>{error}</p>
        <a href="/dashboard" style={{ color: C.accent, fontSize: 13 }}>← Back to Dashboard</a>
      </div>
    );
  }

  const mrrDisplay = fmt(stats.mrr_paise);
  const mrrChangeDisplay = stats.mrr_change_pct !== null
    ? `${stats.mrr_change_pct >= 0 ? "+" : ""}${stats.mrr_change_pct}% vs last month`
    : "First month";

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Inter', sans-serif", padding: "0 0 60px" }}>
      {/* Header */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#7c3aed,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 900, color: "white" }}>I</span>
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 800, color: C.text, margin: 0 }}>Intellixy Admin</p>
            <p style={{ fontSize: 10, color: C.muted, margin: 0 }}>{user?.email}</p>
          </div>
        </div>
        <a href="/dashboard" style={{ fontSize: 12, color: C.muted, textDecoration: "none", border: `1px solid ${C.border}`, padding: "6px 14px", borderRadius: 8 }}>
          ← App
        </a>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: C.text, margin: "0 0 8px", letterSpacing: "-0.4px" }}>Dashboard</h1>
        <p style={{ fontSize: 13, color: C.muted, margin: "0 0 32px" }}>
          {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>

        {/* Metrics grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
          <MetricCard label="MRR (this month)" value={mrrDisplay} sub={mrrChangeDisplay} color={C.green} />
          <MetricCard label="Total Revenue" value={fmt(stats.total_revenue_paise)} sub="All time" />
          <MetricCard label="Active Pro Users" value={stats.active_subs} sub="Paying subscribers" color={C.accent} />
          <MetricCard label="Trial Users" value={stats.trial_users} sub="Free trial active" color={C.cyan} />
          <MetricCard label="Total Users" value={stats.total_users?.toLocaleString("en-IN")} sub="All signups" />
          <MetricCard
            label="Trial → Paid Rate"
            value={stats.total_users > 0 ? `${Math.round((stats.active_subs / stats.total_users) * 100)}%` : "—"}
            sub="Conversion rate"
            color={C.gold}
          />
        </div>

        {/* Revenue chart */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 32 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: "0 0 4px" }}>Revenue — Last 30 Days</p>
          <p style={{ fontSize: 11, color: C.muted, margin: "0 0 20px" }}>Daily payment totals</p>
          <BarChart data={stats.daily_revenue} />
        </div>

        {/* Two-column tables */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>

          {/* Recent Payments */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, overflow: "hidden" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: "0 0 16px" }}>Recent Payments</p>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr>
                    {["Amount", "Coupon", "Date"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "6px 8px", color: C.muted, fontWeight: 600, borderBottom: `1px solid ${C.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_payments.length === 0 ? (
                    <tr><td colSpan={3} style={{ color: C.muted, padding: "20px 8px", textAlign: "center" }}>No payments yet</td></tr>
                  ) : stats.recent_payments.map((p) => (
                    <tr key={p.id}>
                      <td style={{ padding: "8px 8px", color: C.green, fontWeight: 700 }}>
                        {fmt(p.amount)}
                        {p.discount_amount > 0 && (
                          <span style={{ fontSize: 10, color: C.muted, marginLeft: 4 }}>
                            (saved {fmt(p.discount_amount)})
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "8px 8px", color: p.coupon_code ? C.gold : C.muted }}>
                        {p.coupon_code || "—"}
                      </td>
                      <td style={{ padding: "8px 8px", color: C.muted }}>
                        {new Date(p.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Users */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, overflow: "hidden" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: "0 0 16px" }}>Recent Plan Changes</p>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr>
                    {["User ID", "Status", "Expires"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "6px 8px", color: C.muted, fontWeight: 600, borderBottom: `1px solid ${C.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_users.length === 0 ? (
                    <tr><td colSpan={3} style={{ color: C.muted, padding: "20px 8px", textAlign: "center" }}>No users yet</td></tr>
                  ) : stats.recent_users.map((u) => (
                    <tr key={u.user_id}>
                      <td style={{ padding: "8px 8px", color: C.muted, fontFamily: "monospace", fontSize: 11 }}>
                        {u.user_id.slice(0, 8)}…
                      </td>
                      <td style={{ padding: "8px 8px" }}>
                        <StatusBadge status={u.is_trial ? "trial" : u.subscription_status} />
                      </td>
                      <td style={{ padding: "8px 8px", color: C.muted, fontSize: 11 }}>
                        {u.pro_expires_at
                          ? new Date(u.pro_expires_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Coupon quick-add hint */}
        <div style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 14, padding: "16px 20px" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: C.text, margin: "0 0 6px" }}>Create Coupons via SQL</p>
          <pre style={{ fontSize: 11, color: C.muted, margin: 0, fontFamily: "monospace", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
{`-- 50% off coupon (100 uses, expires Dec 2025):
INSERT INTO coupons (code, discount_type, discount_value, expiry_date, usage_limit)
VALUES ('LAUNCH50', 'percentage', 50, '2025-12-31', 100);

-- ₹100 off fixed (unlimited, no expiry):
INSERT INTO coupons (code, discount_type, discount_value)
VALUES ('FRIEND100', 'fixed', 100);`}
          </pre>
        </div>
      </div>
    </div>
  );
}
