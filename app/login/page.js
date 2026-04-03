"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

const supabase = createClient();

export default function LoginPage() {
  const [mode, setMode] = useState("login"); // "login" | "signup" | "forgot"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState(null); // { type: "success"|"error", msg }
  const [loading, setLoading] = useState(false);

  const switchMode = (m) => { setMode(m); setStatus(null); };

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) { setStatus({ type: "error", msg: error.message }); setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    setLoading(true);

    try {
      if (mode === "forgot") {
        const res = await fetch("/api/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to send reset email");
        setStatus({ type: "success", msg: "Password reset email sent! Check your inbox." });
        return;
      }

      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setStatus({ type: "success", msg: "Account created! Check your email to confirm." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = "/dashboard";
      }
    } catch (err) {
      setStatus({ type: "error", msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  const isForgot = mode === "forgot";

  return (
    <div style={s.root}>
      <div style={s.card}>
        <div style={s.logo}>⚡</div>
        <h1 style={s.title}>PDF Chat</h1>
        <p style={s.sub}>
          {mode === "login" && "Sign in to your account"}
          {mode === "signup" && "Create a free account"}
          {mode === "forgot" && "Reset your password"}
        </p>

        {/* Tabs — hidden on forgot */}
        {!isForgot && (
          <div style={s.tabs}>
            <button style={{ ...s.tab, ...(mode === "login" ? s.tabActive : {}) }}
              onClick={() => switchMode("login")}>Sign In</button>
            <button style={{ ...s.tab, ...(mode === "signup" ? s.tabActive : {}) }}
              onClick={() => switchMode("signup")}>Sign Up</button>
          </div>
        )}

        {!isForgot && (
          <>
            <button type="button" onClick={handleGoogle} disabled={loading} style={s.googleBtn}>
              <svg width="18" height="18" viewBox="0 0 48 48" style={{ marginRight: 8, flexShrink: 0 }}>
                <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.86l6.08-6.08C34.46 3.05 29.48 1 24 1 14.82 1 7.07 6.48 3.64 14.28l7.06 5.49C12.4 13.72 17.73 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.5 24.5c0-1.64-.15-3.22-.42-4.75H24v9h12.67c-.55 2.97-2.2 5.48-4.67 7.17l7.19 5.59C43.45 37.3 46.5 31.35 46.5 24.5z"/>
                <path fill="#FBBC05" d="M10.7 28.23A14.6 14.6 0 0 1 9.5 24c0-1.47.25-2.89.7-4.23L3.14 14.28A23.94 23.94 0 0 0 1 24c0 3.82.9 7.44 2.64 10.72l7.06-6.49z"/>
                <path fill="#34A853" d="M24 47c5.48 0 10.08-1.82 13.44-4.94l-7.19-5.59C28.44 37.84 26.32 38.5 24 38.5c-6.27 0-11.6-4.22-13.3-9.77l-7.06 6.49C7.07 43.52 14.82 47 24 47z"/>
              </svg>
              Continue with Google
            </button>
            <div style={s.divider}><span style={s.dividerText}>or</span></div>
          </>
        )}

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              suppressHydrationWarning
              autoComplete="email"
              style={s.input}
            />
          </div>

          {!isForgot && (
            <div style={s.field}>
              <div style={s.labelRow}>
                <label style={s.label}>Password</label>
                {mode === "login" && (
                  <button type="button" style={s.forgotLink} onClick={() => switchMode("forgot")}>
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                suppressHydrationWarning
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                style={s.input}
              />
            </div>
          )}

          {status && (
            <div style={{
              ...s.alert,
              background: status.type === "error" ? "#fef2f2" : "#f0fdf4",
              borderColor: status.type === "error" ? "#fca5a5" : "#86efac",
              color: status.type === "error" ? "#dc2626" : "#16a34a",
            }}>
              {status.msg}
            </div>
          )}

          <button type="submit" disabled={loading} style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}>
            {loading
              ? "Please wait…"
              : mode === "login" ? "Sign In"
              : mode === "signup" ? "Create Account"
              : "Send Reset Email"}
          </button>

          {isForgot && (
            <button type="button" style={s.backLink} onClick={() => switchMode("login")}>
              ← Back to Sign In
            </button>
          )}
        </form>

        {!isForgot && (
          <div style={s.planInfo}>
            <p style={s.planTitle}>Free plan includes:</p>
            <p style={s.planItem}>📄 5 PDFs</p>
            <p style={s.planItem}>💬 20 questions / day</p>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  root: {
    minHeight: "100vh", display: "flex",
    alignItems: "center", justifyContent: "center",
    background: "#f6f8fa",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    padding: 20,
  },
  card: {
    background: "#fff", borderRadius: 16,
    border: "1px solid #d0d7de",
    padding: "36px 40px", width: "100%", maxWidth: 400,
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
    textAlign: "center",
  },
  logo: { fontSize: 40, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 700, color: "#24292f", margin: "0 0 4px" },
  sub: { fontSize: 14, color: "#57606a", margin: "0 0 24px" },
  tabs: {
    display: "flex", background: "#f6f8fa",
    borderRadius: 10, padding: 4, marginBottom: 24,
    border: "1px solid #d0d7de",
  },
  tab: {
    flex: 1, padding: "8px 0", border: "none",
    background: "transparent", borderRadius: 8,
    fontSize: 14, fontWeight: 500, color: "#57606a",
    cursor: "pointer", transition: "all 0.15s",
  },
  tabActive: {
    background: "#fff", color: "#24292f",
    boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
  },
  form: { display: "flex", flexDirection: "column", gap: 16, textAlign: "left" },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  labelRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  label: { fontSize: 13, fontWeight: 600, color: "#24292f" },
  forgotLink: {
    background: "none", border: "none", padding: 0,
    fontSize: 12, color: "#2563eb", cursor: "pointer",
    fontFamily: "inherit", textDecoration: "underline",
  },
  input: {
    padding: "10px 12px", borderRadius: 8,
    border: "1.5px solid #d0d7de", fontSize: 14,
    outline: "none", color: "#24292f",
    transition: "border-color 0.15s",
    fontFamily: "inherit",
  },
  alert: {
    padding: "10px 14px", borderRadius: 8,
    border: "1px solid", fontSize: 13, lineHeight: 1.5,
  },
  btn: {
    padding: "11px", background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
    border: "none", borderRadius: 10, color: "#fff",
    fontSize: 14, fontWeight: 600, cursor: "pointer",
    boxShadow: "0 2px 12px rgba(37,99,235,0.3)",
    transition: "all 0.2s", marginTop: 4,
    fontFamily: "inherit",
  },
  backLink: {
    background: "none", border: "none", padding: 0,
    fontSize: 13, color: "#57606a", cursor: "pointer",
    fontFamily: "inherit", textAlign: "center",
    textDecoration: "underline",
  },
  googleBtn: {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: "100%", padding: "11px 16px", marginBottom: 4,
    background: "#fff", border: "1.5px solid #d0d7de", borderRadius: 10,
    fontSize: 14, fontWeight: 600, color: "#24292f",
    cursor: "pointer", transition: "all 0.15s",
    fontFamily: "inherit",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },
  divider: {
    position: "relative", textAlign: "center",
    margin: "16px 0",
    borderTop: "1px solid #d0d7de",
  },
  dividerText: {
    position: "relative", top: -10,
    background: "#fff", padding: "0 12px",
    fontSize: 12, color: "#8c959f",
  },
  planInfo: {
    marginTop: 24, padding: 14,
    background: "#f6f8fa", borderRadius: 10,
    border: "1px solid #d0d7de",
  },
  planTitle: { fontSize: 12, fontWeight: 600, color: "#57606a", marginBottom: 6 },
  planItem: { fontSize: 13, color: "#24292f", margin: "3px 0" },
};
