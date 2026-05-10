"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Events } from "@/lib/analytics";

/* ─── Feature highlights shown in left panel ─────────────────────────────── */
const FEATURES = [
  {
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
    ),
    title: "Instant PDF Answers",
    desc: "Ask anything and get precise answers from your documents in seconds.",
  },
  {
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
      </svg>
    ),
    title: "AI-Powered Analysis",
    desc: "Summarize, extract key insights, and compare documents automatically.",
  },
  {
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
      </svg>
    ),
    title: "AI Agents & Workflows",
    desc: "Automate complex tasks with intelligent agents that work for you.",
  },
];

const STATS = [
  { value: "10K+", label: "Users" },
  { value: "50K+", label: "Docs Analyzed" },
  { value: "4.9★", label: "Rating" },
];

export default function LoginPage() {
  const router = useRouter();

  const [loading, setLoading]   = useState(false);
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode]         = useState("login"); // "login" | "signup" | "forgot"
  const [status, setStatus]     = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [hasPendingRef, setHasPendingRef] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err    = params.get("error");
    const ref    = params.get("ref");

    if (err) {
      window.history.replaceState({}, document.title, "/login");
      setStatus({ type: "error", msg: decodeURIComponent(err) });
    }

    if (ref && /^[A-Z0-9]{4,12}$/i.test(ref)) {
      try { sessionStorage.setItem("pendingRefCode", ref.toUpperCase()); } catch {}
      setMode("signup");
    }

    try {
      setHasPendingRef(!!sessionStorage.getItem("pendingRefCode"));
    } catch {}
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.push("/dashboard");
    });
  }, [router]);

  const handleGoogleLogin = async () => {
    Events.loginStart();
    setLoading(true);
    setStatus(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) {
      setStatus({ type: "error", msg: error.message });
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!email || !password) return setStatus({ type: "error", msg: "Enter your email and password." });
    setLoading(true);
    setStatus(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setStatus({ type: "error", msg: error.message });
    } else {
      Events.loginComplete("email");
      router.push("/dashboard");
    }
    setLoading(false);
  };

  const handleEmailSignup = async () => {
    if (!email || !password) return setStatus({ type: "error", msg: "Enter your email and password." });
    setLoading(true);
    setStatus(null);
    Events.signupStart();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setStatus({ type: "error", msg: error.message });
    } else {
      Events.signupComplete("email");
      setStatus({ type: "success", msg: "Check your email to confirm your account." });
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email) return setStatus({ type: "error", msg: "Enter your email address first." });
    setLoading(true);
    setStatus(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setStatus({ type: "error", msg: error.message });
    } else {
      setStatus({ type: "success", msg: "Password reset email sent. Check your inbox." });
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key !== "Enter") return;
    if (mode === "forgot") handleForgotPassword();
    else if (mode === "signup") handleEmailSignup();
    else handleEmailLogin();
  };

  const isLogin  = mode === "login";
  const isSignup = mode === "signup";
  const isForgot = mode === "forgot";

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      background: "#07071a",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background ambient orbs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "10%", left: "5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "10%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)", filter: "blur(50px)" }} />
        <div style={{ position: "absolute", top: "50%", left: "40%", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(79,70,229,0.1) 0%, transparent 70%)", filter: "blur(40px)" }} />
      </div>

      {/* ── Left Brand Panel ─────────────────────────────────────── */}
      <div style={{
        flex: "0 0 48%",
        display: "none",
        flexDirection: "column",
        justifyContent: "center",
        padding: "60px 56px",
        position: "relative",
        zIndex: 1,
        // show on md+
      }}
        className="brand-panel"
      >
        {/* Logo */}
        <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: 56 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 0 1px rgba(124,58,237,0.35), 0 8px 32px rgba(124,58,237,0.5)",
          }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: "white" }}>I</span>
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, color: "#f0f0f8", letterSpacing: "-0.4px" }}>Intellixy</span>
        </a>

        {/* Headline */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 38, fontWeight: 900, color: "#f0f0f8", letterSpacing: "-1px", lineHeight: 1.15, margin: "0 0 16px" }}>
            Your documents,{" "}
            <span style={{
              background: "linear-gradient(135deg, #a78bfa, #818cf8, #67e8f9)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              supercharged
            </span>
          </h1>
          <p style={{ fontSize: 16, color: "rgba(240,240,248,0.55)", lineHeight: 1.6, margin: 0 }}>
            The AI platform that turns PDFs into conversations. Ask questions, get instant answers, automate analysis.
          </p>
        </div>

        {/* Feature list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 48 }}>
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.1, duration: 0.5 }}
              style={{ display: "flex", gap: 14, alignItems: "flex-start" }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: "rgba(124,58,237,0.12)",
                border: "1px solid rgba(124,58,237,0.22)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#a78bfa",
              }}>
                {f.icon}
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f8", margin: "0 0 3px" }}>{f.title}</p>
                <p style={{ fontSize: 13, color: "rgba(240,240,248,0.45)", margin: 0, lineHeight: 1.5 }}>{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats strip */}
        <div style={{ display: "flex", gap: 28 }}>
          {STATS.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.08 }}
            >
              <p style={{ fontSize: 22, fontWeight: 800, color: "#a78bfa", margin: "0 0 2px", letterSpacing: "-0.5px" }}>{s.value}</p>
              <p style={{ fontSize: 12, color: "rgba(240,240,248,0.4)", margin: 0 }}>{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Right Form Panel ─────────────────────────────────────── */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 20px",
        position: "relative",
        zIndex: 1,
      }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{
            width: "100%",
            maxWidth: 420,
            background: "rgba(255,255,255,0.04)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 24,
            padding: "36px 32px",
            boxShadow: "0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,58,237,0.08)",
          }}
        >
          {/* Mobile logo */}
          <div className="mobile-logo" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28, justifyContent: "center" }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 16px rgba(124,58,237,0.45)",
            }}>
              <span style={{ fontSize: 14, fontWeight: 900, color: "white" }}>I</span>
            </div>
            <span style={{ fontSize: 17, fontWeight: 800, color: "#f0f0f8" }}>Intellixy</span>
          </div>

          {/* Mode heading */}
          <AnimatePresence mode="wait">
            <motion.div
              key={mode + "-heading"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              style={{ marginBottom: 24 }}
            >
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#f0f0f8", margin: "0 0 6px", letterSpacing: "-0.4px" }}>
                {isLogin ? "Welcome back" : isSignup ? "Create your account" : "Reset password"}
              </h2>
              <p style={{ fontSize: 13.5, color: "rgba(240,240,248,0.45)", margin: 0 }}>
                {isLogin  ? "Sign in to continue to Intellixy"
                : isSignup ? "Start for free — no credit card needed"
                :            "We'll send a reset link to your email"}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Referral bonus banner */}
          <AnimatePresence>
            {isSignup && hasPendingRef && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                style={{
                  padding: "10px 14px",
                  background: "rgba(124,58,237,0.1)",
                  border: "1px solid rgba(124,58,237,0.25)",
                  borderRadius: 12,
                  display: "flex", alignItems: "center", gap: 8,
                  fontSize: 13,
                  overflow: "hidden",
                }}
              >
                <span style={{ fontSize: 16 }}>🎁</span>
                <span style={{ color: "rgba(240,240,248,0.7)" }}>
                  <strong style={{ color: "#f0f0f8" }}>+20 free credits</strong> waiting — create your account to claim!
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Status message */}
          <AnimatePresence>
            {status && (
              <motion.div
                key={status.msg}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                style={{
                  marginBottom: 16,
                  padding: "10px 14px",
                  borderRadius: 10,
                  fontSize: 13,
                  background: status.type === "error" ? "rgba(239,68,68,0.1)" : "rgba(74,222,128,0.1)",
                  border: `1px solid ${status.type === "error" ? "rgba(239,68,68,0.3)" : "rgba(74,222,128,0.3)"}`,
                  color: status.type === "error" ? "#fca5a5" : "#86efac",
                }}
              >
                {status.msg}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.22 }}
            >
              {/* Google OAuth */}
              {!isForgot && (
                <>
                  <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    style={{
                      width: "100%",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                      padding: "11px 16px",
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 12,
                      color: "#f0f0f8",
                      fontSize: 14, fontWeight: 600,
                      cursor: loading ? "not-allowed" : "pointer",
                      opacity: loading ? 0.6 : 1,
                      marginBottom: 16,
                      transition: "background 0.15s, border-color 0.15s",
                    }}
                    onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = "rgba(255,255,255,0.09)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; } }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
                  >
                    <svg width="18" height="18" viewBox="0 0 48 48">
                      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
                      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                      <path fill="#4CAF50" d="M24 44c5.2 0 10-1.9 13.7-5l-6.3-5.3C29.5 35.5 26.9 36.5 24 36.5c-5.3 0-9.7-3.1-11.3-7.4l-6.6 5.1C9.6 39.6 16.3 44 24 44z"/>
                      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.4 4.2-4.4 5.5l6.3 5.3C42.9 34.9 44 29.8 44 24c0-1.3-.1-2.6-.4-3.9z"/>
                    </svg>
                    {loading ? "Loading…" : isLogin ? "Continue with Google" : "Sign up with Google"}
                  </button>

                  {/* Divider */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
                    <span style={{ fontSize: 12, color: "rgba(240,240,248,0.3)", fontWeight: 500 }}>or continue with email</span>
                    <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
                  </div>
                </>
              )}

              {/* Email */}
              <div style={{ marginBottom: 12, position: "relative" }}>
                <div style={{
                  position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                  color: "rgba(240,240,248,0.3)", pointerEvents: "none",
                }}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                </div>
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoComplete="email"
                  style={{
                    width: "100%",
                    padding: "11px 14px 11px 40px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    color: "#f0f0f8",
                    fontSize: 14,
                    outline: "none",
                    transition: "border-color 0.15s",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => e.target.style.borderColor = "rgba(124,58,237,0.6)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                />
              </div>

              {/* Password */}
              {!isForgot && (
                <div style={{ marginBottom: 20, position: "relative" }}>
                  <div style={{
                    position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                    color: "rgba(240,240,248,0.3)", pointerEvents: "none",
                  }}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                    </svg>
                  </div>
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    style={{
                      width: "100%",
                      padding: "11px 44px 11px 40px",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                      color: "#f0f0f8",
                      fontSize: 14,
                      outline: "none",
                      transition: "border-color 0.15s",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => e.target.style.borderColor = "rgba(124,58,237,0.6)"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    style={{
                      position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer",
                      color: "rgba(240,240,248,0.35)", padding: 4,
                    }}
                  >
                    {showPass ? (
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                      </svg>
                    )}
                  </button>
                </div>
              )}

              {/* Primary button */}
              <motion.button
                onClick={isForgot ? handleForgotPassword : isSignup ? handleEmailSignup : handleEmailLogin}
                disabled={loading}
                whileHover={loading ? {} : { scale: 1.01 }}
                whileTap={loading ? {} : { scale: 0.99 }}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: loading
                    ? "rgba(124,58,237,0.4)"
                    : "linear-gradient(135deg, #7c3aed, #4f46e5)",
                  border: "none",
                  borderRadius: 12,
                  color: "white",
                  fontSize: 14, fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  marginBottom: 20,
                  boxShadow: loading ? "none" : "0 4px 24px rgba(124,58,237,0.4)",
                  transition: "box-shadow 0.15s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                {loading ? (
                  <>
                    <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                    Please wait…
                  </>
                ) : isForgot ? "Send Reset Link"
                  : isSignup  ? "Create Account"
                  : "Sign In"}
              </motion.button>

              {/* Mode switcher */}
              <div style={{ textAlign: "center", fontSize: 13, color: "rgba(240,240,248,0.45)" }}>
                {isLogin && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <button onClick={() => { setMode("forgot"); setStatus(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#a78bfa", fontSize: 13, fontWeight: 500, padding: 0 }}>
                      Forgot password?
                    </button>
                    <span>
                      Don&apos;t have an account?{" "}
                      <button onClick={() => { setMode("signup"); setStatus(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#a78bfa", fontSize: 13, fontWeight: 600, padding: 0 }}>
                        Sign up free
                      </button>
                    </span>
                  </div>
                )}
                {isSignup && (
                  <span>
                    Already have an account?{" "}
                    <button onClick={() => { setMode("login"); setStatus(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#a78bfa", fontSize: 13, fontWeight: 600, padding: 0 }}>
                      Sign in
                    </button>
                  </span>
                )}
                {isForgot && (
                  <button onClick={() => { setMode("login"); setStatus(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#a78bfa", fontSize: 13, fontWeight: 500, padding: 0 }}>
                    ← Back to sign in
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .brand-panel { display: flex !important; }
          .mobile-logo { display: none !important; }
        }
        input::placeholder { color: rgba(240,240,248,0.25); }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 100px rgba(30,20,60,0.9) inset;
          -webkit-text-fill-color: #f0f0f8;
          caret-color: #f0f0f8;
        }
      `}</style>
    </div>
  );
}
