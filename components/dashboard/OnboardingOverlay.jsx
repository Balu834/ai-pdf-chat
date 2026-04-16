"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { C } from "./tokens";
import { UploadIcon, ShieldIcon } from "./icons";

const STORAGE_KEY = "intellixy_onboarded_v1";

const STEPS = [
  {
    id: "welcome",
    emoji: "👋",
    title: "Welcome to Intellixy!",
    subtitle: "You're moments away from your first AI answer from a PDF.",
    body: [
      { icon: "⏱", label: "Save hours", desc: "Get the answer without reading the whole document" },
      { icon: "💡", label: "Instant insights", desc: "Summaries, key data, risks — all extracted automatically" },
      { icon: "🔒", label: "100% private", desc: "Your files are encrypted and never shared" },
    ],
    cta: "Let's get started →",
  },
  {
    id: "upload",
    emoji: "📄",
    title: "Upload your first PDF",
    subtitle: "Drop any document — invoice, contract, report, or textbook. We'll summarize it automatically.",
    tips: ["Works with invoices, bills, legal docs, and reports", "AI will auto-summarize right after upload", "Takes about 10 seconds"],
    cta: "Choose a PDF file",
  },
  {
    id: "try",
    emoji: "✨",
    title: "Now ask anything",
    subtitle: "Your document is ready. Try one of these questions to see the AI in action:",
    prompts: [
      "Summarize this document",
      "What is the total amount?",
      "List the key risks",
      "Explain this in simple terms",
    ],
    cta: "Got it, let me explore →",
  },
];

export default function OnboardingOverlay({ onUpload, onDismiss, onPromptClick, step: externalStep }) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const done = localStorage.getItem(STORAGE_KEY);
      if (!done) setVisible(true);
    } catch {}
  }, []);

  // Sync to external step control (e.g. after upload completes)
  useEffect(() => {
    if (externalStep !== undefined && externalStep !== step) {
      setStep(externalStep);
    }
  }, [externalStep]);

  function dismiss() {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
    setVisible(false);
    onDismiss?.();
  }

  function next() {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else dismiss();
  }

  function handleUploadClick() {
    onUpload?.();
    // Move to try step after a short delay (upload in progress)
    setTimeout(() => setStep(2), 200);
  }

  function handlePromptClick(prompt) {
    onPromptClick?.(prompt);
    dismiss();
  }

  if (!visible) return null;

  const current = STEPS[step];

  return (
    <AnimatePresence>
      <motion.div
        key="overlay-bg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(7,7,26,0.88)",
          backdropFilter: "blur(16px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 20,
        }}
      >
        <motion.div
          key={`step-${step}`}
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -8 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          style={{
            width: "100%", maxWidth: 460,
            background: "rgba(14,14,34,0.97)",
            border: "1px solid rgba(124,58,237,0.3)",
            borderRadius: 24,
            padding: "36px 32px",
            boxShadow: "0 40px 100px rgba(124,58,237,0.25), 0 0 0 1px rgba(255,255,255,0.04) inset",
            position: "relative",
          }}
        >
          {/* Close button */}
          <button
            onClick={dismiss}
            style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", color: C.textMuted, fontSize: 20, lineHeight: 1, padding: 4, borderRadius: 6, transition: "color 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.color = C.textSecondary}
            onMouseLeave={e => e.currentTarget.style.color = C.textMuted}
            aria-label="Close"
          >×</button>

          {/* Step dots */}
          <div style={{ display: "flex", gap: 6, marginBottom: 28, justifyContent: "center" }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{
                width: i === step ? 20 : 6, height: 6, borderRadius: 3,
                background: i === step ? "linear-gradient(90deg,#7c3aed,#06b6d4)" : (i < step ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.12)"),
                transition: "all 0.35s ease",
              }} />
            ))}
          </div>

          {/* Emoji */}
          <div style={{ fontSize: 42, textAlign: "center", marginBottom: 16 }}>{current.emoji}</div>

          {/* Title */}
          <h2 style={{ fontSize: 22, fontWeight: 800, color: C.textPrimary, textAlign: "center", margin: "0 0 10px", letterSpacing: "-0.4px" }}>
            {current.title}
          </h2>

          {/* Subtitle */}
          <p style={{ fontSize: 14, color: C.textSecondary, textAlign: "center", margin: "0 0 28px", lineHeight: 1.65 }}>
            {current.subtitle}
          </p>

          {/* Step 0: value prop list */}
          {step === 0 && current.body && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
              {current.body.map(({ icon, label, desc }) => (
                <div key={label} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12 }}>
                  <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{icon}</span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, margin: "0 0 2px" }}>{label}</p>
                    <p style={{ fontSize: 12, color: C.textMuted, margin: 0, lineHeight: 1.5 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step 1: upload tips */}
          {step === 1 && current.tips && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
              {current.tips.map((tip) => (
                <div key={tip} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: C.textSecondary }}>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(124,58,237,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="9" height="7" fill="none" viewBox="0 0 9 7"><path d="M1 3.5L3.5 6L8 1" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  {tip}
                </div>
              ))}
            </div>
          )}

          {/* Step 2: prompt chips */}
          {step === 2 && current.prompts && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24, justifyContent: "center" }}>
              {current.prompts.map((p) => (
                <motion.button
                  key={p}
                  whileHover={{ scale: 1.03, borderColor: "rgba(124,58,237,0.45)" }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handlePromptClick(p)}
                  style={{
                    padding: "8px 14px",
                    background: "rgba(124,58,237,0.08)",
                    border: "1px solid rgba(124,58,237,0.25)",
                    borderRadius: 10,
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: C.accentLight,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {p}
                </motion.button>
              ))}
            </div>
          )}

          {/* CTA button */}
          <motion.button
            whileHover={{ scale: 1.03, boxShadow: "0 12px 40px rgba(124,58,237,0.6)" }}
            whileTap={{ scale: 0.97 }}
            onClick={step === 1 ? handleUploadClick : (step === 2 ? dismiss : next)}
            style={{
              width: "100%",
              padding: "14px 0",
              background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
              border: "none",
              borderRadius: 13,
              fontSize: 14,
              fontWeight: 700,
              color: "white",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: "0 8px 28px rgba(124,58,237,0.4)",
            }}
          >
            {step === 1 && <UploadIcon />}
            {current.cta}
          </motion.button>

          {/* Skip link */}
          <button
            onClick={dismiss}
            style={{ display: "block", width: "100%", marginTop: 14, background: "none", border: "none", cursor: "pointer", fontSize: 12, color: C.textMuted, textAlign: "center", transition: "color 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.color = C.textSecondary}
            onMouseLeave={e => e.currentTarget.style.color = C.textMuted}
          >
            {step < STEPS.length - 1 ? "Skip for now" : ""}
          </button>

          {/* Privacy note */}
          {step === 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 12, fontSize: 11, color: C.textMuted }}>
              <ShieldIcon /><span>Private & encrypted — never shared</span>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
