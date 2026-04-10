"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  // "verifying" | "error" | "ready" | "success"
  const [pageState, setPageState] = useState("verifying");
  const [errorMsg, setErrorMsg] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendStatus, setResendStatus] = useState(null);

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const errorCode = params.get("error_code");
      const errorDesc = params.get("error_description");

      // Supabase redirected here with an error (expired / invalid link)
      if (errorCode || errorDesc) {
        setErrorMsg(errorDesc?.replace(/\+/g, " ") || "Link is invalid or expired.");
        setPageState("error");
        return;
      }

      // New PKCE flow: ?code=xxx — exchange it for a session
      if (code) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setErrorMsg(error.message);
            setPageState("error");
          } else {
            setPageState("ready");
          }
        } catch (err) {
          setErrorMsg(err.message);
          setPageState("error");
        }
        return;
      }

      // Legacy flow: #access_token hash — listen for PASSWORD_RECOVERY event
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY") setPageState("ready");
      });

      const timer = setTimeout(() => {
        setPageState((prev) => {
          if (prev === "verifying") {
            setErrorMsg("No valid reset link detected. Please request a new one.");
            return "error";
          }
          return prev;
        });
      }, 6000);

      return () => { subscription.unsubscribe(); clearTimeout(timer); };
    };

    run();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    if (password.length < 6) {
      setStatus({ type: "error", msg: "Password must be at least 6 characters." });
      return;
    }
    if (password !== confirm) {
      setStatus({ type: "error", msg: "Passwords do not match." });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPageState("success");
      setTimeout(() => { window.location.href = "/login"; }, 2500);
    } catch (err) {
      setStatus({ type: "error", msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (e) => {
    e.preventDefault();
    setResendStatus(null);
    if (!resendEmail.trim()) return;
    setResendLoading(true);
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setResendStatus({ type: "success", msg: "New reset email sent! Check your inbox." });
    } catch (err) {
      setResendStatus({ type: "error", msg: err.message });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div style={s.root}>
      <div style={s.card}>
        <div style={s.logo}>⚡</div>
        <h1 style={s.title}>PDF Chat</h1>

        {pageState === "verifying" && (
          <>
            <p style={s.sub}>Verifying reset link…</p>
            <div style={s.waiting}>
              <div style={s.spinner} />
              <p style={s.waitingText}>Please wait</p>
            </div>
          </>
        )}

        {pageState === "error" && (
          <>
            <p style={s.sub}>Reset link expired</p>
            <div style={s.errorBox}>
              <span style={s.errorIcon}>⚠️</span>
              <p style={s.errorText}>
                {errorMsg || "This link is invalid or has expired."}<br />
                <span style={{ opacity: 0.8 }}>Request a new one below.</span>
              </p>
            </div>
            <form onSubmit={handleResend} style={s.form}>
              <div style={s.field}>
                <label style={s.label}>Your email address</label>
                <input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  suppressHydrationWarning
                  autoComplete="email"
                  style={s.input}
                />
              </div>
              {resendStatus && (
                <div style={{ ...s.alert, ...(resendStatus.type === "error" ? s.alertErr : s.alertOk) }}>
                  {resendStatus.msg}
                </div>
              )}
              <button type="submit" disabled={resendLoading} style={{ ...s.btn, opacity: resendLoading ? 0.7 : 1 }}>
                {resendLoading ? "Sending…" : "Send New Reset Email"}
              </button>
              <button type="button" style={s.backLink} onClick={() => { window.location.href = "/login"; }}>
                ← Back to Sign In
              </button>
            </form>
          </>
        )}

        {pageState === "ready" && (
          <>
            <p style={s.sub}>Set a new password</p>
            <form onSubmit={handleSubmit} style={s.form}>
              <div style={s.field}>
                <label style={s.label}>New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  suppressHydrationWarning
                  autoComplete="new-password"
                  style={s.input}
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>Confirm Password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  suppressHydrationWarning
                  autoComplete="new-password"
                  style={s.input}
                />
              </div>
              {status && (
                <div style={{ ...s.alert, ...(status.type === "error" ? s.alertErr : s.alertOk) }}>
                  {status.msg}
                </div>
              )}
              <button type="submit" disabled={loading} style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}>
                {loading ? "Updating…" : "Update Password"}
              </button>
              <button type="button" style={s.backLink} onClick={() => { window.location.href = "/login"; }}>
                ← Back to Sign In
              </button>
            </form>
          </>
        )}

        {pageState === "success" && (
          <>
            <p style={s.sub}>Password updated!</p>
            <div style={s.successBox}>
              <span style={{ fontSize: 40 }}>✅</span>
              <p style={s.successText}>Your password has been updated.<br />Redirecting to login…</p>
            </div>
          </>
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
    padding: "36px 40px", width: "100%", maxWidth: 420,
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
    textAlign: "center",
  },
  logo: { fontSize: 40, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 700, color: "#24292f", margin: "0 0 4px" },
  sub: { fontSize: 14, color: "#57606a", margin: "0 0 24px" },
  form: { display: "flex", flexDirection: "column", gap: 16, textAlign: "left" },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: "#24292f" },
  input: {
    padding: "10px 12px", borderRadius: 8,
    border: "1.5px solid #d0d7de", fontSize: 14,
    outline: "none", color: "#24292f",
    transition: "border-color 0.15s", fontFamily: "inherit",
  },
  alert: { padding: "10px 14px", borderRadius: 8, border: "1px solid", fontSize: 13, lineHeight: 1.5 },
  alertErr: { background: "#fef2f2", borderColor: "#fca5a5", color: "#dc2626" },
  alertOk: { background: "#f0fdf4", borderColor: "#86efac", color: "#16a34a" },
  btn: {
    padding: "11px", background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
    border: "none", borderRadius: 10, color: "#fff",
    fontSize: 14, fontWeight: 600, cursor: "pointer",
    boxShadow: "0 2px 12px rgba(37,99,235,0.3)",
    transition: "all 0.2s", marginTop: 4, fontFamily: "inherit",
  },
  backLink: {
    background: "none", border: "none", padding: 0,
    fontSize: 13, color: "#57606a", cursor: "pointer",
    fontFamily: "inherit", textAlign: "center", textDecoration: "underline",
  },
  waiting: { display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "20px 0" },
  spinner: {
    width: 28, height: 28, borderRadius: "50%",
    border: "3px solid #e5e7eb", borderTopColor: "#2563eb",
    animation: "spin 0.7s linear infinite",
  },
  waitingText: { fontSize: 14, color: "#57606a" },
  errorBox: {
    background: "#fef2f2", border: "1px solid #fca5a5",
    borderRadius: 10, padding: "16px 18px", marginBottom: 20,
    textAlign: "left", display: "flex", gap: 12, alignItems: "flex-start",
  },
  errorIcon: { fontSize: 20, flexShrink: 0 },
  errorText: { fontSize: 13, color: "#991b1b", lineHeight: 1.6, margin: 0 },
  successBox: { display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "20px 0" },
  successText: { fontSize: 14, color: "#16a34a", lineHeight: 1.6 },
};
