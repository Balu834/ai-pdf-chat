"use client";

import { useState, useEffect } from "react";

/* ────────────────────────────────────────────────────────────────────────────
   ConversionBoosts — two passive conversion nudges:
   1. StickyCtaBar  – fixed bottom bar; appears after the user scrolls 600 px
   2. ExitIntentPopup – fires once when mouse leaves viewport toward the tab bar
   ──────────────────────────────────────────────────────────────────────────── */
export default function ConversionBoosts() {
  const [showSticky, setShowSticky]       = useState(false);
  const [stickyDismissed, setStickyDismissed] = useState(false);
  const [showExit, setShowExit]           = useState(false);
  const [exitFired, setExitFired]         = useState(false);

  useEffect(() => {
    // ── Sticky bar ──
    const onScroll = () => setShowSticky(window.scrollY > 650);
    window.addEventListener("scroll", onScroll, { passive: true });

    // ── Exit intent: mouse leaving toward address bar ──
    const onMouseLeave = (e) => {
      if (e.clientY < 15 && !exitFired) {
        setShowExit(true);
        setExitFired(true);
      }
    };
    document.addEventListener("mouseleave", onMouseLeave);

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [exitFired]);

  return (
    <>
      {/* ── STICKY BOTTOM CTA BAR ─────────────────────────────────────── */}
      {showSticky && !stickyDismissed && (
        <div
          style={{
            position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 90,
            background: "rgba(7,7,26,0.96)",
            borderTop: "1px solid rgba(124,58,237,0.35)",
            backdropFilter: "blur(20px)",
            padding: "12px 20px",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 14,
            boxShadow: "0 -8px 32px rgba(124,58,237,0.18)",
            flexWrap: "wrap",
          }}
        >
          {/* Text */}
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#fff", lineHeight: 1.3 }}>
              Start chatting with your PDFs free
            </span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
              7-day Pro trial · No credit card
            </span>
          </div>

          {/* CTA */}
          <a
            href="/login"
            style={{
              display: "inline-block",
              background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
              color: "#fff",
              fontWeight: 800,
              fontSize: 13,
              padding: "10px 24px",
              borderRadius: 99,
              textDecoration: "none",
              whiteSpace: "nowrap",
              boxShadow: "0 4px 18px rgba(124,58,237,0.45)",
              letterSpacing: "-0.1px",
            }}
          >
            Start Free →
          </a>

          {/* Dismiss */}
          <button
            onClick={() => setStickyDismissed(true)}
            style={{
              position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer",
              color: "rgba(255,255,255,0.3)", fontSize: 20, lineHeight: 1, padding: 4,
            }}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* ── EXIT INTENT POPUP ─────────────────────────────────────────── */}
      {showExit && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setShowExit(false)}
        >
          <div
            style={{
              position: "relative",
              background: "linear-gradient(135deg,rgba(17,17,40,0.98),rgba(7,7,26,0.98))",
              border: "1px solid rgba(124,58,237,0.4)",
              borderRadius: 24,
              padding: "40px 36px",
              maxWidth: 440, width: "100%",
              textAlign: "center",
              boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(124,58,237,0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setShowExit(false)}
              style={{
                position: "absolute", top: 14, right: 16,
                background: "none", border: "none", cursor: "pointer",
                color: "rgba(255,255,255,0.35)", fontSize: 22, lineHeight: 1,
              }}
              aria-label="Close"
            >
              ×
            </button>

            {/* Glow blob */}
            <div style={{ position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)", width: 280, height: 160, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,58,237,0.25),transparent 70%)", filter: "blur(30px)", pointerEvents: "none" }} />

            <div style={{ position: "relative" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "#a78bfa", textTransform: "uppercase", marginBottom: 8 }}>
                Wait — Before You Go
              </p>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: "#fff", margin: "0 0 10px", letterSpacing: "-0.4px", lineHeight: 1.2 }}>
                Get 7 Days of Pro — Completely Free
              </h2>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, margin: "0 0 24px" }}>
                Unlimited PDFs, unlimited questions, full AI power. No credit card required. Cancel anytime.
              </p>

              {/* Feature pills */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 24 }}>
                {["Unlimited uploads","Unlimited questions","Delete PDFs","AI extraction"].map(f => (
                  <span key={f} style={{ fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 99, background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)", color: "#c4b5fd" }}>
                    ✓ {f}
                  </span>
                ))}
              </div>

              <a
                href="/login"
                style={{
                  display: "block",
                  background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 14,
                  padding: "14px 28px",
                  borderRadius: 99,
                  textDecoration: "none",
                  boxShadow: "0 8px 28px rgba(124,58,237,0.5)",
                  letterSpacing: "-0.2px",
                  marginBottom: 12,
                }}
              >
                Start My Free 7-Day Trial →
              </a>

              <button
                onClick={() => setShowExit(false)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "rgba(255,255,255,0.25)", textDecoration: "underline" }}
              >
                No thanks, I don't want free access
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
