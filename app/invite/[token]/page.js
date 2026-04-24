"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

function Logo({ size = 28 }) {
  return (
    <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
      <div style={{
        width: size, height: size, borderRadius: Math.round(size * 0.29),
        background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: Math.round(size * 0.5), fontWeight: 900, color: "white" }}>I</span>
      </div>
      <span style={{ fontSize: Math.round(size * 0.54), fontWeight: 800, color: "white", letterSpacing: "-0.2px" }}>Intellixy</span>
    </a>
  );
}

const ROLE_LABELS = { owner: "Owner", admin: "Admin", member: "Member" };
const ROLE_COLORS = { owner: "#f59e0b", admin: "#a78bfa", member: "#34d399" };

export default function InvitePage() {
  const { token } = useParams();
  const router = useRouter();

  const [meta, setMeta]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined]   = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/invite/${token}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) setError(json.error);
        else setMeta(json);
      })
      .catch(() => setError("Failed to load invite."))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleAccept() {
    setJoining(true);
    try {
      const res = await fetch(`/api/invite/${token}`, { method: "POST" });
      const json = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          // Redirect to login, preserve token in returnUrl
          router.push(`/login?returnUrl=/invite/${token}`);
          return;
        }
        setError(json.error || "Failed to accept invite");
        return;
      }

      setJoined(true);
      setTimeout(() => router.push("/dashboard?view=team"), 1800);
    } catch (e) {
      setError("Network error — please try again.");
    } finally {
      setJoining(false);
    }
  }

  const font  = "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
  const base  = { minHeight: "100vh", background: "#07071a", fontFamily: font, color: "white", display: "flex", flexDirection: "column" };

  if (loading) return (
    <div style={{ ...base, alignItems: "center", justifyContent: "center" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 36, height: 36, border: "3px solid rgba(124,58,237,0.3)", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  if (error) return (
    <div style={{ ...base, alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px" }}>Invite unavailable</h1>
      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 24, maxWidth: 360 }}>{error}</p>
      <a href="/" style={{ padding: "10px 24px", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "white", fontWeight: 700, fontSize: 14, borderRadius: 10, textDecoration: "none" }}>
        Go to Intellixy →
      </a>
    </div>
  );

  const roleColor = ROLE_COLORS[meta.role] || "#34d399";
  const roleLabel = ROLE_LABELS[meta.role] || meta.role;

  return (
    <div style={base}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <header style={{ height: 58, borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", padding: "0 24px" }}>
        <Logo size={28} />
      </header>

      {/* Card */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        <div style={{
          width: "100%", maxWidth: 440,
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 20, padding: "40px 36px", textAlign: "center",
          animation: "fadeUp 0.5s ease",
          boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
        }}>
          {/* Workspace icon */}
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
            boxShadow: "0 12px 40px rgba(124,58,237,0.45)",
          }}>
            <svg width="32" height="32" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth="1.6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </div>

          {joined ? (
            <>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
              <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px" }}>You're in!</h1>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", margin: 0 }}>Redirecting to your workspace…</p>
            </>
          ) : (
            <>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
                You're invited to join
              </p>
              <h1 style={{ fontSize: 26, fontWeight: 900, margin: "0 0 10px", letterSpacing: "-0.4px" }}>
                {meta.workspaceName}
              </h1>

              {/* Role badge */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 20, padding: "4px 12px", borderRadius: 99, background: `${roleColor}18`, border: `1px solid ${roleColor}40` }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: roleColor, flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: roleColor }}>{roleLabel}</span>
              </div>

              {meta.inviterEmail && (
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "0 0 28px" }}>
                  Invited by <strong style={{ color: "rgba(255,255,255,0.7)" }}>{meta.inviterEmail}</strong>
                </p>
              )}

              <button
                onClick={handleAccept}
                disabled={joining}
                style={{
                  width: "100%", padding: "15px", borderRadius: 12, border: "none",
                  background: joining ? "rgba(124,58,237,0.4)" : "linear-gradient(135deg,#7c3aed,#4f46e5)",
                  color: "white", fontWeight: 800, fontSize: 15, cursor: joining ? "not-allowed" : "pointer",
                  boxShadow: joining ? "none" : "0 8px 32px rgba(124,58,237,0.45)",
                  transition: "all 0.2s", letterSpacing: "-0.2px",
                }}
              >
                {joining ? "Joining…" : `Join ${meta.workspaceName} →`}
              </button>

              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", marginTop: 14 }}>
                You need an Intellixy account to join.
                {" "}<a href="/login" style={{ color: "#a78bfa", textDecoration: "underline" }}>Sign in</a>
              </p>

              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.15)", marginTop: 8 }}>
                Expires {new Date(meta.expiresAt).toLocaleDateString()}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
