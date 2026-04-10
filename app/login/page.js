"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login"); // "login" | "signup" | "forgot"
  const [status, setStatus] = useState(null); // { type: "error"|"success", msg: string }

  // Read error param from URL (useEffect avoids hydration mismatch)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err) {
      window.history.replaceState({}, document.title, "/login");
      setStatus({ type: "error", msg: decodeURIComponent(err) });
    }
  }, []);

  // Auto-redirect if already logged in (server-validated)
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.push("/dashboard");
    });
  }, [router]);

  // ── Google OAuth ──────────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setLoading(true);
    setStatus(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: "select_account consent" },
      },
    });
    if (error) {
      setStatus({ type: "error", msg: error.message });
      setLoading(false);
    }
    // on success the browser navigates away — no need to setLoading(false)
  };

  // ── Email Sign In ─────────────────────────────────────────────────────────
  const handleEmailLogin = async () => {
    if (!email || !password) return setStatus({ type: "error", msg: "Enter your email and password." });
    setLoading(true);
    setStatus(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setStatus({ type: "error", msg: error.message });
    } else {
      router.push("/dashboard");
    }
    setLoading(false);
  };

  // ── Email Sign Up ─────────────────────────────────────────────────────────
  const handleEmailSignup = async () => {
    if (!email || !password) return setStatus({ type: "error", msg: "Enter your email and password." });
    setLoading(true);
    setStatus(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setStatus({ type: "error", msg: error.message });
    } else {
      setStatus({ type: "success", msg: "Check your email to confirm your account." });
    }
    setLoading(false);
  };

  // ── Forgot Password ───────────────────────────────────────────────────────
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

  const isLogin = mode === "login";
  const isSignup = mode === "signup";
  const isForgot = mode === "forgot";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f1a]">
      <div className="bg-[#111827] p-8 rounded-2xl w-[400px] shadow-lg">

        <h1 className="text-2xl font-bold text-white text-center mb-2">
          {isLogin ? "Welcome back" : isSignup ? "Create account" : "Reset password"}
        </h1>
        <p className="text-gray-400 text-center mb-6">
          {isLogin ? "Sign in to continue to Intellixy" :
           isSignup ? "Sign up to get started with Intellixy" :
           "We'll send a reset link to your email"}
        </p>

        {/* Status message */}
        {status && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${
            status.type === "error"
              ? "bg-red-900/40 border border-red-700 text-red-300"
              : "bg-green-900/40 border border-green-700 text-green-300"
          }`}>
            {status.msg}
          </div>
        )}

        {/* Google login — only on login / signup screens */}
        {!isForgot && (
          <>
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg mb-4 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 10-1.9 13.7-5l-6.3-5.3C29.5 35.5 26.9 36.5 24 36.5c-5.3 0-9.7-3.1-11.3-7.4l-6.6 5.1C9.6 39.6 16.3 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.4 4.2-4.4 5.5l6.3 5.3C42.9 34.9 44 29.8 44 24c0-1.3-.1-2.6-.4-3.9z"/>
              </svg>
              {loading ? "Loading..." : isLogin ? "Continue with Google" : "Sign up with Google"}
            </button>

            <div className="text-center text-gray-500 text-sm mb-4">or continue with email</div>
          </>
        )}

        {/* Email input */}
        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 mb-3 rounded bg-gray-900 text-white border border-gray-700 focus:border-purple-500 focus:outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (isForgot) handleForgotPassword();
              else if (isSignup) handleEmailSignup();
              else handleEmailLogin();
            }
          }}
        />

        {/* Password input — hidden on forgot */}
        {!isForgot && (
          <input
            type="password"
            placeholder="Password"
            className="w-full p-2 mb-4 rounded bg-gray-900 text-white border border-gray-700 focus:border-purple-500 focus:outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (isSignup) handleEmailSignup();
                else handleEmailLogin();
              }
            }}
          />
        )}

        {/* Primary action button */}
        <button
          onClick={isForgot ? handleForgotPassword : isSignup ? handleEmailSignup : handleEmailLogin}
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded-lg text-white font-medium transition-colors mb-4"
        >
          {loading
            ? "Please wait..."
            : isForgot ? "Send Reset Link"
            : isSignup ? "Create Account"
            : "Sign In"}
        </button>

        {/* Mode switcher links */}
        <div className="text-center text-sm text-gray-500 space-y-2">
          {isLogin && (
            <>
              <div>
                <button onClick={() => { setMode("forgot"); setStatus(null); }} className="text-purple-400 hover:text-purple-300 transition-colors">
                  Forgot password?
                </button>
              </div>
              <div>
                Don't have an account?{" "}
                <button onClick={() => { setMode("signup"); setStatus(null); }} className="text-purple-400 hover:text-purple-300 transition-colors">
                  Sign up
                </button>
              </div>
            </>
          )}
          {isSignup && (
            <div>
              Already have an account?{" "}
              <button onClick={() => { setMode("login"); setStatus(null); }} className="text-purple-400 hover:text-purple-300 transition-colors">
                Sign in
              </button>
            </div>
          )}
          {isForgot && (
            <div>
              <button onClick={() => { setMode("login"); setStatus(null); }} className="text-purple-400 hover:text-purple-300 transition-colors">
                ← Back to sign in
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
