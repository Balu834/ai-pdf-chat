"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import RazorpayButton from "@/components/RazorpayButton";

/* ─── ICONS ──────────────────────────────────────────────────────────────── */
const PdfIcon = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
    <polyline strokeLinecap="round" strokeLinejoin="round" points="14 2 14 8 20 8"/>
    <line strokeLinecap="round" x1="16" y1="13" x2="8" y2="13"/>
    <line strokeLinecap="round" x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);
const SendIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
const MenuIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);
const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const UploadIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
    <polyline strokeLinecap="round" strokeLinejoin="round" points="17 8 12 3 7 8"/>
    <line strokeLinecap="round" x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);
const LogoutIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
    <polyline strokeLinecap="round" strokeLinejoin="round" points="16 17 21 12 16 7"/>
    <line strokeLinecap="round" x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const SparkleIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
  </svg>
);
const CopyIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <rect x="9" y="9" width="13" height="13" rx="2"/>
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
  </svg>
);
const TrashIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <polyline strokeLinecap="round" strokeLinejoin="round" points="3 6 5 6 21 6"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 11v6M14 11v6"/>
  </svg>
);
const CrownIcon = () => (
  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2L9 9H2l5.5 4L5 20h14l-2.5-7L22 9h-7z"/>
  </svg>
);
const ShareIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
);
const InsightIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
  </svg>
);
const CompareIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01"/>
  </svg>
);
const CloseIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const CheckIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

/* ─── HELPERS ────────────────────────────────────────────────────────────── */
function timeAgo(ts) {
  if (!ts) return "";
  const diff = (Date.now() - new Date(ts)) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return "Yesterday";
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ─── SMART ACTIONS ─────────────────────────────────────────────────────── */
const SMART_ACTIONS = [
  { label: "Summarize", prompt: "Summarize this document in 3-4 sentences covering the main points." },
  { label: "ELI5", prompt: "Explain this document like I'm 5 years old, in simple plain language." },
  { label: "Key Points", prompt: "List the most important key points from this document as bullet points." },
  { label: "Find Risks", prompt: "Identify any risks, warnings, issues or concerns mentioned in this document." },
  { label: "Questions", prompt: "Generate 5 insightful questions someone might ask about this document." },
];

/* ─── UPGRADE POPUP ─────────────────────────────────────────────────────── */
function UpgradePopup({ reason, onClose, user }) {
  const isPdf = reason === "pdf";
  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(8px)", animation: "fadeIn 0.18s ease" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 420, background: "#0f0f23", border: "1px solid rgba(124,58,237,0.4)", borderRadius: 24, padding: 36, textAlign: "center", boxShadow: "0 40px 100px rgba(0,0,0,0.8)", position: "relative", animation: "popIn 0.22s cubic-bezier(0.34,1.56,0.64,1)" }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "4px 8px", cursor: "pointer", color: "rgba(255,255,255,0.4)", fontSize: 12, lineHeight: 1 }}
        >
          ✕
        </button>

        {/* Icon */}
        <div style={{ width: 64, height: 64, borderRadius: 20, background: "linear-gradient(135deg,rgba(124,58,237,0.25),rgba(6,182,212,0.15))", border: "1px solid rgba(124,58,237,0.35)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 28 }}>
          {isPdf ? "📄" : "💬"}
        </div>

        {/* Heading */}
        <p style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 8px" }}>Free limit reached</p>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: "white", margin: "0 0 6px", letterSpacing: "-0.4px" }}>
          You&apos;ve reached your free limit 😄
        </h2>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", margin: "0 0 6px", fontWeight: 600 }}>
          Upgrade to continue using Intellixy — ₹299/month
        </p>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: "0 0 24px", lineHeight: 1.65 }}>
          {isPdf ? "You've used all 5 free PDF uploads." : "You've used all 20 free questions today."}{" "}
          Pro gives you unlimited access.
        </p>

        {/* Price */}
        <div style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.14),rgba(6,182,212,0.07))", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 14, padding: "18px 20px", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 10 }}>
            <svg width="14" height="14" fill="#fbbf24" viewBox="0 0 24 24"><path d="M12 2L9 9H2l5.5 4L5 20h14l-2.5-7L22 9h-7z"/></svg>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#fbbf24" }}>Intellixy Pro</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 4, marginBottom: 14 }}>
            <span style={{ fontSize: 42, fontWeight: 900, color: "white", lineHeight: 1 }}>₹299</span>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", paddingBottom: 6 }}>/month</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {["Unlimited PDF uploads", "Unlimited questions per day", "PDF Compare feature", "Priority AI responses"].map((f) => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
                <svg width="14" height="14" fill="none" stroke="#4ade80" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <RazorpayButton
          user={user}
          style={{ width: "100%", padding: "15px", background: "linear-gradient(135deg,#7c3aed,#06b6d4)", color: "white", fontSize: 15, fontWeight: 800, border: "none", borderRadius: 14, cursor: "pointer", boxShadow: "0 8px 32px rgba(124,58,237,0.45)", letterSpacing: "-0.2px", marginBottom: 12, transition: "opacity 0.2s" }}
        >
          Upgrade Now →
        </RazorpayButton>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.22)", margin: 0 }}>Secure payment via Razorpay &nbsp;·&nbsp; Cancel anytime</p>
      </div>
    </div>
  );
}

