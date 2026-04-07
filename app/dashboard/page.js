"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase-browser";

const supabase = createClient();

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
function ChatMessage({ msg, onCopy }) {
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
          <button
            onClick={() => onCopy(msg.content)}
            style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "rgba(255,255,255,0.25)", background: "none", border: "none", cursor: "pointer", padding: "2px 0" }}
          >
            <CopyIcon /> Copy
          </button>
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

  const [uploading, setUploading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [limitError, setLimitError] = useState(null);
  const [plan, setPlan] = useState("free");
  const [upgradingStripe, setUpgradingStripe] = useState(false);
  const [usage, setUsage] = useState({ pdfs: 0, questions: 0, maxPdfs: 5, maxQuestions: 20 });

  const [showInsights, setShowInsights] = useState(false);
  const [showCompare, setShowCompare] = useState(false);

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

  async function fetchPlan(userId) {
    try {
      const { data } = await supabase.from("user_plans").select("plan").eq("user_id", userId).single();
      if (data?.plan) {
        setPlan(data.plan);
        if (data.plan === "pro") setUsage((prev) => ({ ...prev, maxPdfs: Infinity, maxQuestions: Infinity }));
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
      if (!res.ok) throw new Error(data.error || "Upload failed");
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

  /* ── Select document ────────────────────────────────────────────────── */
  function selectDoc(doc) {
    setSelectedDoc(doc);
    setMessages([]);
    setLimitError(null);
    setSidebarOpen(false);
    setShowInsights(false);
    setShowCompare(false);
    setTimeout(() => inputRef.current?.focus(), 100);
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
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: 800, color: "white" }}>AI PDF Chat</span>
        </div>

        {/* Upload button */}
        <div style={{ padding: "12px 12px 8px", flexShrink: 0 }}>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "10px", fontSize: 13, fontWeight: 600, color: "white",
              background: "linear-gradient(135deg,rgba(124,58,237,0.7),rgba(79,70,229,0.7))",
              border: "1px solid rgba(124,58,237,0.35)", borderRadius: 10, cursor: uploading ? "not-allowed" : "pointer",
              opacity: uploading ? 0.7 : 1, transition: "all 0.2s",
            }}
          >
            {uploading ? (
              <><div style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> Uploading…</>
            ) : (
              <><PlusIcon /> New PDF</>
            )}
          </button>
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
              { label: "PDFs", used: usage.pdfs, max: usage.maxPdfs },
              { label: "Questions", used: usage.questions, max: usage.maxQuestions },
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
          {plan !== "pro" && (
            <button
              onClick={handleUpgrade}
              disabled={upgradingStripe}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px", fontSize: 12, fontWeight: 700, color: "#fbbf24", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, cursor: "pointer", marginBottom: 8 }}
            >
              <CrownIcon /> {upgradingStripe ? "Loading…" : "Upgrade to Pro · $9/mo"}
            </button>
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
                    <ChatMessage key={msg.id} msg={msg} onCopy={copyText} />
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

      {/* Copy toast */}
      {copied && (
        <div style={{ position: "fixed", bottom: 24, right: 24, padding: "10px 18px", background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.12)", color: "white", fontSize: 13, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.4)", zIndex: 100 }}>
          Copied to clipboard
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .md-sidebar { transform: ${sidebarOpen ? "translateX(0)" : "translateX(-100%)"}; }
        }
        @media (min-width: 769px) {
          .md-sidebar { transform: translateX(0) !important; position: relative !important; z-index: auto !important; }
        }
      `}</style>
    </div>
  );
}
