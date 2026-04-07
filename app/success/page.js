"use client";

import { useEffect, useState } from "react";

export default function SuccessPage() {
  const [count, setCount] = useState(5);

  useEffect(() => {
    if (count <= 0) { window.location.href = "/dashboard"; return; }
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#07071a",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      padding: 24,
    }}>
      <div style={{ textAlign: "center", maxWidth: 440 }}>
        {/* Success icon */}
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: "linear-gradient(135deg,rgba(34,197,94,0.2),rgba(16,185,129,0.1))",
          border: "2px solid rgba(34,197,94,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px",
          boxShadow: "0 0 40px rgba(34,197,94,0.15)",
        }}>
          <svg width="36" height="36" fill="none" stroke="#4ade80" viewBox="0 0 24 24" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>

        {/* Crown badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)",
          borderRadius: 99, padding: "5px 14px", marginBottom: 20,
        }}>
          <svg width="13" height="13" fill="#fbbf24" viewBox="0 0 24 24">
            <path d="M12 2L9 9H2l5.5 4L5 20h14l-2.5-7L22 9h-7z"/>
          </svg>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#fbbf24" }}>Intellixy Pro Activated</span>
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 900, color: "white", margin: "0 0 12px" }}>
          Welcome to Pro! 🎉
        </h1>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: "0 0 32px" }}>
          Your payment was successful. You now have unlimited PDF uploads and questions.
        </p>

        {/* Feature list */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16, padding: "20px 24px", marginBottom: 28, textAlign: "left",
        }}>
          {[
            "Unlimited PDF uploads",
            "Unlimited questions per day",
            "AI Insights panel",
            "PDF Compare feature",
            "Priority support",
          ].map((f) => (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="10" height="10" fill="none" stroke="#4ade80" viewBox="0 0 24 24" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <span style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>{f}</span>
            </div>
          ))}
        </div>

        <a
          href="/dashboard"
          style={{
            display: "inline-block",
            padding: "13px 32px",
            background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
            color: "white", fontSize: 14, fontWeight: 700,
            textDecoration: "none", borderRadius: 12,
            boxShadow: "0 8px 24px rgba(124,58,237,0.4)",
          }}
        >
          Go to Dashboard
        </a>

        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", marginTop: 16 }}>
          Redirecting in {count}s…
        </p>
      </div>
    </div>
  );
}