/* ─── WELCOME SCREEN ────────────────────────────────────────────────────── */
function WelcomeScreen({ onUpload }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", textAlign: "center" }}>
      <div style={{ width: 64, height: 64, borderRadius: 18, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 16px 40px rgba(124,58,237,0.35)", marginBottom: 24 }}>
        <svg width="28" height="28" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline strokeLinecap="round" strokeLinejoin="round" points="14 2 14 8 20 8"/>
        </svg>
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "white", margin: "0 0 8px" }}>Chat with your PDFs</h2>
      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", maxWidth: 300, margin: "0 0 28px", lineHeight: 1.6 }}>
        Upload a PDF and get instant AI-powered answers, insights, and summaries.
      </p>
      <button
        onClick={onUpload}
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 24px", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "white", fontWeight: 700, fontSize: 14, border: "none", borderRadius: 12, cursor: "pointer", boxShadow: "0 8px 24px rgba(124,58,237,0.4)" }}
      >
        <UploadIcon /> Upload your first PDF
      </button>
      <div style={{ marginTop: 40, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, maxWidth: 480 }}>
        {[
          { icon: "💬", title: "Smart Q&A", desc: "Ask anything about your document" },
          { icon: "⚡", title: "Instant answers", desc: "Smart AI document analysis" },
          { icon: "🔒", title: "Secure", desc: "Your files are private" },
        ].map((f) => (
          <div key={f.title} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 16, textAlign: "left" }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>{f.icon}</div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "white", margin: "0 0 4px" }}>{f.title}</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0 }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── CHAT MESSAGE ───────────────────────────────────────────────────────── */
function ChatMessage({ msg, onCopy, onShare }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", gap: 12, justifyContent: isUser ? "flex-end" : "flex-start" }}>
      {!isUser && (
        <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2, boxShadow: "0 4px 12px rgba(124,58,237,0.3)" }}>
          <SparkleIcon />
        </div>
      )}
      <div style={{ maxWidth: "75%", position: "relative" }}>
        <div style={{
          padding: "10px 16px",
          borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          fontSize: 14,
          lineHeight: 1.65,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          background: isUser
            ? "linear-gradient(135deg,#7c3aed,#4f46e5)"
            : "rgba(255,255,255,0.06)",
          border: isUser ? "none" : "1px solid rgba(255,255,255,0.09)",
          color: isUser ? "white" : "rgba(255,255,255,0.88)",
          boxShadow: isUser ? "0 4px 16px rgba(124,58,237,0.25)" : "none",
        }}>
          {msg.content}
          {msg.streaming && (
            <span style={{ display: "inline-block", width: 6, height: 14, marginLeft: 4, background: "#a78bfa", borderRadius: 2, verticalAlign: "middle", animation: "blink 0.8s step-end infinite" }} />
          )}
        </div>
        {!isUser && !msg.streaming && msg.content && (
          <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => onCopy(msg.content)}
              style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "rgba(255,255,255,0.25)", background: "none", border: "none", cursor: "pointer", padding: "2px 0" }}
            >
              <CopyIcon /> Copy
            </button>
            <button
              onClick={() => onShare(msg.content)}
              style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "rgba(167,139,250,0.55)", background: "none", border: "none", cursor: "pointer", padding: "2px 0" }}
            >
              🔗 Share
            </button>
          </div>
        )}
      </div>
      {isUser && (
        <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>
          U
        </div>
      )}
    </div>
  );
}

