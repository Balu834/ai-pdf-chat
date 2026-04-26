"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { T, FADE_UP, SCALE_IN, VP } from "@/components/ui/tokens";
import { Pill, ArrowRight } from "@/components/ui/atoms";

// ── Preset questions mapped to the sample doc ─────────────────────────────────
const PRESETS = [
  "What was Q4 revenue?",
  "What is the EBITDA margin?",
  "How many monthly active users?",
  "What is the churn rate?",
  "What is the Q1 2025 revenue forecast?",
];

// ── Animated cursor ───────────────────────────────────────────────────────────
function Cursor() {
  return (
    <motion.span
      animate={{ opacity: [1, 0, 1] }}
      transition={{ duration: 0.85, repeat: Infinity, ease: "linear" }}
      style={{ display: "inline-block", width: 2, height: "1em", background: T.violet, borderRadius: 1, marginLeft: 2, verticalAlign: "text-bottom" }}
    />
  );
}

// ── Sample document pill ──────────────────────────────────────────────────────
function DocPill() {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 99, background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.22)", marginBottom: 20 }}>
      <span style={{ fontSize: 15 }}>📊</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: "#c4b5fd" }}>Q4 Financial Report (sample)</span>
      <span style={{ fontSize: 10, fontWeight: 600, color: "#4ade80", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)", padding: "2px 7px", borderRadius: 99 }}>Loaded</span>
    </div>
  );
}

