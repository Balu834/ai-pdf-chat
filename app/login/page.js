"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

const supabase = createClient();

export default function LoginPage() {
  const [mode, setMode] = useState("login"); // "login" | "signup" | "forgot"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState(null);
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
    <div className="min-h-screen flex items-center justify-center bg-[#07071a] px-4 py-12 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full bg-violet-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full bg-indigo-600/15 blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/40">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">AI PDF Chat</span>
          </a>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-white text-center mb-1">
            {mode === "login" && "Welcome back"}
            {mode === "signup" && "Create your account"}
            {mode === "forgot" && "Reset password"}
          </h1>
          <p className="text-gray-400 text-sm text-center mb-6">
            {mode === "login" && "Sign in to continue to AI PDF Chat"}
            {mode === "signup" && "Start for free — no credit card required"}
            {mode === "forgot" && "Enter your email and we'll send a reset link"}
          </p>

          {/* Tabs */}
          {!isForgot && (
            <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 mb-6">
              {["login", "signup"].map((m) => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    mode === m
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md"
                      : "text-gray-400 hover:text-white"
                  }`}
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
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white/8 hover:bg-white/12 border border-white/15 rounded-xl text-sm font-semibold text-white transition-all duration-200 mb-4 disabled:opacity-60"
              >
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.86l6.08-6.08C34.46 3.05 29.48 1 24 1 14.82 1 7.07 6.48 3.64 14.28l7.06 5.49C12.4 13.72 17.73 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.5 24.5c0-1.64-.15-3.22-.42-4.75H24v9h12.67c-.55 2.97-2.2 5.48-4.67 7.17l7.19 5.59C43.45 37.3 46.5 31.35 46.5 24.5z"/>
                  <path fill="#FBBC05" d="M10.7 28.23A14.6 14.6 0 0 1 9.5 24c0-1.47.25-2.89.7-4.23L3.14 14.28A23.94 23.94 0 0 0 1 24c0 3.82.9 7.44 2.64 10.72l7.06-6.49z"/>
                  <path fill="#34A853" d="M24 47c5.48 0 10.08-1.82 13.44-4.94l-7.19-5.59C28.44 37.84 26.32 38.5 24 38.5c-6.27 0-11.6-4.22-13.3-9.77l-7.06 6.49C7.07 43.52 14.82 47 24 47z"/>
                </svg>
                Continue with Google
              </button>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-[#0d0d24] px-3 text-xs text-gray-500">or continue with email</span>
                </div>
              </div>
            </>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                suppressHydrationWarning
                className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition-all duration-200"
              />
            </div>

            {!isForgot && (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-sm font-medium text-gray-300">Password</label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => switchMode("forgot")}
                      className="text-xs text-violet-400 hover:text-violet-300 transition-colors bg-transparent border-none cursor-pointer p-0 font-medium"
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
                  className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition-all duration-200"
                />
              </div>
            )}

            {status && (
              <div className={`px-4 py-3 rounded-xl text-sm border ${
                status.type === "error"
                  ? "bg-red-500/10 border-red-500/30 text-red-400"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              }`}>
                {status.msg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed mt-1"
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
                className="text-sm text-gray-400 hover:text-white transition-colors text-center bg-transparent border-none cursor-pointer p-0 font-medium"
              >
                ← Back to Sign In
              </button>
            )}
          </form>

          {/* Free plan info */}
          {!isForgot && (
            <div className="mt-6 pt-5 border-t border-white/8">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center mb-3">Free plan includes</p>
              <div className="flex justify-center gap-6">
                <div className="flex items-center gap-1.5 text-sm text-gray-400">
                  <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  5 PDFs
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-400">
                  <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  20 questions/day
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
