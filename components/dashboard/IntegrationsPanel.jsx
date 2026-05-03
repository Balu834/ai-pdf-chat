"use client";

import { useEffect, useState, useCallback } from "react";

const C = {
  bg:          "#0f1117",
  card:        "#16181f",
  border:      "rgba(255,255,255,0.07)",
  textPrimary: "#f0f2f5",
  textMuted:   "rgba(240,242,245,0.45)",
  accent:      "#6366f1",
  success:     "#34d399",
  error:       "#f87171",
};

const PROVIDERS = [
  {
    id:       "google",
    name:     "Google",
    desc:     "Gmail · Google Calendar",
    icon:     "G",
    iconBg:   "#ea4335",
    scopes:   ["Send emails", "Read emails", "Create calendar events", "View calendar"],
    oauthUrl: "/api/oauth/google",
  },
  {
    id:       "slack",
    name:     "Slack",
    desc:     "Post messages · DMs",
    icon:     "S",
    iconBg:   "#4a154b",
    scopes:   ["Post to channels", "Send direct messages", "List channels"],
    oauthUrl: "/api/oauth/slack",
  },
  {
    id:       "notion",
    name:     "Notion",
    desc:     "Create pages · Search workspace",
    icon:     "N",
    iconBg:   "#000000",
    scopes:   ["Create pages", "Search workspace"],
    oauthUrl: "/api/oauth/notion",
  },
];

export default function IntegrationsPanel() {
  const [integrations, setIntegrations] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [busy,         setBusy]         = useState(null);
  const [toast,        setToast]        = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/integrations", { credentials: "include" });
      const data = await res.json();
      setIntegrations(data.integrations ?? []);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Handle OAuth redirects
    const params = new URLSearchParams(window.location.search);
    const ok  = params.get("oauth_success");
    const err = params.get("oauth_error");
    if (ok)  { showToast(`${ok.charAt(0).toUpperCase() + ok.slice(1)} connected!`, "success"); }
    if (err) { showToast(`Connection failed: ${err}`, "error"); }
    if (ok || err) {
      params.delete("oauth_success"); params.delete("oauth_error");
      window.history.replaceState({}, "", `${window.location.pathname}?${params}`);
    }
  }, [load]);

  function showToast(msg, type = "info") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function disconnect(provider) {
    setBusy(provider);
    try {
      await fetch(`/api/integrations?provider=${provider}`, { method: "DELETE", credentials: "include" });
      setIntegrations((prev) => prev.filter((i) => i.provider !== provider));
      showToast(`${provider} disconnected`, "info");
    } catch { showToast("Failed to disconnect", "error"); }
    finally   { setBusy(null); }
  }

  const connectedSet = new Set(integrations.map((i) => i.provider));

  return (
    <div style={{ padding: "24px 0", maxWidth: 660 }}>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: C.textPrimary, margin: "0 0 4px" }}>
        Integrations
      </h2>
      <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 24px" }}>
        Connect external apps so the agent can send emails, create calendar events, and post Slack messages on your behalf.
      </p>

      {loading ? (
        <div style={{ color: C.textMuted, fontSize: 13 }}>Loading…</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {PROVIDERS.map((p) => {
            const linked = connectedSet.has(p.id);
            const info   = integrations.find((i) => i.provider === p.id);
            return (
              <div key={p.id} style={{
                background: C.card, border: `1px solid ${linked ? "rgba(99,102,241,0.35)" : C.border}`,
                borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16,
              }}>
                {/* Icon */}
                <div style={{
                  width: 42, height: 42, borderRadius: 10, background: p.iconBg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, fontWeight: 800, color: "#fff", flexShrink: 0,
                }}>
                  {p.icon}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary }}>{p.name}</span>
                    {linked && (
                      <span style={{ fontSize: 10, fontWeight: 600, background: "rgba(52,211,153,0.12)", color: C.success, padding: "2px 7px", borderRadius: 20 }}>
                        CONNECTED
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
                    {linked && info?.account_email ? info.account_email : p.desc}
                  </div>
                  <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>
                    {p.scopes.join(" · ")}
                  </div>
                </div>

                {/* Action */}
                {linked ? (
                  <button
                    onClick={() => disconnect(p.id)}
                    disabled={busy === p.id}
                    style={{
                      background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)",
                      color: C.error, padding: "7px 14px", borderRadius: 8, fontSize: 12,
                      fontWeight: 600, cursor: busy === p.id ? "not-allowed" : "pointer", flexShrink: 0,
                    }}
                  >
                    {busy === p.id ? "…" : "Disconnect"}
                  </button>
                ) : (
                  <a
                    href={p.oauthUrl}
                    style={{
                      background: C.accent, border: "none", color: "#fff",
                      padding: "7px 14px", borderRadius: 8, fontSize: 12,
                      fontWeight: 600, cursor: "pointer", textDecoration: "none", flexShrink: 0,
                    }}
                  >
                    Connect
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Required env vars hint */}
      <div style={{
        marginTop: 24, padding: "14px 16px", background: "rgba(99,102,241,0.06)",
        border: `1px solid rgba(99,102,241,0.15)`, borderRadius: 10,
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.accent, marginBottom: 6 }}>
          Setup required
        </div>
        <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.6 }}>
          Add to <code style={{ background: "rgba(255,255,255,0.06)", padding: "1px 5px", borderRadius: 4 }}>.env.local</code>:{" "}
          <code>GOOGLE_CLIENT_ID</code>, <code>GOOGLE_CLIENT_SECRET</code>,{" "}
          <code>SLACK_CLIENT_ID</code>, <code>SLACK_CLIENT_SECRET</code>,{" "}
          <code>NOTION_CLIENT_ID</code>, <code>NOTION_CLIENT_SECRET</code>.
          Set each provider's redirect URI to{" "}
          <code suppressHydrationWarning>{typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || "")}/api/oauth/&#123;provider&#125;/callback</code>.
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: toast.type === "error" ? "#7f1d1d" : toast.type === "success" ? "#064e3b" : "#1e293b",
          border: `1px solid ${toast.type === "error" ? C.error : toast.type === "success" ? C.success : C.border}`,
          color: C.textPrimary, padding: "10px 18px", borderRadius: 10, fontSize: 13, zIndex: 9999,
          boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