/* ─── INSIGHTS PANEL ─────────────────────────────────────────────────────── */
function InsightsPanel({ doc, onClose, onAskQuestion }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!doc) return;
    setInsights(null);
    setError(null);
    // Try to load cached insights first
    fetch(`/api/insights?documentId=${doc.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.summary) setInsights(data);
      })
      .catch(() => {});
  }, [doc?.id]);

  async function generateInsights() {
    if (!doc) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: doc.id, fileUrl: doc.file_url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate insights");
      setInsights(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ width: 300, borderLeft: "1px solid rgba(255,255,255,0.07)", background: "#0a0a1a", display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ color: "#a78bfa" }}><InsightIcon /></div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "white" }}>AI Insights</span>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: 4 }}>
          <CloseIcon />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {!insights && !loading && (
          <div style={{ textAlign: "center", paddingTop: 24 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✨</div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 16, lineHeight: 1.5 }}>
              Generate AI insights for <strong style={{ color: "rgba(255,255,255,0.8)" }}>{doc?.file_name}</strong>
            </p>
            <button
              onClick={generateInsights}
              style={{ padding: "10px 20px", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "white", fontSize: 13, fontWeight: 600, border: "none", borderRadius: 10, cursor: "pointer", width: "100%" }}
            >
              Generate Insights
            </button>
            {error && <p style={{ fontSize: 12, color: "#f87171", marginTop: 12 }}>{error}</p>}
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", paddingTop: 40 }}>
            <div style={{ width: 36, height: 36, border: "3px solid rgba(124,58,237,0.3)", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Analyzing document…</p>
          </div>
        )}

        {insights && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Summary */}
            <div style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 12, padding: 14 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>Summary</p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.6, margin: 0 }}>{insights.summary}</p>
            </div>

            {/* Key Points */}
            {insights.key_points?.length > 0 && (
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 14 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>Key Points</p>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                  {insights.key_points.map((point, i) => (
                    <li key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <span style={{ color: "#7c3aed", flexShrink: 0, marginTop: 2 }}><CheckIcon /></span>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggested Questions */}
            {insights.suggested_questions?.length > 0 && (
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 14 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>Try asking</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {insights.suggested_questions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => onAskQuestion(q)}
                      style={{ padding: "8px 12px", background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 8, fontSize: 12, color: "#c4b5fd", cursor: "pointer", textAlign: "left", lineHeight: 1.4, transition: "all 0.15s" }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={generateInsights}
              style={{ padding: "8px", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12, color: "rgba(255,255,255,0.4)", cursor: "pointer" }}
            >
              Regenerate
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── COMPARE PANEL ──────────────────────────────────────────────────────── */
function ComparePanel({ docs, onClose }) {
  const [doc1Id, setDoc1Id] = useState(docs[0]?.id || "");
  const [doc2Id, setDoc2Id] = useState(docs[1]?.id || "");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleCompare() {
    if (!doc1Id || !doc2Id) {
      setError("Please select two PDFs to compare.");
      return;
    }
    if (doc1Id === doc2Id) {
      setError("Please select two different PDFs.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc1Id, doc2Id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Comparison failed");
      setResult(data.result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const selectStyle = { width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, fontSize: 13, color: "white", outline: "none", cursor: "pointer" };

  return (
    <div style={{ width: 340, borderLeft: "1px solid rgba(255,255,255,0.07)", background: "#0a0a1a", display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden" }}>
      <div style={{ height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ color: "#a78bfa" }}><CompareIcon /></div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "white" }}>Compare PDFs</span>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: 4 }}>
          <CloseIcon />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {docs.length < 2 ? (
          <div style={{ textAlign: "center", paddingTop: 32 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📄</div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
              Upload at least <strong style={{ color: "white" }}>2 PDFs</strong> to compare them.
            </p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", margin: "0 0 6px" }}>Document 1</p>
              <select value={doc1Id} onChange={(e) => { setDoc1Id(e.target.value); setResult(null); setError(null); }} style={selectStyle}>
                <option value="" style={{ background: "#0d0d1a" }}>Select PDF…</option>
                {docs.map((d) => (
                  <option key={d.id} value={d.id} style={{ background: "#0d0d1a" }}>{d.file_name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", margin: "8px 0", color: "rgba(255,255,255,0.2)", fontSize: 13 }}>vs</div>

            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", margin: "0 0 6px" }}>Document 2</p>
              <select value={doc2Id} onChange={(e) => { setDoc2Id(e.target.value); setResult(null); setError(null); }} style={selectStyle}>
                <option value="" style={{ background: "#0d0d1a" }}>Select PDF…</option>
                {docs.map((d) => (
                  <option key={d.id} value={d.id} style={{ background: "#0d0d1a" }}>{d.file_name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleCompare}
              disabled={loading || !doc1Id || !doc2Id}
              style={{ width: "100%", padding: "11px", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "white", fontSize: 13, fontWeight: 600, border: "none", borderRadius: 10, cursor: loading || !doc1Id || !doc2Id ? "not-allowed" : "pointer", opacity: loading || !doc1Id || !doc2Id ? 0.6 : 1, marginBottom: 16, transition: "opacity 0.2s" }}
            >
              {loading ? "Comparing…" : "Compare Documents"}
            </button>

            {loading && (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div style={{ width: 32, height: 32, border: "3px solid rgba(124,58,237,0.3)", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 10px" }} />
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Analyzing both documents…</p>
              </div>
            )}

            {error && (
              <div style={{ padding: "10px 12px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, marginBottom: 12 }}>
                <p style={{ fontSize: 12, color: "#f87171", margin: 0 }}>{error}</p>
              </div>
            )}

            {result && (
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 16 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>Comparison Result</p>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                  {result.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
                    part.startsWith("**") && part.endsWith("**")
                      ? <strong key={i} style={{ color: "white", display: "block", marginTop: i > 0 ? 12 : 0 }}>{part.slice(2, -2)}</strong>
                      : <span key={i}>{part}</span>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ─── MAIN DASHBOARD ─────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [docs, setDocs] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [aiStreaming, setAiStreaming] = useState(false);

  const [historyLoading, setHistoryLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [limitError, setLimitError] = useState(null);
  const [plan, setPlan] = useState("free");
  const [subscriptionSource, setSubscriptionSource] = useState(null); // "razorpay" | "stripe" | null
  const [upgradingStripe, setUpgradingStripe] = useState(false);
  const [usage, setUsage] = useState({ pdfs: 0, questions: 0, maxPdfs: 5, maxQuestions: 20 });

  const [showInsights, setShowInsights] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [showUpgradedToast, setShowUpgradedToast] = useState(false);
  const [upgradePopup, setUpgradePopup] = useState(null); // null | "pdf" | "question"
  const [shareUrl, setShareUrl] = useState(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  /* ── Auth guard ─────────────────────────────────────────────────────── */
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        window.location.href = "/login";
      } else {
        setUser(user);
        setLoading(false);
        fetchDocs(user.id);
        fetchPlan(user.id);
        fetchUsage(user.id);
      }
    });
  }, []);

  /* ── Show upgrade success toast if redirected from Stripe ───────────── */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgraded") === "1") {
      setShowUpgradedToast(true);
      // Clean URL without reload
      window.history.replaceState({}, "", "/dashboard");
      setTimeout(() => setShowUpgradedToast(false), 6000);
    }
  }, []);

  async function fetchPlan(userId) {
    try {
      const { data } = await supabase
        .from("user_plans")
        .select("plan, stripe_subscription_id, razorpay_subscription_id")
        .eq("user_id", userId)
        .maybeSingle();
      if (data?.plan) {
        setPlan(data.plan);
        if (data.plan === "pro") {
          setUsage((prev) => ({ ...prev, maxPdfs: Infinity, maxQuestions: Infinity }));
          if (data.razorpay_subscription_id) setSubscriptionSource("razorpay");
          else if (data.stripe_subscription_id) setSubscriptionSource("stripe");
        }
      }
    } catch {}
  }

  async function fetchUsage(userId) {
    try {
      const { count: pdfCount } = await supabase.from("documents").select("id", { count: "exact", head: true }).eq("user_id", userId);
      const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
      const { count: qCount } = await supabase.from("question_usage").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", startOfDay.toISOString());
      setUsage((prev) => ({ ...prev, pdfs: pdfCount ?? 0, questions: qCount ?? 0 }));
    } catch {}
  }

  const fetchDocs = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from("documents")
      .select("id, file_name, file_url, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (!error && data) setDocs(data);
  }, []);

  /* ── Upload PDF ─────────────────────────────────────────────────────── */
  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !file.name.endsWith(".pdf")) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        if (data.limitExceeded) { setUpgradePopup("pdf"); return; }
        throw new Error(data.error || "Upload failed");
      }
      await fetchDocs(user.id);
      await fetchUsage(user.id);
    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  /* ── Delete document ────────────────────────────────────────────────── */
  async function handleDelete(doc) {
    if (!confirm(`Delete "${doc.file_name}"?`)) return;
    try {
      const urlObj = new URL(doc.file_url);
      const pathMatch = urlObj.pathname.match(/\/object\/public\/pdfs\/(.+)$/);
      if (pathMatch) await supabase.storage.from("pdfs").remove([pathMatch[1]]);
      await supabase.from("documents").delete().eq("id", doc.id);
      if (selectedDoc?.id === doc.id) { setSelectedDoc(null); setMessages([]); setShowInsights(false); setShowCompare(false); }
      await fetchDocs(user.id);
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  }

  /* ── Select document + load its history ───────────────────────────── */
  async function selectDoc(doc) {
    setSelectedDoc(doc);
    setMessages([]);
    setLimitError(null);
    setSidebarOpen(false);
    setShowInsights(false);
    setShowCompare(false);
    setShareUrl(null);
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/messages?documentId=${doc.id}`);
      if (res.ok) {
        const history = await res.json();
        setMessages(
          history.map((m) => ({ id: m.id, role: m.role, content: m.message }))
        );
      }
    } catch {
      // non-fatal — user can still chat
    } finally {
      setHistoryLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  /* ── Clear chat ─────────────────────────────────────────────────────── */
  async function handleClearChat() {
    if (!selectedDoc) return;
    if (!confirm(`Clear all chat history for "${selectedDoc.file_name}"?`)) return;
    try {
      await fetch(`/api/messages?documentId=${selectedDoc.id}`, { method: "DELETE" });
      setMessages([]);
    } catch (err) {
      alert("Could not clear chat: " + err.message);
    }
  }

  /* ── Send message ───────────────────────────────────────────────────── */
  async function handleSend(e, overrideText) {
    e?.preventDefault();
    const text = (overrideText ?? input).trim();
    if (!text || !selectedDoc || aiStreaming) return;

    setInput("");
    setLimitError(null);
    const userMsg = { role: "user", content: text, id: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setAiStreaming(true);

    const aiMsgId = Date.now() + 1;
    setMessages((prev) => [...prev, { role: "assistant", content: "", id: aiMsgId, streaming: true }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, fileUrl: selectedDoc.file_url }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.limitExceeded) {
          setLimitError(data.error);
          setMessages((prev) => prev.filter((m) => m.id !== aiMsgId));
          setUpgradePopup("question");
        } else {
          setMessages((prev) =>
            prev.map((m) => m.id === aiMsgId ? { ...m, content: data.error || "Request failed.", streaming: false } : m)
          );
        }
        return;
      }

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        const pretty = JSON.stringify(data.data, null, 2);
        setMessages((prev) =>
          prev.map((m) => m.id === aiMsgId ? { ...m, content: "```json\n" + pretty + "\n```", streaming: false } : m)
        );
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) => m.id === aiMsgId ? { ...m, content: full } : m)
        );
      }
      setMessages((prev) =>
        prev.map((m) => m.id === aiMsgId ? { ...m, streaming: false } : m)
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) => m.id === aiMsgId ? { ...m, content: "Something went wrong. Please try again.", streaming: false } : m)
      );
    } finally {
      setAiStreaming(false);
      if (user) fetchUsage(user.id);
    }
  }

  /* ── Smart action ───────────────────────────────────────────────────── */
  function handleSmartAction(prompt) {
    if (!selectedDoc || aiStreaming) return;
    handleSend(null, prompt);
  }

  /* ── Stripe upgrade ─────────────────────────────────────────────────── */
  async function handleUpgrade() {
    setUpgradingStripe(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error || "Checkout failed");
    } catch { alert("Checkout failed"); }
    finally { setUpgradingStripe(false); }
  }

  async function handleManageSubscription() {
    setUpgradingStripe(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error || "Could not open billing portal");
    } catch { alert("Could not open billing portal"); }
    finally { setUpgradingStripe(false); }
  }

  /* ── Sign out ───────────────────────────────────────────────────────── */
  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  /* ── Copy ────────────────────────────────────────────────────────────── */
  function copyText(text) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  /* ── Share ───────────────────────────────────────────────────────────── */
  function shareAnswer(text) {
    const shareText = `${text.slice(0, 280)}${text.length > 280 ? "…" : ""}\n\n— via Intellixy`;
    if (navigator.share) {
      navigator.share({ text: shareText, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleShareChat() {
    if (!selectedDoc || shareLoading) return;
    setShareLoading(true);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: selectedDoc.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create share link");
      setShareUrl(data.url);
    } catch (err) {
      alert("Share failed: " + err.message);
    } finally {
      setShareLoading(false);
    }
  }

  function copyShareUrl() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).catch(() => {});
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2500);
  }

  /* ── Scroll to bottom ───────────────────────────────────────────────── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  /* ── Loading ─────────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0d0d1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 36, height: 36, border: "3px solid rgba(124,58,237,0.3)", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  const userEmail = user?.email || "";
  const userInitial = userEmail.charAt(0).toUpperCase();
  const rightPanelOpen = (showInsights && !!selectedDoc) || showCompare;

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0d0d1a", overflow: "hidden", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>

      {/* ── Mobile sidebar overlay ─────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 20, background: "rgba(0,0,0,0.6)" }}
        />
      )}

      {/* ── SIDEBAR ───────────────────────────────────────────────────── */}
      <aside style={{
        position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 30,
        width: 240,
        background: "#080814",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex", flexDirection: "column",
        transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.3s ease",
      }}
        className="md-sidebar"
      >
        {/* Logo */}
        <div style={{ height: 56, display: "flex", alignItems: "center", gap: 10, padding: "0 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#7c3aed,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 10px rgba(124,58,237,0.35)" }}>
            <span style={{ fontSize: 14, fontWeight: 900, color: "white" }}>I</span>
          </div>
          <span style={{ fontSize: 15, fontWeight: 800, color: "white", letterSpacing: "-0.2px" }}>Intellixy</span>
        </div>

        {/* Upload button */}
        <div style={{ padding: "12px 12px 8px", flexShrink: 0 }}>
          {(() => {
            const pdfLimitHit = plan !== "pro" && usage.pdfs >= usage.maxPdfs;
            const disabled = uploading || pdfLimitHit;
            return (
              <button
                onClick={() => pdfLimitHit ? setUpgradePopup("pdf") : fileInputRef.current?.click()}
                disabled={uploading}
                title={pdfLimitHit ? "PDF limit reached — upgrade to add more" : undefined}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "10px", fontSize: 13, fontWeight: 600, color: "white",
                  background: pdfLimitHit ? "rgba(239,68,68,0.15)" : "linear-gradient(135deg,rgba(124,58,237,0.7),rgba(79,70,229,0.7))",
                  border: pdfLimitHit ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(124,58,237,0.35)",
                  borderRadius: 10, cursor: disabled ? "not-allowed" : "pointer",
                  opacity: uploading ? 0.7 : 1, transition: "all 0.2s",
                }}
              >
                {uploading ? (
                  <><div style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> Uploading…</>
                ) : pdfLimitHit ? (
                  <><span style={{ fontSize: 13 }}>🔒</span> PDF limit reached</>
                ) : (
                  <><PlusIcon /> New PDF</>
                )}
              </button>
            );
          })()}
          <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleUpload} style={{ display: "none" }} />
        </div>

        {/* PDF list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 8px" }}>
          {docs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>No PDFs yet</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.12)", marginTop: 4 }}>Upload one to get started</p>
            </div>
          ) : (
            docs.map((doc) => {
              const isSelected = selectedDoc?.id === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => selectDoc(doc)}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 8, padding: "9px 10px",
                    borderRadius: 8, cursor: "pointer", marginBottom: 2,
                    background: isSelected ? "rgba(124,58,237,0.18)" : "transparent",
                    border: isSelected ? "1px solid rgba(124,58,237,0.28)" : "1px solid transparent",
                    transition: "all 0.15s",
                  }}
                >
                  <span style={{ color: isSelected ? "#a78bfa" : "rgba(255,255,255,0.3)", marginTop: 1, flexShrink: 0 }}><PdfIcon /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 500, color: isSelected ? "#e2d9f7" : "rgba(255,255,255,0.65)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {doc.file_name}
                    </p>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", margin: "2px 0 0" }}>{timeAgo(doc.created_at)}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(doc); }}
                    style={{ opacity: 0, background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 2, borderRadius: 4, flexShrink: 0, transition: "opacity 0.15s" }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = "0"}
                  >
                    <TrashIcon />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Usage */}
        {plan !== "pro" && (
          <div style={{ margin: "0 10px 8px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "12px" }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 10px" }}>Usage Today</p>
            {[
              { label: "PDFs used today", used: usage.pdfs, max: usage.maxPdfs },
              { label: "Questions today", used: usage.questions, max: usage.maxQuestions },
            ].map(({ label, used, max }) => (
              <div key={label} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{label}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: used >= max ? "#f87171" : "rgba(255,255,255,0.5)" }}>{used} / {max}</span>
                </div>
                <div style={{ height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 99, transition: "width 0.5s",
                    width: `${Math.min((used / max) * 100, 100)}%`,
                    background: used >= max ? "linear-gradient(90deg,#ef4444,#dc2626)"
                      : used / max > 0.7 ? "linear-gradient(90deg,#f59e0b,#d97706)"
                      : "linear-gradient(90deg,#7c3aed,#4f46e5)",
                  }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "10px", flexShrink: 0 }}>
          {plan !== "pro" ? (
            <RazorpayButton
              user={user}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px", fontSize: 12, fontWeight: 700, color: "#fbbf24", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, cursor: "pointer", marginBottom: 8 }}
            >
              <CrownIcon /> Upgrade to Pro · ₹299/mo
            </RazorpayButton>
          ) : (
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "5px", marginBottom: 6 }}>
                <svg width="12" height="12" fill="#fbbf24" viewBox="0 0 24 24"><path d="M12 2L9 9H2l5.5 4L5 20h14l-2.5-7L22 9h-7z"/></svg>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#fbbf24" }}>Pro Plan Active</span>
              </div>
              {subscriptionSource === "razorpay" ? (
                <a
                  href="https://dashboard.razorpay.com/subscriptions"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "block", width: "100%", padding: "7px", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.45)", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, cursor: "pointer", textAlign: "center", textDecoration: "none", boxSizing: "border-box" }}
                >
                  Manage Subscription ↗
                </a>
              ) : (
                <button
                  onClick={handleManageSubscription}
                  disabled={upgradingStripe}
                  style={{ width: "100%", padding: "7px", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.45)", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, cursor: upgradingStripe ? "not-allowed" : "pointer", opacity: upgradingStripe ? 0.6 : 1 }}
                >
                  {upgradingStripe ? "Loading…" : "Manage Subscription"}
                </button>
              )}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 4px" }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "white", flexShrink: 0 }}>
              {userInitial}
            </div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>{userEmail}</p>
            <button onClick={handleSignOut} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 4 }}>
              <LogoutIcon />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN + RIGHT PANEL wrapper ────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", marginLeft: 240, overflow: "hidden" }}>

        {/* ── HEADER ────────────────────────────────────────────────────── */}
        <header style={{ height: 56, display: "flex", alignItems: "center", gap: 10, padding: "0 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0, background: "rgba(13,13,26,0.95)" }}>
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)", padding: 6, borderRadius: 6, display: "none" }}
          >
            <MenuIcon />
          </button>

          {selectedDoc ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
              <span style={{ color: "#a78bfa", flexShrink: 0 }}><PdfIcon /></span>
              <span style={{ fontSize: 14, fontWeight: 600, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedDoc.file_name}</span>
            </div>
          ) : (
            <h1 style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.4)", flex: 1, margin: 0 }}>Select a PDF to start chatting</h1>
          )}

          {/* Header action buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            {plan === "pro" && (
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 700, color: "#fbbf24", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", padding: "3px 10px", borderRadius: 99 }}>
                <CrownIcon /> PRO
              </span>
            )}
            {selectedDoc && (
              <>
                {/* Clear chat — only show when there are messages */}
                {messages.length > 0 && (
                  <button
                    onClick={handleClearChat}
                    title="Clear chat history"
                    style={{
                      display: "flex", alignItems: "center", gap: 5, padding: "6px 12px",
                      background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.2)",
                      borderRadius: 8, fontSize: 12, fontWeight: 600,
                      color: "rgba(248,113,113,0.8)",
                      cursor: "pointer", transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.18)"; e.currentTarget.style.color = "#f87171"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; e.currentTarget.style.color = "rgba(248,113,113,0.8)"; }}
                  >
                    <TrashIcon /> Clear
                  </button>
                )}
                <button
                  onClick={handleShareChat}
                  disabled={shareLoading}
                  style={{
                    display: "flex", alignItems: "center", gap: 5, padding: "6px 12px",
                    background: shareUrl ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.05)",
                    border: shareUrl ? "1px solid rgba(34,197,94,0.35)" : "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8, fontSize: 12, fontWeight: 600,
                    color: shareUrl ? "#4ade80" : "rgba(255,255,255,0.6)",
                    cursor: shareLoading ? "not-allowed" : "pointer",
                    opacity: shareLoading ? 0.7 : 1,
                    transition: "all 0.15s",
                  }}
                >
                  {shareLoading
                    ? <><div style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> Sharing…</>
                    : <><ShareIcon /> Share</>
                  }
                </button>
                <button
                  onClick={() => { setShowInsights(!showInsights); setShowCompare(false); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 5, padding: "6px 12px",
                    background: showInsights ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.05)",
                    border: showInsights ? "1px solid rgba(124,58,237,0.4)" : "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8, fontSize: 12, fontWeight: 600,
                    color: showInsights ? "#c4b5fd" : "rgba(255,255,255,0.6)",
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  <InsightIcon /> Insights
                </button>
              </>
            )}
            {docs.length >= 2 && (
              <button
                onClick={() => { setShowCompare(!showCompare); setShowInsights(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: 5, padding: "6px 12px",
                  background: showCompare ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.05)",
                  border: showCompare ? "1px solid rgba(124,58,237,0.4)" : "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8, fontSize: 12, fontWeight: 600,
                  color: showCompare ? "#c4b5fd" : "rgba(255,255,255,0.6)",
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                <CompareIcon /> Compare
              </button>
            )}
          </div>
        </header>

        {/* ── CONTENT ROW ────────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

          {/* ── CHAT AREA ─────────────────────────────────────────────────── */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

            {/* Smart action bar */}
            {selectedDoc && (
              <div style={{ padding: "10px 16px 0", display: "flex", gap: 6, flexWrap: "wrap", flexShrink: 0 }}>
                {SMART_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => handleSmartAction(action.prompt)}
                    disabled={aiStreaming}
                    style={{
                      padding: "5px 12px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.09)",
                      borderRadius: 99,
                      fontSize: 12,
                      fontWeight: 500,
                      color: "rgba(255,255,255,0.55)",
                      cursor: aiStreaming ? "not-allowed" : "pointer",
                      opacity: aiStreaming ? 0.5 : 1,
                      transition: "all 0.15s",
                      whiteSpace: "nowrap",
                    }}
                    onMouseEnter={(e) => {
                      if (!aiStreaming) {
                        e.currentTarget.style.background = "rgba(124,58,237,0.15)";
                        e.currentTarget.style.borderColor = "rgba(124,58,237,0.35)";
                        e.currentTarget.style.color = "#c4b5fd";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)";
                      e.currentTarget.style.color = "rgba(255,255,255,0.55)";
                    }}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
              {!selectedDoc ? (
                <WelcomeScreen onUpload={() => fileInputRef.current?.click()} />
              ) : historyLoading ? (
                /* Loading history spinner */
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "calc(100% - 32px)", gap: 12 }}>
                  <div style={{ width: 32, height: 32, border: "3px solid rgba(124,58,237,0.25)", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", margin: 0 }}>Loading chat history…</p>
                </div>
              ) : messages.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "calc(100% - 32px)", textAlign: "center", padding: "24px" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, boxShadow: "0 8px 24px rgba(124,58,237,0.35)" }}>
                    <SparkleIcon />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "white", margin: "0 0 8px" }}>{selectedDoc.file_name}</h3>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: "0 0 20px" }}>Ask anything about this document, or use a smart action above</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 480 }}>
                    {["What is this document about?", "List the main topics", "Any important dates or numbers?", "Summarize in 3 sentences"].map((q) => (
                      <button
                        key={q}
                        onClick={() => { setInput(q); inputRef.current?.focus(); }}
                        style={{ padding: "7px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 8, fontSize: 12, color: "rgba(255,255,255,0.5)", cursor: "pointer", transition: "all 0.15s" }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20, paddingBottom: 8 }}>
                  {messages.map((msg) => (
                    <ChatMessage key={msg.id} msg={msg} onCopy={copyText} onShare={shareAnswer} />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Limit error */}
            {limitError && (
              <div style={{ margin: "0 16px 8px", padding: "10px 14px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <p style={{ fontSize: 12, color: "#fbbf24", margin: 0 }}>{limitError}</p>
                <button onClick={handleUpgrade} disabled={upgradingStripe} style={{ padding: "5px 12px", background: "#f59e0b", color: "black", fontSize: 12, fontWeight: 700, border: "none", borderRadius: 6, cursor: "pointer", flexShrink: 0 }}>
                  {upgradingStripe ? "…" : "Upgrade"}
                </button>
              </div>
            )}

            {/* Input bar */}
            {selectedDoc && (
              <div style={{ padding: "8px 16px 16px", flexShrink: 0 }}>
                {(() => {
                  const qLimitHit = plan !== "pro" && usage.questions >= usage.maxQuestions;
                  if (qLimitHit) {
                    return (
                      <div style={{ maxWidth: 720, margin: "0 auto", padding: "14px 18px", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#f87171", margin: "0 0 2px" }}>🔒 Daily question limit reached</p>
                          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0 }}>Upgrade to Pro for unlimited questions</p>
                        </div>
                        <button
                          onClick={() => setUpgradePopup("question")}
                          style={{ padding: "8px 16px", background: "linear-gradient(135deg,#7c3aed,#06b6d4)", color: "white", fontSize: 12, fontWeight: 700, border: "none", borderRadius: 10, cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap" }}
                        >
                          Upgrade Now
                        </button>
                      </div>
                    );
                  }
                  return (
                <form
                  onSubmit={handleSend}
                  style={{ display: "flex", alignItems: "flex-end", gap: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "12px 14px", maxWidth: 720, margin: "0 auto", transition: "border-color 0.2s" }}
                >
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Ask about ${selectedDoc.file_name}…`}
                    disabled={aiStreaming}
                    rows={1}
                    suppressHydrationWarning
                    style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 14, color: "white", resize: "none", lineHeight: 1.5, maxHeight: 120, minHeight: 22 }}
                    onInput={(e) => {
                      e.target.style.height = "auto";
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || aiStreaming}
                    style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", border: "none", cursor: !input.trim() || aiStreaming ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: !input.trim() || aiStreaming ? 0.4 : 1, transition: "all 0.2s", color: "white" }}
                  >
                    {aiStreaming
                      ? <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                      : <SendIcon />
                    }
                  </button>
                </form>
                  );
                })()}
                <p style={{ textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.15)", marginTop: 6 }}>
                  AI answers are based on your PDF content only
                </p>
              </div>
            )}
          </div>

          {/* ── RIGHT PANEL (Insights or Compare) ─────────────────────── */}
          {rightPanelOpen && showInsights && selectedDoc && (
            <InsightsPanel
              doc={selectedDoc}
              onClose={() => setShowInsights(false)}
              onAskQuestion={(q) => {
                setShowInsights(false);
                setTimeout(() => handleSend(null, q), 100);
              }}
            />
          )}
          {rightPanelOpen && showCompare && (
            <ComparePanel
              docs={docs}
              onClose={() => setShowCompare(false)}
            />
          )}
        </div>
      </div>

      {/* Upgrade popup */}
      {upgradePopup && (
        <UpgradePopup
          reason={upgradePopup}
          onClose={() => setUpgradePopup(null)}
          user={user}
        />
      )}

      {/* Share URL modal */}
      {shareUrl && (
        <div
          onClick={() => setShareUrl(null)}
          style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(10px)" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 460, background: "#0d0d22", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 22, padding: 28, boxShadow: "0 40px 100px rgba(0,0,0,0.85)", position: "relative", animation: "popIn 0.22s cubic-bezier(0.34,1.56,0.64,1)" }}
          >
            <button
              onClick={() => setShareUrl(null)}
              style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, padding: "4px 9px", cursor: "pointer", color: "rgba(255,255,255,0.4)", fontSize: 12 }}
            >
              ✕
            </button>

            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,rgba(124,58,237,0.2),rgba(34,197,94,0.12))", border: "1px solid rgba(124,58,237,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                <svg width="20" height="20" fill="none" stroke="#a78bfa" viewBox="0 0 24 24" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              </div>
              <p style={{ fontSize: 17, fontWeight: 800, color: "white", margin: "0 0 4px" }}>Your share link is ready!</p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0 }}>Anyone with this link can view this chat — read only</p>
            </div>

            {/* URL bar + copy */}
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14 }}>
              <div style={{ flex: 1, padding: "10px 13px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 9, fontSize: 12, color: "rgba(255,255,255,0.55)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {shareUrl}
              </div>
              <button
                onClick={copyShareUrl}
                style={{ padding: "10px 16px", background: shareCopied ? "rgba(34,197,94,0.18)" : "linear-gradient(135deg,#7c3aed,#4f46e5)", border: shareCopied ? "1px solid rgba(34,197,94,0.35)" : "none", borderRadius: 9, fontSize: 12, fontWeight: 700, color: shareCopied ? "#4ade80" : "white", cursor: "pointer", flexShrink: 0, transition: "all 0.2s", whiteSpace: "nowrap" }}
              >
                {shareCopied ? "✓ Copied!" : "Copy link"}
              </button>
            </div>

            {/* Social share buttons */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => { const t = encodeURIComponent(`Check out this AI PDF chat: ${shareUrl}`); window.open(`https://wa.me/?text=${t}`, "_blank"); }}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "9px 12px", background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.25)", borderRadius: 9, fontSize: 12, fontWeight: 600, color: "#4ade80", cursor: "pointer", transition: "opacity 0.2s" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </button>
              <button
                onClick={() => { const t = encodeURIComponent("Check out this AI PDF chat on Intellixy 🤖📄"); const u = encodeURIComponent(shareUrl); window.open(`https://twitter.com/intent/tweet?text=${t}&url=${u}`, "_blank"); }}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "9px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.65)", cursor: "pointer", transition: "opacity 0.2s" }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                Share on X
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Copy toast */}
      {copied && (
        <div style={{ position: "fixed", bottom: 24, right: 24, padding: "10px 18px", background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.12)", color: "white", fontSize: 13, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.4)", zIndex: 100 }}>
          Copied to clipboard
        </div>
      )}

      {/* Upgraded toast */}
      {showUpgradedToast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", padding: "14px 24px", background: "linear-gradient(135deg,rgba(34,197,94,0.15),rgba(16,185,129,0.1))", border: "1px solid rgba(34,197,94,0.35)", borderRadius: 14, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", gap: 12, whiteSpace: "nowrap" }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(34,197,94,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="14" height="14" fill="none" stroke="#4ade80" viewBox="0 0 24 24" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "white", margin: 0 }}>Welcome to Pro! 🎉</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: "2px 0 0" }}>You now have unlimited PDFs and questions.</p>
          </div>
          <button onClick={() => setShowUpgradedToast(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 4, marginLeft: 4, flexShrink: 0 }}>
            <CloseIcon />
          </button>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .md-sidebar { transform: ${sidebarOpen ? "translateX(0)" : "translateX(-100%)"}; }
        }
        @media (min-width: 769px) {
          .md-sidebar { transform: translateX(0) !important; position: relative !important; z-index: auto !important; }
        }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.88) translateY(16px) } to { opacity: 1; transform: scale(1) translateY(0) } }
        @keyframes blink { 0%,100% { opacity: 1 } 50% { opacity: 0 } }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}
