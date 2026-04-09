"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

const supabase = createClient();

export default function LoginPage() {
  const [mode, setMode] = useState("login"); // "login" | "signup" | "forgot"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Show error from OAuth callback redirect (e.g. ?error=...)
  const [status, setStatus] = useState(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    return err ? { type: "error", msg: decodeURIComponent(err) } : null;
  });

  const switchMode = (m) => { setMode(m); setStatus(null); };

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "https://ai-pdf-chat-steel-kappa.vercel.app/auth/callback",
      },
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
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#07071a",
      padding: "48px 16px",
      position: "relative",
      overflow: "hidden",
      fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
    }}>
      {/* Background blobs */}
      <div style={{ position: "absolute", top: -200, left: -200, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,58,237,0.2),transparent 70%)", filter: "blur(80px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -200, right: -200, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(79,70,229,0.15),transparent 70%)", filter: "blur(80px)", pointerEvents: "none" }} />

      <div style={{ position: "relative", width: "100%", maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 40, height: 40, borderRadius: 14, background: "linear-gradient(135deg,#7c3aed,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(124,58,237,0.4)" }}>
              <span style={{ fontSize: 20, fontWeight: 900, color: "white" }}>I</span>
            </div>
            <span style={{ fontSize: 20, fontWeight: 800, color: "white", letterSpacing: "-0.3px" }}>Intellixy</span>
          </a>
        </div>

        {/* Card */}
        <div style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 32, boxShadow: "0 32px 80px rgba(0,0,0,0.4)" }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "white", textAlign: "center", margin: "0 0 6px" }}>
            {mode === "login" && "Welcome back"}
            {mode === "signup" && "Create your account"}
            {mode === "forgot" && "Reset password"}
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", textAlign: "center", margin: "0 0 24px" }}>
            {mode === "login" && "Sign in to continue to Intellixy"}
            {mode === "signup" && "Start for free — no credit card required"}
            {mode === "forgot" && "Enter your email and we'll send a reset link"}
          </p>

          {/* Tabs */}
          {!isForgot && (
            <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 4, marginBottom: 24 }}>
              {["login", "signup"].map((m) => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  style={{
                    flex: 1,
                    padding: "9px 0",
                    borderRadius: 9,
                    fontSize: 14,
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    background: mode === m ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : "transparent",
                    color: mode === m ? "white" : "rgba(255,255,255,0.45)",
                    boxShadow: mode === m ? "0 2px 12px rgba(124,58,237,0.4)" : "none",
                  }}
                >
                  {m === "login" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>
          )}

          {/* Google Button */}
          {!isForgot && (
            <>
              <button
                type="button"
                onClick={handleGoogle}
                disabled={loading}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  padding: "12px 16px",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 600,
                  color: "white",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.6 : 1,
                  marginBottom: 16,
                  transition: "all 0.2s",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.86l6.08-6.08C34.46 3.05 29.48 1 24 1 14.82 1 7.07 6.48 3.64 14.28l7.06 5.49C12.4 13.72 17.73 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.5 24.5c0-1.64-.15-3.22-.42-4.75H24v9h12.67c-.55 2.97-2.2 5.48-4.67 7.17l7.19 5.59C43.45 37.3 46.5 31.35 46.5 24.5z"/>
                  <path fill="#FBBC05" d="M10.7 28.23A14.6 14.6 0 0 1 9.5 24c0-1.47.25-2.89.7-4.23L3.14 14.28A23.94 23.94 0 0 0 1 24c0 3.82.9 7.44 2.64 10.72l7.06-6.49z"/>
                  <path fill="#34A853" d="M24 47c5.48 0 10.08-1.82 13.44-4.94l-7.19-5.59C28.44 37.84 26.32 38.5 24 38.5c-6.27 0-11.6-4.22-13.3-9.77l-7.06 6.49C7.07 43.52 14.82 47 24 47z"/>
                </svg>
                Continue with Google
              </button>

              <div style={{ position: "relative", margin: "20px 0" }}>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center" }}>
                  <div style={{ width: "100%", borderTop: "1px solid rgba(255,255,255,0.1)" }} />
                </div>
                <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
                  <span style={{ background: "#0d0d24", padding: "0 12px", fontSize: 12, color: "rgba(255,255,255,0.3)" }}>or continue with email</span>
                </div>
              </div>
            </>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.7)", marginBottom: 6 }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                suppressHydrationWarning
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 10,
                  fontSize: 14,
                  color: "white",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {!isForgot && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.7)" }}>Password</label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => switchMode("forgot")}
                      style={{ fontSize: 12, color: "#a78bfa", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500 }}
                    >
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
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 10,
                    fontSize: 14,
                    color: "white",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            )}

            {status && (
              <div style={{
                padding: "12px 16px",
                borderRadius: 10,
                fontSize: 13,
                border: `1px solid ${status.type === "error" ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`,
                background: status.type === "error" ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
                color: status.type === "error" ? "#f87171" : "#4ade80",
              }}>
                {status.msg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                color: "white",
                background: loading ? "rgba(124,58,237,0.5)" : "linear-gradient(135deg,#7c3aed,#4f46e5)",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : "0 4px 20px rgba(124,58,237,0.4)",
                marginTop: 4,
                transition: "all 0.2s",
              }}
            >
              {loading
                ? "Please wait…"
                : mode === "login" ? "Sign In"
                : mode === "signup" ? "Create Account"
                : "Send Reset Link"}
            </button>

            {isForgot && (
              <button
                type="button"
                onClick={() => switchMode("login")}
                style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500, textAlign: "center" }}
              >
                ← Back to Sign In
              </button>
            )}
          </form>

          {/* Free plan info */}
          {!isForgot && (
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "center", margin: "0 0 12px" }}>Free plan includes</p>
              <div style={{ display: "flex", justifyContent: "center", gap: 24 }}>
                {["5 PDFs", "20 questions / day"].map(item => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
                    <svg width="14" height="14" fill="none" stroke="#a78bfa" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