// ── Main interactive demo component ──────────────────────────────────────────
function LiveDemo() {
  const [question,   setQuestion]   = useState("");
  const [answer,     setAnswer]     = useState("");
  const [streaming,  setStreaming]  = useState(false);
  const [asked,      setAsked]      = useState(false);
  const [error,      setError]      = useState("");
  const [demoCount,  setDemoCount]  = useState(0);
  const [rateLimit,  setRateLimit]  = useState(false);
  const inputRef  = useRef(null);
  const answerRef = useRef(null);

  // Scroll answer into view once it starts
  useEffect(() => {
    if (answer && answerRef.current) {
      answerRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [!!answer]);

  async function ask(q) {
    const text = (q ?? question).trim();
    if (!text || streaming) return;

    setStreaming(true);
    setAnswer("");
    setError("");
    setAsked(true);

    try {
      const res = await fetch("/api/demo", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ question: text }),
      });

      if (res.status === 429) {
        setRateLimit(true);
        setError("You've tried the demo a few times. Sign up for full access — it's free.");
        setStreaming(false);
        return;
      }
      if (!res.ok) {
        setError("Something went wrong. Try again.");
        setStreaming(false);
        return;
      }

      // Stream the response
      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let   full    = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        full += chunk;
        setAnswer(full);
      }
      setDemoCount((n) => n + 1);
    } catch {
      setError("Network error. Check your connection and try again.");
    }

    setStreaming(false);
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      ask();
    }
  }

  function selectPreset(p) {
    setQuestion(p);
    ask(p);
    inputRef.current?.focus();
  }

  const showSignupNudge = demoCount >= 2 || rateLimit;

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 0 8px" }}>
      <DocPill />

      {/* Preset chips */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {PRESETS.map((p) => (
          <button key={p} onClick={() => selectPreset(p)} disabled={streaming}
            style={{ padding: "6px 14px", borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: streaming ? "default" : "pointer", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.65)", transition: "all 0.15s", opacity: streaming ? 0.6 : 1 }}
            onMouseEnter={(e) => { if (!streaming) { e.currentTarget.style.background = "rgba(124,58,237,0.12)"; e.currentTarget.style.borderColor = "rgba(124,58,237,0.3)"; e.currentTarget.style.color = "#c4b5fd"; } }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.65)"; }}>
            {p}
          </button>
        ))}
      </div>

      {/* Input row */}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          ref={inputRef}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask anything about the PDF…"
          disabled={streaming}
          style={{ flex: 1, padding: "11px 16px", borderRadius: 12, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: T.text, fontSize: 14, outline: "none", transition: "border-color 0.15s", fontFamily: "inherit" }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.45)"; }}
          onBlur={(e)  => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
        />
        <button onClick={() => ask()} disabled={streaming || !question.trim()}
          style={{ padding: "11px 22px", borderRadius: 12, background: streaming || !question.trim() ? "rgba(124,58,237,0.3)" : "linear-gradient(135deg,#7c3aed,#06b6d4)", border: "none", color: "white", fontWeight: 700, fontSize: 13, cursor: streaming || !question.trim() ? "default" : "pointer", whiteSpace: "nowrap", transition: "all 0.15s", minWidth: 80 }}>
          {streaming ? (
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} style={{ display: "inline-block", width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%" }} />
              Asking
            </span>
          ) : "Ask →"}
        </button>
      </div>

      {/* Answer box */}
      {(answer || streaming) && (
        <motion.div ref={answerRef}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
          style={{ marginTop: 14, padding: "16px 18px", background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.18)", borderRadius: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{ width: 22, height: 22, borderRadius: 7, background: "linear-gradient(135deg,#7c3aed,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="11" height="11" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa" }}>Intellixy AI</span>
            {streaming && (
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginLeft: 4 }}>answering…</span>
            )}
          </div>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>
            {answer}
            {streaming && <Cursor />}
          </p>
        </motion.div>
      )}

      {/* Error */}
      {error && (
        <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: 10, fontSize: 13, color: "#fca5a5" }}>
          {error}
        </div>
      )}

      {/* Post-answer CTA — appears after 2nd demo question */}
      {showSignupNudge && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          style={{ marginTop: 16, padding: "18px 20px", background: "linear-gradient(135deg, rgba(124,58,237,0.12), rgba(6,182,212,0.07))", border: "1px solid rgba(124,58,237,0.25)", borderRadius: 14, textAlign: "center" }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: "0 0 4px" }}>
            Ready to chat with your own PDFs?
          </p>
          <p style={{ fontSize: 12, color: T.muted, margin: "0 0 14px" }}>
            Upload any PDF — contracts, research papers, textbooks, reports. Free to start.
          </p>
          <a href="/login"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 28px", background: "linear-gradient(135deg,#7c3aed,#06b6d4)", borderRadius: 99, color: "white", fontWeight: 800, fontSize: 13, textDecoration: "none", boxShadow: "0 6px 24px rgba(124,58,237,0.45)", letterSpacing: "-0.1px" }}>
            Upload your PDF free <ArrowRight size={14} />
          </a>
          <p style={{ fontSize: 11, color: T.faint, margin: "8px 0 0" }}>No credit card · Free plan · 30 seconds to start</p>
        </motion.div>
      )}

      {/* Subtle CTA after first answer */}
      {asked && !showSignupNudge && answer && !streaming && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          style={{ marginTop: 12, textAlign: "center" }}>
          <a href="/login" style={{ fontSize: 12, color: "#a78bfa", textDecoration: "none", fontWeight: 600 }}>
            Try with your own PDF — it's free →
          </a>
        </motion.div>
      )}
    </div>
  );
}

// ── Section export ────────────────────────────────────────────────────────────
export default function Demo() {
  return (
    <section id="demo" className="px-5 sm:px-8 py-24 sm:py-32">
      <div className="max-w-[760px] mx-auto">
        <motion.div initial="hidden" whileInView="show" viewport={VP} variants={FADE_UP} className="text-center mb-10">
          <Pill color={T.amber}>Interactive Demo</Pill>
          <h2 className="font-black tracking-tight mt-4 mb-3 text-[clamp(24px,5vw,48px)] leading-[1.1]">
            Try it right now — no signup
          </h2>
          <p className="text-[15px]" style={{ color: T.muted }}>
            Ask a real question. Get a real answer. From a real PDF.
          </p>
        </motion.div>

        <motion.div initial="hidden" whileInView="show" viewport={VP} variants={SCALE_IN}>
          <div className="rounded-[22px] overflow-hidden p-6 sm:p-8"
            style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${T.border}`, boxShadow: "0 32px 90px rgba(0,0,0,0.5)" }}>
            <LiveDemo />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
