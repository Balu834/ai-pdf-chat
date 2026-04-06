"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase-browser";

/* ─────────────────────────────────────────────
   ICON COMPONENTS
───────────────────────────────────────────── */
const Icon = {
  Menu: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  Eye: ({ on }) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={on ? "#fff" : "currentColor"} strokeWidth="2" strokeLinecap="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ),
  External: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  ),
  Download: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  Copy: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  Send: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L12 22M12 2L4 10M12 2L20 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  ),
  Plus: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Trash: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  ),
  PDF: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  Mic: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M19 10a7 7 0 0 1-14 0" /><line x1="12" y1="19" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  ),
  MicOff: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
      <path d="M17 16.95A7 7 0 0 1 5 10v-1m14 0v1a7 7 0 0 1-.11 1.23" />
      <line x1="12" y1="19" x2="12" y2="22" /><line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  ),
  Compare: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="2" y="3" width="8" height="18" rx="1" />
      <rect x="14" y="3" width="8" height="18" rx="1" />
      <line x1="10" y1="12" x2="14" y2="12" />
    </svg>
  ),
  Speaker: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  ),
  Bell: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
};

/* ─────────────────────────────────────────────
   HINT CARDS DATA
───────────────────────────────────────────── */
const HINTS_DEFAULT = [
  { icon: "📎", text: "Upload a PDF to get started" },
  { icon: "💬", text: "Ask questions about your document" },
  { icon: "📊", text: "Extract key data & tables" },
  { icon: "✍️", text: "Summarize or rewrite content" },
];

const HINTS_PDF = [
  { icon: "📋", text: "Summarize this PDF" },
  { icon: "🔑", text: "What are the key points?" },
  { icon: "📊", text: "Extract key data & tables" },
  { icon: "🔍", text: "Find specific information" },
  { icon: "🧾", text: "Extract invoice details" },
  { icon: "✍️", text: "Rewrite the summary section" },
];

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
function ExtractionCard({ data, onCopy, copied }) {
  const fields = data?.extracted_fields || data || {};
  const docType = data?.document_type || "document";

  function renderValue(val) {
    if (val === null || val === undefined || val === "") return <span style={{ color: "#9ca3af" }}>—</span>;
    if (Array.isArray(val)) {
      if (val.length === 0) return <span style={{ color: "#9ca3af" }}>—</span>;
      if (typeof val[0] === "object") {
        return (
          <div style={{ marginTop: 6 }}>
            {val.map((item, i) => (
              <div key={i} style={{ background: "#f3f4f6", borderRadius: 6, padding: "6px 10px", marginBottom: 4, fontSize: 12 }}>
                {Object.entries(item).map(([k, v]) => (
                  <div key={k}><span style={{ color: "#6b7280", fontWeight: 600 }}>{k}:</span> {String(v ?? "—")}</div>
                ))}
              </div>
            ))}
          </div>
        );
      }
      return <span>{val.join(", ")}</span>;
    }
    return <span>{String(val)}</span>;
  }

  return (
    <div style={{ maxWidth: 520, width: "100%", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#111", textTransform: "capitalize" }}>
          📊 {docType.replace(/_/g, " ")} extraction
        </span>
        <button onClick={onCopy} style={{ fontSize: 12, color: copied ? "#4ade80" : "#6b7280", background: "none", border: "1px solid #e5e7eb", borderRadius: 6, padding: "3px 10px", cursor: "pointer" }}>
          {copied ? "✓ Copied" : "Copy JSON"}
        </button>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {Object.entries(fields).map(([key, val]) => (
          <div key={key} style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 8, alignItems: "start", fontSize: 13 }}>
            <span style={{ color: "#6b7280", fontWeight: 600, textTransform: "capitalize", wordBreak: "break-word" }}>
              {key.replace(/_/g, " ")}
            </span>
            <span style={{ color: "#111", wordBreak: "break-word" }}>{renderValue(val)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   AGENT PANEL COMPONENT  (cross-document)
───────────────────────────────────────────── */
function AgentPanel({ job, loading, onQuestionClick, onDismiss, onRerun }) {
  const [tab, setTab] = React.useState("overview");

  if (!loading && !job) return null;

  const r = job?.result || {};
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "differences", label: "Differences" },
    { id: "actions", label: "Actions" },
    { id: "questions", label: "Ask" },
  ];

  return (
    <div style={{
      background: "rgba(255,255,255,0.75)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      border: "1px solid rgba(199,210,254,0.6)",
      borderRadius: 20,
      padding: "20px 22px",
      width: "100%",
      boxShadow: "0 8px 32px rgba(99,102,241,0.08), 0 2px 8px rgba(0,0,0,0.04)",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: "linear-gradient(135deg, #6366f1, #4f46e5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(99,102,241,0.35)", fontSize: 16, flexShrink: 0,
          }}>🤖</div>
          <div>
            <span style={{
              fontSize: 15, fontWeight: 800, letterSpacing: "-0.3px",
              background: "linear-gradient(135deg, #4338ca, #6366f1)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              AI Agent Analysis
            </span>
          </div>
          {job?.doc_count > 0 && (
            <span style={{ fontSize: 11, background: "linear-gradient(135deg,#e0e7ff,#ede9fe)", color: "#4338ca", borderRadius: 20, padding: "3px 10px", fontWeight: 700, border: "1px solid #c4b5fd" }}>
              {job.doc_count} docs
            </span>
          )}
          {job?.status === "running" && (
            <span style={{ fontSize: 11, background: "#fef9c3", color: "#854d0e", borderRadius: 20, padding: "3px 10px", fontWeight: 700, border: "1px solid #fde047" }}>
              Processing…
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {job?.status === "done" && onRerun && (
            <button onClick={onRerun} className="agent-refresh-btn">
              ↻ Refresh
            </button>
          )}
          {!loading && (
            <button onClick={onDismiss} style={{ background: "rgba(165,180,252,0.15)", border: "1px solid rgba(165,180,252,0.3)", color: "#818cf8", cursor: "pointer", fontSize: 14, width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>✕</button>
          )}
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 12, color: "#6366f1", marginBottom: 4 }}>🤖 Analyzing your documents…</div>
          {[90, 70, 80, 55].map((w, i) => (
            <div key={i} style={{
              height: 12, borderRadius: 6, width: `${w}%`,
              background: "linear-gradient(90deg,#e0e7ff 25%,#c7d2fe 50%,#e0e7ff 75%)",
              backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite",
            }} />
          ))}
        </div>
      )}

      {/* Failed state */}
      {!loading && job?.status === "failed" && (
        <p style={{ fontSize: 13, color: "#dc2626" }}>⚠ {job.error || "Analysis failed. Try refreshing."}</p>
      )}

      {/* Done: tabbed content */}
      {!loading && job?.status === "done" && (
        <>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: 16, padding: "4px", background: "rgba(238,242,255,0.7)", borderRadius: 14, width: "fit-content" }}>
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`agent-tab ${tab === t.id ? "agent-tab-active" : ""}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Overview tab */}
          {tab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {r.overview && <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.65 }}>{r.overview}</p>}
              {r.themes?.length > 0 && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Common Themes</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {r.themes.map((t, i) => (
                      <span key={i} className={`theme-chip theme-chip-${i % 4}`}>{t}</span>
                    ))}
                  </div>
                </div>
              )}
              {r.document_summaries?.length > 0 && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Documents</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {r.document_summaries.map((d, i) => (
                      <div key={i} className="doc-summary-item">
                        <div style={{
                          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                          background: "linear-gradient(135deg,#6366f1,#4f46e5)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 11, color: "#fff", fontWeight: 800,
                        }}>{i + 1}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: "#1e1b4b", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</p>
                          <p style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.4 }}>{d.one_liner}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Differences tab */}
          {tab === "differences" && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Key Differences</p>
              {r.key_differences?.length > 0 ? (
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
                  {r.key_differences.map((d, i) => (
                    <li key={i} style={{ fontSize: 13, color: "#374151", display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <span style={{ color: "#dc2626", fontWeight: 700, flexShrink: 0 }}>≠</span>{d}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ fontSize: 13, color: "#9ca3af" }}>No major differences found.</p>
              )}
            </div>
          )}

          {/* Actions tab */}
          {tab === "actions" && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Action Items</p>
              {r.action_items?.length > 0 ? (
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
                  {r.action_items.map((a, i) => (
                    <li key={i} style={{ fontSize: 13, color: "#374151", display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <span style={{ color: "#16a34a", fontWeight: 700, flexShrink: 0 }}>→</span>{a}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ fontSize: 13, color: "#9ca3af" }}>No action items found.</p>
              )}
            </div>
          )}

          {/* Suggested questions tab */}
          {tab === "questions" && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Ask across all documents</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {r.suggested_questions?.map((q, i) => (
                  <button key={i} onClick={() => onQuestionClick(q)} className="suggest-q-btn">{q}</button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   INSIGHTS PANEL COMPONENT
───────────────────────────────────────────── */
function InsightsPanel({ insights, loading, onQuestionClick, onDismiss }) {
  if (!loading && !insights) return null;
  return (
    <div style={{
      background: "rgba(255,255,255,0.75)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      border: "1px solid rgba(191,219,254,0.7)",
      borderRadius: 20,
      padding: "20px 22px",
      width: "100%",
      boxShadow: "0 8px 32px rgba(37,99,235,0.07), 0 2px 8px rgba(0,0,0,0.04)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(37,99,235,0.3)", fontSize: 16,
          }}>✨</div>
          <span style={{
            fontSize: 15, fontWeight: 800, letterSpacing: "-0.3px",
            background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>AI Insights</span>
        </div>
        {!loading && (
          <button onClick={onDismiss} style={{ background: "rgba(147,197,253,0.15)", border: "1px solid rgba(147,197,253,0.35)", color: "#60a5fa", cursor: "pointer", fontSize: 14, width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        )}
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[80, 60, 90, 70].map((w, i) => (
            <div key={i} style={{
              height: 12, borderRadius: 6,
              background: "linear-gradient(90deg, #dbeafe 25%, #bfdbfe 50%, #dbeafe 75%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s infinite",
              width: `${w}%`,
            }} />
          ))}
        </div>
      ) : (
        <>
          {insights.summary && (
            <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.65, marginBottom: 12 }}>
              {insights.summary}
            </p>
          )}
          {insights.key_points?.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Key Points</p>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
                {insights.key_points.map((pt, i) => (
                  <li key={i} style={{ fontSize: 13, color: "#374151", display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{ color: "#2563eb", fontWeight: 700, flexShrink: 0 }}>·</span>
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {insights.suggested_questions?.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Ask about this document</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {insights.suggested_questions.map((q, i) => (
                  <button key={i} onClick={() => onQuestionClick(q)} className="suggest-q-btn">{q}</button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [docs, setDocs] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [typingText, setTypingText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [snackbar, setSnackbar] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [usage, setUsage] = useState(null);

  const [suggestions, setSuggestions] = useState([]);
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  // Agent (cross-document)
  const [agentJob, setAgentJob] = useState(null);
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentDismissed, setAgentDismissed] = useState(false);

  // Alerts
  const [alerts, setAlerts] = useState([]);
  const [alertsOpen, setAlertsOpen] = useState(false);

  // Voice
  const [isRecording, setIsRecording] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false); // auto-speak AI responses
  const [transcribing, setTranscribing] = useState(false);

  // Compare
  const [compareMode, setCompareMode] = useState(false);
  const [compareDoc, setCompareDoc] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareQuestion, setCompareQuestion] = useState("");

  const [selectionBubble, setSelectionBubble] = useState(null); // {x, y, text}

  const chatEndRef = useRef(null);
  const snackbarTimer = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  /* ── Responsive ── */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /* ── Text selection → Ask AI bubble ── */
  useEffect(() => {
    const handleMouseUp = (e) => {
      // Don't trigger inside the input area
      if (textareaRef.current?.contains(e.target)) return;
      setTimeout(() => {
        const sel = window.getSelection();
        const text = sel?.toString().trim();
        if (text && text.length > 10 && text.length < 500) {
          const range = sel.getRangeAt(0).getBoundingClientRect();
          setSelectionBubble({ x: range.left + range.width / 2, y: range.top - 12, text });
        } else {
          setSelectionBubble(null);
        }
      }, 10);
    };
    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, []);

  const handleAskSelection = useCallback(() => {
    if (!selectionBubble) return;
    setInput(`Explain this: "${selectionBubble.text}"`);
    setSelectionBubble(null);
    window.getSelection()?.removeAllRanges();
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, [selectionBubble]);

  const injectPrompt = useCallback((prompt) => {
    setInput(prompt);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, []);

  /* ── Snackbar ── */
  const showSnackbar = useCallback((message, type = "success") => {
    if (snackbarTimer.current) clearTimeout(snackbarTimer.current);
    setSnackbar({ message, type });
    snackbarTimer.current = setTimeout(() => setSnackbar(null), 3000);
  }, []);

  /* ── TTS: speak text ── */
  const speak = useCallback((text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.slice(0, 800));
    utterance.rate = 1.05;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }, []);

  /* ── Voice: start/stop recording ── */
  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setIsRecording(false);
        setTranscribing(true);
        try {
          const blob = new Blob(audioChunksRef.current, { type: mimeType });
          const form = new FormData();
          form.append("audio", blob);
          const res = await fetch("/api/transcribe", { method: "POST", body: form });
          const data = await res.json();
          if (data.text) {
            setInput(data.text);
            setTimeout(() => textareaRef.current?.focus(), 50);
          } else {
            showSnackbar("Could not transcribe audio", "error");
          }
        } catch {
          showSnackbar("Transcription failed", "error");
        } finally {
          setTranscribing(false);
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      showSnackbar("Microphone access denied", "error");
    }
  }, [isRecording, showSnackbar]);

  /* ── Compare two documents ── */
  const handleCompare = useCallback(async (secondDoc) => {
    if (!selectedDoc || !secondDoc) return;
    setCompareLoading(true);
    setCompareMode(false);
    const q = compareQuestion.trim() || "";
    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc1Id: selectedDoc.id, doc2Id: secondDoc.id, question: q }),
      });
      const data = await res.json();
      if (data.error) {
        showSnackbar(data.error, "error");
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            text: `📊 **Comparing "${data.doc1.name}" vs "${data.doc2.name}"**\n\n${data.result}`,
            isCompare: true,
          },
        ]);
      }
    } catch {
      showSnackbar("Comparison failed", "error");
    } finally {
      setCompareLoading(false);
      setCompareQuestion("");
      setCompareDoc(null);
    }
  }, [selectedDoc, compareQuestion, showSnackbar]);

  /* ── Alerts ── */
  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/alerts");
      if (!res.ok) return;
      const data = await res.json();
      setAlerts(Array.isArray(data) ? data : []);
    } catch {}
  }, []);

  const markAlertsRead = useCallback(async () => {
    try {
      await fetch("/api/alerts", { method: "PATCH" });
      setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
    } catch {}
  }, []);

  /* ── Agent: fetch latest job ── */
  const fetchAgentJob = useCallback(async () => {
    try {
      const res = await fetch("/api/agent/status");
      if (!res.ok) return;
      const data = await res.json();
      if (data) { setAgentJob(data); setAgentDismissed(false); }
    } catch {}
  }, []);

  /* ── Agent: trigger cross-document analysis ── */
  const runAgent = useCallback(async () => {
    setAgentLoading(true);
    setAgentDismissed(false);
    try {
      const res = await fetch("/api/agent/run", { method: "POST" });
      const data = await res.json();
      if (data.jobId && !data.skipped) {
        // Poll until done (max 30s, every 2s)
        let attempts = 0;
        const poll = setInterval(async () => {
          attempts++;
          const s = await fetch("/api/agent/status").then((r) => r.json()).catch(() => null);
          if (s?.status === "done" || s?.status === "failed" || attempts > 15) {
            clearInterval(poll);
            setAgentJob(s);
            setAgentLoading(false);
          }
        }, 2000);
      } else {
        // Skipped (already ran recently) — just fetch existing result
        await fetchAgentJob();
        setAgentLoading(false);
      }
    } catch {
      setAgentLoading(false);
    }
  }, [fetchAgentJob]);

  /* ── Data ── */
  const fetchDocs = useCallback(async () => {
    try {
      const res = await fetch("/api/docs");
      if (res.status === 401) { window.location.href = "/login"; return; }
      const data = await res.json();
      setDocs(Array.isArray(data) ? data : []);
    } catch {
      setDocs([]);
    }
  }, []);

  const fetchUsage = useCallback(async () => {
    const res = await fetch("/api/usage");
    if (res.status === 401) { window.location.href = "/login"; return; }
    const data = await res.json();
    if (!data.error) setUsage(data);
  }, []);

  const handleSignOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }, []);

  const handleUpgrade = useCallback(async () => {
    showSnackbar("Redirecting to checkout…");
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (data.url) window.location.href = data.url;
      else showSnackbar(data.error || "Checkout failed", "error");
    } catch {
      showSnackbar("Checkout failed. Please try again.", "error");
    }
  }, [showSnackbar]);

  const handlePortal = useCallback(async () => {
    showSnackbar("Opening billing portal…");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (data.url) window.location.href = data.url;
      else showSnackbar(data.error || "Portal failed", "error");
    } catch {
      showSnackbar("Portal failed. Please try again.", "error");
    }
  }, [showSnackbar]);

  useEffect(() => {
    fetchDocs();
    fetchUsage();
    fetchAgentJob();
    fetchAlerts();
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgraded") === "1") {
      showSnackbar("Welcome to Pro! Limits removed.");
      window.history.replaceState({}, "", "/dashboard");
    }
  }, [fetchDocs, fetchUsage, fetchAgentJob, fetchAlerts, showSnackbar]);

  /* ── Load history + insights when document changes ── */
  useEffect(() => {
    if (!selectedDoc?.id) return;

    // Load chat history
    fetch(`/api/messages?documentId=${selectedDoc.id}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setMessages(data.map((m) => ({
            role: m.role === "assistant" ? "ai" : "user",
            text: m.message,
          })));
        }
      })
      .catch(() => {});

    // Load cached insights (non-blocking)
    setInsightsLoading(true);
    fetch(`/api/insights?documentId=${selectedDoc.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setInsights(data || null))
      .catch(() => setInsights(null))
      .finally(() => setInsightsLoading(false));
  }, [selectedDoc?.id]);

  /* ── Auto scroll ── */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, typingText]);

  /* ── Auto resize textarea ── */
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
  }, [input]);

  /* ── Upload ── */
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    showSnackbar(`Uploading "${file.name}"…`);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (res.status === 401) { window.location.href = "/login"; return; }
    const data = await res.json().catch(() => ({}));
    if (data.url) {
      await fetchDocs();
      await fetchUsage();
      const newDoc = { id: data.id, name: file.name, file_url: data.url };
      setSelectedDoc(newDoc);
      setMessages([]);
      setSuggestions([]);
      setInsights(null);
      showSnackbar("PDF uploaded! Generating insights…");
      // Generate insights in background
      if (data.id) {
        setInsightsLoading(true);
        fetch("/api/insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentId: data.id, fileUrl: data.url }),
        })
          .then((r) => r.json())
          .then((d) => { if (d && !d.error) setInsights(d); })
          .catch(() => {})
          .finally(() => setInsightsLoading(false));
      }
      // Trigger cross-document agent if user has multiple docs
      if (docs.length >= 2) runAgent();
    } else if (data.limitExceeded) {
      showSnackbar(`PDF limit reached (${data.error})`, "error");
    } else {
      showSnackbar("Upload failed", "error");
    }
    e.target.value = "";
  };

  /* ── Chat (streaming) ── */
  const handleAsk = useCallback(async () => {
    if (!selectedDoc) return showSnackbar("Select a PDF first", "error");
    if (!input.trim() || loading || isTyping) return;

    const userText = input.trim();
    setSuggestions([]);
    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, fileUrl: selectedDoc.file_url }),
      });

      if (!res.ok) {
        if (res.status === 401) { window.location.href = "/login"; return; }
        const err = await res.json().catch(() => ({}));
        setLoading(false);
        if (err.limitExceeded) {
          setMessages((prev) => [...prev, { role: "ai", text: `⚠️ ${err.error}\n\nUpgrade your plan to ask more questions.` }]);
          fetchUsage();
        } else {
          setMessages((prev) => [...prev, { role: "ai", text: err.error || "❌ Something went wrong" }]);
        }
        return;
      }

      // Detect extraction response (JSON) vs streaming text
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const json = await res.json().catch(() => ({}));
        setLoading(false);
        if (json.type === "extraction") {
          setMessages((prev) => [...prev, { role: "ai", text: null, extraction: json.data }]);
        } else {
          setMessages((prev) => [...prev, { role: "ai", text: JSON.stringify(json, null, 2) }]);
        }
        fetchUsage();
        return;
      }

      // Switch from loading dots → streaming bubble
      setLoading(false);
      setIsTyping(true);
      setTypingText("");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const token = decoder.decode(value, { stream: true });
        fullText += token;
        setTypingText(fullText);
      }

      // Commit completed message
      setIsTyping(false);
      setTypingText("");
      setMessages((prev) => [...prev, { role: "ai", text: fullText }]);
      fetchUsage();
      // Auto-speak in voice mode
      if (voiceMode) speak(fullText);

      // Fetch follow-up suggestions in background (non-blocking)
      const recentForSuggestions = [
        ...messages.slice(-3).map((m) => ({
          role: m.role === "ai" ? "assistant" : "user",
          content: m.text || "",
        })),
        { role: "user", content: userText },
        { role: "assistant", content: fullText },
      ];
      fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recentMessages: recentForSuggestions }),
      })
        .then((r) => r.json())
        .then((d) => { if (d.suggestions?.length > 0) setSuggestions(d.suggestions); })
        .catch(() => {});
    } catch {
      setLoading(false);
      setIsTyping(false);
      setTypingText("");
      setMessages((prev) => [...prev, { role: "ai", text: "❌ Something went wrong" }]);
    } finally {
      textareaRef.current?.focus();
    }
  }, [selectedDoc, input, loading, isTyping, messages, voiceMode, speak, showSnackbar, fetchUsage]);

  /* ── Delete ── */
  const handleDelete = async (e, doc) => {
    e.stopPropagation();
    const res = await fetch("/api/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: doc.id, fileUrl: doc.file_url }),
    });
    const data = await res.json();
    if (data.success) {
      fetchDocs();
      if (selectedDoc?.id === doc.id) { setSelectedDoc(null); setMessages([]); setPreviewOpen(false); }
      showSnackbar(`"${doc.name}" deleted`);
    } else {
      showSnackbar("Delete failed", "error");
    }
  };

  /* ── Copy message ── */
  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  /* ── Copy PDF link ── */
  const handleCopyLink = () => {
    if (!selectedDoc?.file_url) return;
    navigator.clipboard.writeText(selectedDoc.file_url);
    showSnackbar("Link copied!");
  };

  /* ── Download ── */
  const handleDownload = () => {
    if (!selectedDoc?.file_url) return;
    const a = document.createElement("a");
    a.href = selectedDoc.file_url;
    a.download = selectedDoc.name;
    a.click();
  };

  /* ── Keyboard ── */
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAsk(); }
  };

  const selectDoc = (doc) => {
    // In compare mode, the second click picks the compare target
    if (compareMode && selectedDoc && doc.id !== selectedDoc.id) {
      setCompareDoc(doc);
      return;
    }
    setSelectedDoc(doc);
    setMessages([]);
    setSuggestions([]);
    setInsights(null);
    setInsightsLoading(false);
    setCompareMode(false);
    setCompareDoc(null);
    setPreviewOpen(false);
    setDrawerOpen(false);
  };

  const hints = selectedDoc ? HINTS_PDF : HINTS_DEFAULT;
  const canSend = !!(selectedDoc && !loading && !isTyping && input.trim());

  /* ─────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────── */
  return (
    <div style={s.root}>
      <style>{CSS}</style>

      {/* SNACKBAR */}
      {snackbar && (
        <div className={`snackbar ${snackbar.type === "error" ? "snackbar-error" : "snackbar-success"}`}>
          {snackbar.type === "success" ? "✓ " : "✕ "}{snackbar.message}
        </div>
      )}

      {/* TEXT SELECTION BUBBLE */}
      {selectionBubble && selectedDoc && (
        <button
          onMouseDown={(e) => { e.preventDefault(); handleAskSelection(); }}
          style={{
            position: "fixed",
            left: Math.min(selectionBubble.x, window.innerWidth - 130),
            top: Math.max(selectionBubble.y - 36, 8),
            transform: "translateX(-50%)",
            background: "#1d4ed8",
            color: "#fff",
            border: "none",
            borderRadius: 20,
            padding: "6px 14px",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            zIndex: 9999,
            boxShadow: "0 4px 16px rgba(29,78,216,0.4)",
            whiteSpace: "nowrap",
            fontFamily: "inherit",
          }}
        >
          ⚡ Ask AI
        </button>
      )}

      {/* DRAWER BACKDROP */}
      {drawerOpen && <div style={s.backdrop} onClick={() => setDrawerOpen(false)} />}

      {/* ── DRAWER ── */}
      <aside style={{ ...s.drawer, transform: drawerOpen ? "translateX(0)" : "translateX(-100%)" }}>
        <div style={s.drawerHead}>
          <div style={s.drawerBrand}>
            <div style={s.brandDot}>⚡</div>
            <span style={s.brandName}>PDF Chat</span>
          </div>
          <button className="icon-btn" onClick={() => setDrawerOpen(false)}>✕</button>
        </div>

        {/* Upload area */}
        <div style={s.drawerUpload}>
          <input ref={fileInputRef} type="file" accept="application/pdf"
            style={{ display: "none" }} suppressHydrationWarning onChange={handleFileChange} />
          <button className="upload-btn" onClick={() => fileInputRef.current?.click()}>
            <Icon.Plus /> Upload PDF
          </button>
        </div>

        <p style={s.drawerLabel}>
          {compareMode ? "📊 Pick document to compare" : "Your PDFs"}
        </p>

        <nav style={s.drawerNav}>
          {docs.length === 0 && (
            <div style={s.drawerEmpty}>
              <span style={{ fontSize: 28 }}>📂</span>
              <span style={{ fontSize: 13, color: "#57606a", marginTop: 6 }}>No PDFs yet</span>
            </div>
          )}
          {docs.map((doc) => {
            const active = selectedDoc?.id === doc.id;
            const isCompareTarget = compareDoc?.id === doc.id;
            const isCompareSource = compareMode && active;
            return (
              <div key={doc.id}
                className={`nav-item ${active && !compareMode ? "nav-item-active" : ""}`}
                style={isCompareTarget ? { background: "#dcfce7", borderColor: "#86efac" } : isCompareSource ? { background: "#dbeafe", borderColor: "#93c5fd" } : undefined}
                onClick={() => selectDoc(doc)}>
                <span style={s.navIcon}><Icon.PDF /></span>
                <span style={s.navText} title={doc.name}>{doc.name}</span>
                {!compareMode && (
                  <button className="trash-btn" onClick={(e) => handleDelete(e, doc)} title="Delete">
                    <Icon.Trash />
                  </button>
                )}
              </div>
            );
          })}
        </nav>

        {/* Plan + Usage + Sign out */}
        <div style={s.drawerFooter}>
          {usage && (
            <>
              {/* Plan badge row */}
              <div style={s.planRow}>
                <span style={{ ...s.planBadge, ...(usage.plan === "pro" ? s.planBadgePro : s.planBadgeFree) }}>
                  {usage.plan === "pro" ? "⚡ Pro" : "Free"}
                </span>
                {usage.plan === "pro" ? (
                  <button className="manage-btn" onClick={handlePortal}>Manage</button>
                ) : (
                  <button className="upgrade-btn" onClick={handleUpgrade}>Upgrade ↗</button>
                )}
              </div>

              {/* Usage bars — only for free */}
              {usage.plan !== "pro" && (
                <div style={s.usageBox}>
                  <div style={s.usageRow}>
                    <span style={s.usageLabel}>📄 PDFs</span>
                    <span style={s.usageVal}>{usage.pdfs.used}/{usage.pdfs.max}</span>
                  </div>
                  <div style={s.usageBar}>
                    <div style={{ ...s.usageFill, width: `${Math.min(100, (usage.pdfs.used / usage.pdfs.max) * 100)}%` }} />
                  </div>
                  <div style={{ ...s.usageRow, marginTop: 8 }}>
                    <span style={s.usageLabel}>💬 Questions today</span>
                    <span style={s.usageVal}>{usage.questions.used}/{usage.questions.max}</span>
                  </div>
                  <div style={s.usageBar}>
                    <div style={{ ...s.usageFill, width: `${Math.min(100, (usage.questions.used / usage.questions.max) * 100)}%`, background: usage.questions.remaining === 0 ? "#dc2626" : "#2563eb" }} />
                  </div>
                  {usage.questions.remaining === 0 && (
                    <p style={s.upgradeHint}>Daily limit reached — upgrade for more</p>
                  )}
                </div>
              )}

              {/* Pro unlimited message */}
              {usage.plan === "pro" && (
                <div style={s.proUnlimited}>✨ Unlimited PDFs & questions</div>
              )}
            </>
          )}
          {usage?.email && (
            <div style={s.userRow}>
              <span style={s.userEmail} title={usage.email}>{usage.email}</span>
              <button className="sign-out-btn" onClick={handleSignOut}>Sign out</button>
            </div>
          )}
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div style={s.main}>

        {/* TOP BAR */}
        <header style={s.topBar}>
          <button className="icon-btn" onClick={() => setDrawerOpen(true)} title="Open sidebar">
            <Icon.Menu />
          </button>
          <div style={s.topCenter}>
            {selectedDoc
              ? <span style={s.topDocName} title={selectedDoc.name}>📄 {selectedDoc.name}</span>
              : <span style={s.topTitle}>AI PDF Chat</span>}
          </div>
          <div style={s.topActions}>
            {selectedDoc?.file_url && !isMobile && (
              <>
                <button className="icon-btn" onClick={() => setPreviewOpen(v => !v)}
                  title={previewOpen ? "Hide preview" : "Show preview"}
                  style={{ color: previewOpen ? "#fff" : undefined }}>
                  <Icon.Eye on={previewOpen} />
                </button>
                <button className="icon-btn" onClick={handleCopyLink} title="Copy link"><Icon.Copy /></button>
                <button className="icon-btn" onClick={() => window.open(selectedDoc.file_url, "_blank")} title="Open in new tab"><Icon.External /></button>
                <button className="icon-btn" onClick={handleDownload} title="Download"><Icon.Download /></button>
              </>
            )}
            {selectedDoc && docs.length > 1 && !isMobile && (
              <button
                className="icon-btn"
                title={compareMode ? "Exit compare mode" : "Compare with another document"}
                onClick={() => { setCompareMode(v => !v); setCompareDoc(null); if (!compareMode) setDrawerOpen(true); }}
                style={{ background: compareMode ? "#dbeafe" : undefined, borderColor: compareMode ? "#93c5fd" : undefined }}
              >
                <Icon.Compare />
              </button>
            )}
            <button
              className="icon-btn"
              title={voiceMode ? "Voice mode on — click to turn off" : "Enable voice mode (auto-speak)"}
              onClick={() => { setVoiceMode(v => !v); window.speechSynthesis?.cancel(); }}
              style={{ background: voiceMode ? "#dcfce7" : undefined, borderColor: voiceMode ? "#86efac" : undefined }}
            >
              <Icon.Speaker />
            </button>

            {/* BELL — alerts */}
            <div style={{ position: "relative" }}>
              <button
                className="icon-btn"
                title="Alerts"
                onClick={() => {
                  setAlertsOpen(v => !v);
                  if (!alertsOpen && alerts.some(a => !a.read)) markAlertsRead();
                }}
                style={{ background: alertsOpen ? "#fef9c3" : undefined, borderColor: alertsOpen ? "#fde047" : undefined }}
              >
                <Icon.Bell />
                {alerts.some(a => !a.read) && (
                  <span style={{
                    position: "absolute", top: 4, right: 4,
                    width: 8, height: 8, borderRadius: "50%",
                    background: "#dc2626", border: "2px solid #fff",
                  }} />
                )}
              </button>

              {/* ALERTS DROPDOWN */}
              {alertsOpen && (
                <div style={s.alertsDropdown}>
                  <div style={s.alertsHeader}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: "#24292f" }}>🔔 Alerts</span>
                    <button onClick={() => setAlertsOpen(false)}
                      style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: 16 }}>✕</button>
                  </div>
                  {alerts.length === 0 ? (
                    <div style={{ padding: "16px 14px", fontSize: 13, color: "#9ca3af", textAlign: "center" }}>
                      No alerts yet. AI analysis runs every 6 hours.
                    </div>
                  ) : (
                    <div style={{ overflowY: "auto", maxHeight: 320 }}>
                      {alerts.map((alert) => (
                        <div key={alert.id} style={{
                          padding: "10px 14px",
                          borderBottom: "1px solid #f3f4f6",
                          background: alert.read ? "transparent" : "#fffbeb",
                          display: "flex", gap: 10, alignItems: "flex-start",
                        }}>
                          <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>
                            {alert.type === "warning" ? "⚠️" : alert.type === "success" ? "✅" : "ℹ️"}
                          </span>
                          <div>
                            <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{alert.message}</p>
                            <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>
                              {new Date(alert.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* PDF HEADER BAR (mobile actions) */}
        {selectedDoc && isMobile && (
          <div style={s.pdfHeaderBar}>
            <span style={s.pdfHeaderName}>📄 {selectedDoc.name}</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="icon-btn-sm" onClick={handleCopyLink} title="Copy link"><Icon.Copy /></button>
              <button className="icon-btn-sm" onClick={() => window.open(selectedDoc.file_url, "_blank")} title="Open"><Icon.External /></button>
              <button className="icon-btn-sm" onClick={handleDownload} title="Download"><Icon.Download /></button>
            </div>
          </div>
        )}

        {/* BODY */}
        <div style={s.body}>

          {/* CHAT AREA */}
          <div style={s.chatScroll}>
            <div style={s.chatInner}>

              {/* AGENT PANEL — cross-document analysis */}
              {!agentDismissed && docs.length >= 2 && (agentJob || agentLoading) && (
                <AgentPanel
                  job={agentJob}
                  loading={agentLoading}
                  onQuestionClick={(q) => injectPrompt(q)}
                  onDismiss={() => setAgentDismissed(true)}
                  onRerun={runAgent}
                />
              )}

              {/* COMPARE MODE PANEL */}
              {compareMode && selectedDoc && (
                <div style={s.comparePanel}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#1d4ed8" }}>
                      <Icon.Compare /> &nbsp;Compare with another document
                    </span>
                    <button onClick={() => { setCompareMode(false); setCompareDoc(null); }}
                      style={{ background: "none", border: "none", color: "#93c5fd", cursor: "pointer", fontSize: 16 }}>✕</button>
                  </div>
                  <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 10 }}>
                    Click a document in the sidebar, or pick one below:
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                    {docs.filter(d => d.id !== selectedDoc.id).map((d) => (
                      <button key={d.id} onClick={() => setCompareDoc(d)}
                        style={{
                          background: compareDoc?.id === d.id ? "#dbeafe" : "#f8faff",
                          border: `1px solid ${compareDoc?.id === d.id ? "#93c5fd" : "#e5e7eb"}`,
                          borderRadius: 20, padding: "5px 12px",
                          fontSize: 12, color: compareDoc?.id === d.id ? "#1d4ed8" : "#374151",
                          cursor: "pointer", fontFamily: "inherit",
                          maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                        {d.name}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={compareQuestion}
                    onChange={(e) => setCompareQuestion(e.target.value)}
                    placeholder="Custom question (optional) — e.g. 'which has better pricing?'"
                    style={{
                      width: "100%", padding: "8px 12px",
                      border: "1px solid #d0d7de", borderRadius: 8,
                      fontSize: 13, color: "#24292f", outline: "none",
                      marginBottom: 10, fontFamily: "inherit", background: "#fff",
                    }}
                  />
                  <button
                    onClick={() => handleCompare(compareDoc)}
                    disabled={!compareDoc || compareLoading}
                    style={{
                      background: compareDoc ? "linear-gradient(135deg,#2563eb,#1d4ed8)" : "#e5e7eb",
                      color: compareDoc ? "#fff" : "#9ca3af",
                      border: "none", borderRadius: 8, padding: "9px 20px",
                      fontSize: 13, fontWeight: 600, cursor: compareDoc ? "pointer" : "not-allowed",
                      fontFamily: "inherit",
                    }}
                  >
                    {compareLoading ? "Comparing…" : compareDoc ? `Compare with "${compareDoc.name}"` : "Select a document above"}
                  </button>
                </div>
              )}

              {/* AI INSIGHTS PANEL */}
              {selectedDoc && (insights || insightsLoading) && (
                <InsightsPanel
                  insights={insights}
                  loading={insightsLoading}
                  onQuestionClick={(q) => { injectPrompt(q); }}
                  onDismiss={() => setInsights(null)}
                />
              )}

              {/* Empty state */}
              {messages.length === 0 && !loading && !isTyping && !(insights || insightsLoading) && (
                <div style={s.emptyState}>
                  <div style={s.emptyGlow} />
                  <h2 style={s.emptyTitle}>
                    {selectedDoc ? "Ask anything about this PDF" : "What can I help with?"}
                  </h2>
                  {selectedDoc && (
                    <p style={s.emptySubtitle}>{selectedDoc.name}</p>
                  )}
                  <div style={s.hintGrid}>
                    {hints.map((h, i) => (
                      <button key={i} className="hint-card"
                        onClick={() => selectedDoc ? setInput(h.text) : fileInputRef.current?.click()}>
                        <span style={s.hintIcon}>{h.icon}</span>
                        <span style={s.hintText}>{h.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              {messages.map((msg, i) => (
                <div key={i} className="msg-row"
                  style={{ justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                  {msg.role === "ai" && <div style={s.aiAvatar}>⚡</div>}
                  {msg.extraction ? (
                    <ExtractionCard data={msg.extraction} onCopy={() => {
                      navigator.clipboard.writeText(JSON.stringify(msg.extraction, null, 2));
                      setCopiedIdx(i);
                      setTimeout(() => setCopiedIdx(null), 2000);
                    }} copied={copiedIdx === i} />
                  ) : (
                    <div style={msg.role === "user" ? s.userBubble : s.aiBubble}>
                      <p style={{ ...s.msgText, color: msg.role === "user" ? "#fff" : "#24292f" }}>{msg.text}</p>
                      {msg.role === "ai" && (
                        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                          <button className="copy-btn" onClick={() => handleCopy(msg.text, i)}>
                            {copiedIdx === i ? (
                              <span style={{ color: "#4ade80" }}>✓ Copied</span>
                            ) : (
                              <><Icon.Copy /> Copy</>
                            )}
                          </button>
                          <button className="copy-btn" onClick={() => speak(msg.text)} title="Read aloud">
                            <Icon.Speaker /> Listen
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Follow-up suggestions */}
              {suggestions.length > 0 && !loading && !isTyping && (
                <div style={s.suggestionsRow}>
                  <span style={s.suggestionsLabel}>Follow-up</span>
                  {suggestions.map((s_item, i) => (
                    <button key={i} style={s.suggestionChip}
                      onClick={() => { injectPrompt(s_item); setSuggestions([]); }}>
                      {s_item}
                    </button>
                  ))}
                </div>
              )}

              {/* Thinking dots */}
              {loading && (
                <div className="msg-row" style={{ justifyContent: "flex-start" }}>
                  <div style={s.aiAvatar}>⚡</div>
                  <div style={s.aiBubble}>
                    <div style={s.dots}>
                      {[0, 150, 300].map((d) => (
                        <span key={d} style={{ ...s.dot, animationDelay: `${d}ms` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Typing animation */}
              {isTyping && (
                <div className="msg-row" style={{ justifyContent: "flex-start" }}>
                  <div style={s.aiAvatar}>⚡</div>
                  <div style={s.aiBubble}>
                    <p style={s.msgText}>{typingText}<span style={s.cursor} /></p>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          </div>

          {/* PDF PREVIEW PANEL */}
          {previewOpen && selectedDoc?.file_url && !isMobile && (
            <div style={s.pdfPanel}>
              <div style={s.pdfPanelHead}>
                <span style={s.pdfPanelTitle}><Icon.PDF /> Preview</span>
                <button className="icon-btn-sm" onClick={() => setPreviewOpen(false)}>✕</button>
              </div>
              <div style={s.pdfWrap}>
                <iframe
                  src={selectedDoc.file_url + "#toolbar=0&navpanes=0&page=1&zoom=page-width"}
                  style={s.pdfIframe}
                  title="PDF Preview"
                />
              </div>
              <button className="open-pdf-btn" onClick={() => window.open(selectedDoc.file_url, "_blank")}>
                <Icon.External /> Open Full PDF
              </button>
            </div>
          )}
        </div>

        {/* SELECTED DOC CHIP */}
        {selectedDoc && (
          <div style={s.chipRow}>
            <div style={s.chip}>
              <Icon.PDF />
              <span style={s.chipName}>{selectedDoc.name}</span>
              <button style={s.chipX}
                onClick={() => { setSelectedDoc(null); setMessages([]); setPreviewOpen(false); }}>✕</button>
            </div>
          </div>
        )}

        {/* QUICK ACTIONS */}
        {selectedDoc && (
          <div style={s.quickActions}>
            {[
              { label: "Summarize", prompt: "Summarize this document" },
              { label: "Key Points", prompt: "What are the key points of this document?" },
              { label: "Extract Data", prompt: "Extract all important data and details from this document" },
              { label: "Explain", prompt: "Explain the main topic of this document in simple terms" },
              { label: "Questions", prompt: "What are 5 important questions I can ask about this document?" },
            ].map(({ label, prompt }) => (
              <button key={label} className="quick-action-btn" onClick={() => injectPrompt(prompt)}>
                {label}
              </button>
            ))}
            {docs.length > 1 && (
              <button
                className="quick-action-btn"
                style={compareMode ? { borderColor: "#c4b5fd", background: "rgba(238,242,255,0.9)", color: "#4f46e5" } : undefined}
                onClick={() => { setCompareMode(v => !v); setCompareDoc(null); if (!compareMode) window.scrollTo(0,0); }}
              >
                ⚖ Compare Docs
              </button>
            )}
            {docs.length >= 2 && (
              <button
                className="quick-action-btn"
                style={{ borderColor: "#c4b5fd", color: "#4338ca" }}
                onClick={() => { setAgentDismissed(false); runAgent(); }}
                disabled={agentLoading}
              >
                {agentLoading ? "🤖 Analyzing…" : "🤖 AI Analysis"}
              </button>
            )}
          </div>
        )}

        {/* INPUT BAR */}
        <div style={s.inputBar}>
          <input ref={fileInputRef} type="file" accept="application/pdf"
            style={{ display: "none" }} suppressHydrationWarning onChange={handleFileChange} />

          <div style={s.inputBox} className="input-box">
            <button className="plus-btn" onClick={() => fileInputRef.current?.click()} title="Upload PDF">
              <Icon.Plus />
            </button>

            <button
              className={`plus-btn ${isRecording ? "mic-active" : ""}`}
              onClick={toggleRecording}
              disabled={!selectedDoc || transcribing}
              title={isRecording ? "Stop recording" : "Record voice question"}
              style={{ flexShrink: 0, color: isRecording ? "#dc2626" : undefined }}
            >
              {transcribing ? (
                <span style={{ fontSize: 10, fontWeight: 700, color: "#6b7280" }}>…</span>
              ) : isRecording ? (
                <Icon.MicOff />
              ) : (
                <Icon.Mic />
              )}
            </button>

            <textarea
              ref={textareaRef}
              suppressHydrationWarning autoComplete="off"
              value={input} rows={1}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isRecording ? "🔴 Listening… click mic to stop" :
                transcribing ? "Transcribing…" :
                selectedDoc ? "Ask anything about this PDF…" : "Upload a PDF to start chatting…"
              }
              disabled={!selectedDoc || loading || isTyping || isRecording}
              style={{ ...s.textarea, opacity: !selectedDoc ? 0.45 : 1 }}
            />

            <button className={`send-btn ${canSend ? "send-btn-active" : ""}`}
              onClick={handleAsk} disabled={!canSend} title="Send">
              <Icon.Send />
            </button>
          </div>

          <p style={s.inputHint}>Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   GLOBAL CSS  (premium light theme)
───────────────────────────────────────────── */
const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: linear-gradient(135deg, #f8faff 0%, #f0f4ff 50%, #fafafa 100%); }
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

  /* Snackbar */
  .snackbar {
    position: fixed; bottom: 90px; left: 50%;
    transform: translateX(-50%);
    padding: 12px 22px; border-radius: 12px;
    font-size: 13px; font-weight: 600; color: #fff;
    box-shadow: 0 8px 32px rgba(0,0,0,0.18);
    z-index: 9999; white-space: nowrap;
    animation: snackIn 0.25s ease;
    backdrop-filter: blur(8px);
  }
  .snackbar-success { background: linear-gradient(135deg,#16a34a,#15803d); }
  .snackbar-error   { background: linear-gradient(135deg,#dc2626,#b91c1c); }

  /* Icon buttons */
  .icon-btn {
    background: rgba(255,255,255,0.8);
    border: 1px solid #e2e8f0;
    color: #64748b; width: 34px; height: 34px;
    border-radius: 9px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.18s ease; flex-shrink: 0;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  }
  .icon-btn:hover {
    background: #fff; color: #1e293b;
    border-color: #c7d2fe; transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99,102,241,0.12);
  }
  .icon-btn-sm {
    background: transparent; border: none;
    color: #64748b; width: 28px; height: 28px;
    border-radius: 6px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s; flex-shrink: 0;
  }
  .icon-btn-sm:hover { background: #f1f5f9; color: #1e293b; }

  /* Upload button */
  .upload-btn {
    display: flex; align-items: center; gap: 8px;
    width: 100%; padding: 11px 16px;
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    border: none; border-radius: 12px; color: #fff;
    font-size: 14px; font-weight: 700; cursor: pointer;
    transition: all 0.2s; box-shadow: 0 4px 16px rgba(99,102,241,0.35);
    font-family: inherit; letter-spacing: -0.2px;
  }
  .upload-btn:hover {
    background: linear-gradient(135deg, #818cf8, #6366f1);
    box-shadow: 0 6px 24px rgba(99,102,241,0.5);
    transform: translateY(-1px);
  }
  .upload-btn:active { transform: translateY(0); }

  /* Nav items */
  .nav-item {
    display: flex; align-items: center; gap: 9px;
    padding: 9px 10px; border-radius: 10px; cursor: pointer;
    transition: all 0.18s; border: 1px solid transparent;
  }
  .nav-item:hover { background: rgba(255,255,255,0.8); border-color: #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
  .nav-item:hover .trash-btn { opacity: 1; }
  .nav-item-active {
    background: linear-gradient(135deg,rgba(238,242,255,0.9),rgba(237,233,254,0.7)) !important;
    border-color: #c4b5fd !important;
    box-shadow: 0 2px 12px rgba(99,102,241,0.12) !important;
  }

  .trash-btn {
    background: none; border: none; color: #cbd5e1;
    cursor: pointer; padding: 3px; border-radius: 4px;
    display: flex; opacity: 0;
    transition: opacity 0.15s, color 0.15s; flex-shrink: 0;
  }
  .trash-btn:hover { color: #ef4444; }

  /* Hint cards */
  .hint-card {
    display: flex; align-items: flex-start; gap: 10px;
    padding: 16px 15px;
    background: rgba(255,255,255,0.8);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(226,232,240,0.8);
    border-radius: 14px; color: #1e293b;
    font-size: 13px; cursor: pointer; text-align: left;
    transition: all 0.2s; font-family: inherit;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  }
  .hint-card:hover {
    background: rgba(255,255,255,0.95);
    border-color: #c4b5fd;
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(99,102,241,0.12);
  }

  /* Message rows */
  .msg-row {
    display: flex; align-items: flex-start; gap: 12px;
    animation: msgIn 0.3s cubic-bezier(0.4,0,0.2,1) both;
  }

  /* Copy button */
  .copy-btn {
    display: inline-flex; align-items: center; gap: 5px;
    margin-top: 8px; background: rgba(255,255,255,0.8);
    border: 1px solid #e2e8f0; color: #64748b;
    font-size: 11px; padding: 4px 11px;
    border-radius: 8px; cursor: pointer;
    transition: all 0.15s; font-family: inherit;
  }
  .copy-btn:hover { border-color: #c4b5fd; color: #4f46e5; background: rgba(238,242,255,0.6); }

  /* Open PDF btn */
  .open-pdf-btn {
    display: flex; align-items: center; justify-content: center; gap: 6px;
    width: 100%; padding: 11px;
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    border: none; border-radius: 12px; color: #fff;
    font-size: 13px; font-weight: 700; cursor: pointer;
    transition: all 0.2s; font-family: inherit;
    box-shadow: 0 4px 16px rgba(99,102,241,0.3);
  }
  .open-pdf-btn:hover {
    background: linear-gradient(135deg, #818cf8, #6366f1);
    box-shadow: 0 6px 24px rgba(99,102,241,0.45);
    transform: translateY(-1px);
  }

  /* Upgrade button */
  .upgrade-btn {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    border: none; color: #fff;
    font-size: 11px; font-weight: 700;
    padding: 5px 12px; border-radius: 8px;
    cursor: pointer; white-space: nowrap;
    transition: all 0.2s; font-family: inherit; flex-shrink: 0;
    box-shadow: 0 2px 10px rgba(217,119,6,0.35);
  }
  .upgrade-btn:hover { background: linear-gradient(135deg, #fbbf24, #f59e0b); transform: translateY(-1px); }
  .upgrade-btn:active { transform: translateY(0); }

  /* Manage button */
  .manage-btn {
    background: rgba(255,255,255,0.8); border: 1px solid #e2e8f0;
    color: #64748b; font-size: 11px; font-weight: 500;
    padding: 4px 10px; border-radius: 7px;
    cursor: pointer; white-space: nowrap;
    transition: all 0.15s; font-family: inherit; flex-shrink: 0;
  }
  .manage-btn:hover { background: #fff; border-color: #c4b5fd; color: #4f46e5; }

  /* Sign out button */
  .sign-out-btn {
    background: rgba(255,255,255,0.8); border: 1px solid #e2e8f0;
    color: #64748b; font-size: 11px; font-weight: 500;
    padding: 4px 10px; border-radius: 7px;
    cursor: pointer; white-space: nowrap;
    transition: all 0.15s; font-family: inherit; flex-shrink: 0;
  }
  .sign-out-btn:hover { background: #fef2f2; border-color: #fca5a5; color: #dc2626; }

  /* Input focus ring */
  .input-box:focus-within {
    border-color: #6366f1 !important;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.15), 0 4px 24px rgba(99,102,241,0.1) !important;
  }

  /* Plus button */
  .plus-btn {
    width: 36px; height: 36px; flex-shrink: 0;
    background: rgba(248,250,252,0.9); border: 1px solid #e2e8f0;
    border-radius: 10px; color: #475569;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: all 0.18s;
  }
  .plus-btn:hover { background: #fff; border-color: #c4b5fd; color: #4f46e5; transform: scale(1.05); box-shadow: 0 2px 8px rgba(99,102,241,0.15); }
  .plus-btn:active { transform: scale(0.95); }

  /* Agent panel tabs */
  .agent-tab {
    padding: 6px 14px; border-radius: 10px; border: none;
    font-size: 12px; font-weight: 600; cursor: pointer;
    font-family: inherit; color: #64748b; background: transparent;
    transition: all 0.18s;
  }
  .agent-tab:hover { color: #4f46e5; background: rgba(255,255,255,0.6); }
  .agent-tab-active {
    background: linear-gradient(135deg, #6366f1, #4f46e5) !important;
    color: #fff !important;
    box-shadow: 0 2px 12px rgba(99,102,241,0.35);
  }

  /* Agent refresh button */
  .agent-refresh-btn {
    background: rgba(238,242,255,0.8); border: 1px solid #c4b5fd;
    border-radius: 8px; padding: 5px 12px;
    font-size: 12px; color: #4f46e5; font-weight: 600;
    cursor: pointer; font-family: inherit;
    transition: all 0.18s;
  }
  .agent-refresh-btn:hover { background: #e0e7ff; box-shadow: 0 2px 8px rgba(99,102,241,0.2); transform: translateY(-1px); }

  /* Theme chips */
  .theme-chip {
    border-radius: 20px; padding: 4px 13px;
    font-size: 12px; font-weight: 600; cursor: default;
    transition: transform 0.15s; display: inline-block;
    border: 1px solid;
  }
  .theme-chip:hover { transform: translateY(-1px); }
  .theme-chip-0 { background: linear-gradient(135deg,#ede9fe,#ddd6fe); color: #5b21b6; border-color: #c4b5fd; }
  .theme-chip-1 { background: linear-gradient(135deg,#dbeafe,#bfdbfe); color: #1e40af; border-color: #93c5fd; }
  .theme-chip-2 { background: linear-gradient(135deg,#dcfce7,#bbf7d0); color: #14532d; border-color: #86efac; }
  .theme-chip-3 { background: linear-gradient(135deg,#fce7f3,#fbcfe8); color: #831843; border-color: #f9a8d4; }

  /* Doc summary item */
  .doc-summary-item {
    display: flex; align-items: flex-start; gap: 10px;
    padding: 10px 12px; border-radius: 12px;
    background: rgba(248,250,255,0.8);
    border: 1px solid rgba(226,232,240,0.7);
    transition: all 0.18s;
  }
  .doc-summary-item:hover { background: rgba(238,242,255,0.8); border-color: #c4b5fd; transform: translateX(2px); }

  /* Suggest question buttons */
  .suggest-q-btn {
    background: rgba(255,255,255,0.85);
    border: 1px solid #e2e8f0;
    border-radius: 20px; padding: 6px 14px;
    font-size: 12px; color: #4f46e5; font-weight: 500;
    cursor: pointer; font-family: inherit;
    transition: all 0.18s;
    box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  }
  .suggest-q-btn:hover {
    background: linear-gradient(135deg,#ede9fe,#e0e7ff);
    border-color: #c4b5fd; transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99,102,241,0.15);
  }

  /* Quick action buttons */
  .quick-action-btn {
    background: rgba(255,255,255,0.85);
    border: 1px solid #e2e8f0;
    border-radius: 20px; padding: 5px 14px;
    font-size: 12px; color: #475569; font-weight: 500;
    cursor: pointer; font-family: inherit;
    transition: all 0.18s; white-space: nowrap;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  }
  .quick-action-btn:hover {
    background: rgba(238,242,255,0.9);
    border-color: #c4b5fd; color: #4f46e5;
    transform: translateY(-1px);
    box-shadow: 0 3px 10px rgba(99,102,241,0.12);
  }

  /* Mic recording state */
  .mic-active {
    background: #fef2f2 !important;
    border-color: #fca5a5 !important;
    color: #dc2626 !important;
    animation: micPulse 1.2s ease-in-out infinite;
  }
  @keyframes micPulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.3); }
    50%      { box-shadow: 0 0 0 6px rgba(220,38,38,0); }
  }

  /* Send button */
  .send-btn {
    width: 38px; height: 38px; flex-shrink: 0;
    background: #f1f5f9; border: 1px solid #e2e8f0;
    border-radius: 12px; color: #cbd5e1;
    cursor: not-allowed; display: flex; align-items: center; justify-content: center;
    transition: all 0.18s;
  }
  .send-btn-active {
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    color: #fff; border-color: transparent;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(99,102,241,0.4);
  }
  .send-btn-active:hover {
    background: linear-gradient(135deg, #818cf8, #6366f1);
    box-shadow: 0 6px 20px rgba(99,102,241,0.5);
    transform: scale(1.06);
  }
  .send-btn-active:active { transform: scale(0.94); }

  /* Animations */
  @keyframes snackIn {
    from { opacity:0; transform: translateX(-50%) translateY(12px); }
    to   { opacity:1; transform: translateX(-50%) translateY(0); }
  }
  @keyframes msgIn {
    from { opacity:0; transform: translateY(10px); }
    to   { opacity:1; transform: translateY(0); }
  }
  @keyframes blink {
    0%,80%,100% { opacity:0.2; transform: scale(0.75); }
    40%         { opacity:1;   transform: scale(1); }
  }
  @keyframes cursorBlink {
    0%,100% { opacity:1; }
    50%     { opacity:0; }
  }
  @keyframes glowPulse {
    0%,100% { opacity:0.3; transform: translateX(-50%) scale(1); }
    50%     { opacity:0.6; transform: translateX(-50%) scale(1.08); }
  }
  @keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  @media (max-width: 768px) {
    .hint-card { padding: 12px; font-size: 12px; }
  }
`;

/* ─────────────────────────────────────────────
   STYLES OBJECT  (light / white theme)
───────────────────────────────────────────── */
const s = {
  root: {
    display: "flex", height: "100vh",
    background: "linear-gradient(135deg, #f8faff 0%, #f0f4ff 50%, #fafafa 100%)",
    color: "#1e293b",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif",
    overflow: "hidden", position: "relative",
  },

  /* ── Drawer ── */
  backdrop: { position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)", zIndex: 40 },
  drawer: {
    position: "fixed", top: 0, left: 0, bottom: 0,
    width: 276,
    background: "rgba(248,250,255,0.92)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    zIndex: 50, display: "flex", flexDirection: "column",
    transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
    borderRight: "1px solid rgba(226,232,240,0.8)",
    boxShadow: "12px 0 40px rgba(99,102,241,0.08), 4px 0 16px rgba(0,0,0,0.06)",
  },
  drawerHead: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "18px 16px 14px", borderBottom: "1px solid rgba(226,232,240,0.7)",
  },
  drawerBrand: { display: "flex", alignItems: "center", gap: 10 },
  brandDot: {
    width: 32, height: 32, borderRadius: 9,
    background: "linear-gradient(135deg,#6366f1,#4f46e5)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 16, boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
  },
  brandName: {
    fontSize: 16, fontWeight: 800, letterSpacing: "-0.4px",
    background: "linear-gradient(135deg,#4338ca,#6366f1)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
  },
  drawerUpload: { padding: "14px 12px 6px" },
  drawerLabel: {
    padding: "14px 16px 6px", fontSize: 10, fontWeight: 700,
    color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em",
  },
  drawerNav: {
    flex: 1, overflowY: "auto", padding: "4px 8px 16px",
    display: "flex", flexDirection: "column", gap: 2,
  },
  drawerEmpty: {
    display: "flex", flexDirection: "column", alignItems: "center",
    padding: "32px 0", gap: 8,
  },
  navIcon: { color: "#57606a", display: "flex", flexShrink: 0 },
  navText: {
    flex: 1, fontSize: 13, color: "#24292f",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },

  /* ── Drawer footer ── */
  drawerFooter: {
    borderTop: "1px solid rgba(226,232,240,0.7)",
    padding: "12px 12px 14px",
    display: "flex", flexDirection: "column", gap: 10,
  },
  usageBox: {
    background: "rgba(255,255,255,0.7)", border: "1px solid #e2e8f0",
    borderRadius: 12, padding: "10px 12px",
  },
  usageRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  usageLabel: { fontSize: 11, color: "#64748b", fontWeight: 500 },
  usageVal: { fontSize: 11, fontWeight: 700, color: "#1e293b" },
  usageBar: {
    marginTop: 5, height: 5, background: "#e2e8f0",
    borderRadius: 6, overflow: "hidden",
  },
  usageFill: { height: "100%", background: "linear-gradient(90deg,#6366f1,#4f46e5)", borderRadius: 6, transition: "width 0.4s ease" },
  upgradeHint: {
    marginTop: 6, fontSize: 11, color: "#dc2626", fontWeight: 500, textAlign: "center",
  },
  planRow: {
    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6,
  },
  planBadge: {
    fontSize: 12, fontWeight: 700, padding: "4px 12px",
    borderRadius: 20, border: "1px solid",
  },
  planBadgeFree: { background: "rgba(248,250,252,0.9)", borderColor: "#e2e8f0", color: "#64748b" },
  planBadgePro: { background: "linear-gradient(135deg,#fef9c3,#fef08a)", borderColor: "#fde047", color: "#713f12" },
  proUnlimited: {
    fontSize: 12, color: "#16a34a", fontWeight: 600,
    textAlign: "center", padding: "6px 0",
  },
  userRow: {
    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6,
  },
  userEmail: {
    fontSize: 11, color: "#64748b",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1,
  },

  /* ── Main ── */
  main: {
    flex: 1, display: "flex", flexDirection: "column",
    overflow: "hidden", background: "transparent",
  },

  /* ── Top bar ── */
  topBar: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "10px 16px",
    borderBottom: "1px solid rgba(226,232,240,0.7)",
    background: "rgba(255,255,255,0.85)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    flexShrink: 0, minHeight: 56,
    boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
  },
  topCenter: { flex: 1, overflow: "hidden", padding: "0 6px", textAlign: "center" },
  topTitle: {
    fontSize: 15, fontWeight: 800, letterSpacing: "-0.3px",
    background: "linear-gradient(135deg,#4338ca,#6366f1)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
  },
  topDocName: {
    fontSize: 13, color: "#64748b",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block",
  },
  topActions: { display: "flex", gap: 6, alignItems: "center" },

  /* ── PDF header bar (mobile) ── */
  pdfHeaderBar: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "8px 14px", borderBottom: "1px solid rgba(226,232,240,0.7)",
    background: "rgba(248,250,255,0.9)", flexShrink: 0,
  },
  pdfHeaderName: {
    fontSize: 12, color: "#64748b",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1,
  },

  /* ── Body ── */
  body: { flex: 1, display: "flex", overflow: "hidden" },

  /* ── Chat ── */
  chatScroll: { flex: 1, overflowY: "auto", padding: "0 20px" },
  chatInner: {
    maxWidth: 740, margin: "0 auto",
    display: "flex", flexDirection: "column", gap: 24,
    paddingTop: 40, paddingBottom: 20,
  },

  /* ── Empty state ── */
  emptyState: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", paddingTop: 80, gap: 28,
    textAlign: "center", position: "relative",
  },
  emptyGlow: {
    position: "absolute", top: 60, left: "50%",
    width: 480, height: 320,
    background: "radial-gradient(ellipse, rgba(99,102,241,0.1) 0%, transparent 70%)",
    borderRadius: "50%", pointerEvents: "none",
    animation: "glowPulse 5s ease-in-out infinite",
  },
  emptyTitle: {
    fontSize: 30, fontWeight: 800, color: "#1e293b", letterSpacing: "-0.5px",
    lineHeight: 1.3, zIndex: 1, letterSpacing: "-0.5px",
  },
  emptySubtitle: {
    fontSize: 14, color: "#57606a", maxWidth: 320,
    lineHeight: 1.6, zIndex: 1,
  },
  hintGrid: {
    display: "grid", gridTemplateColumns: "1fr 1fr",
    gap: 10, width: "100%", maxWidth: 460, zIndex: 1,
  },
  hintIcon: { fontSize: 18, flexShrink: 0, lineHeight: 1 },
  hintText: { lineHeight: 1.35, color: "#24292f" },

  /* ── Messages ── */
  aiAvatar: {
    width: 34, height: 34, borderRadius: 10,
    background: "linear-gradient(135deg, #6366f1, #4f46e5)",
    border: "none",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 16, flexShrink: 0, marginTop: 2,
    boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
  },
  userBubble: {
    maxWidth: "74%", padding: "13px 18px",
    background: "linear-gradient(135deg, #6366f1, #4f46e5)",
    borderRadius: "18px 18px 4px 18px",
    boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
  },
  aiBubble: { maxWidth: "84%", padding: "2px 0 4px" },
  msgText: {
    fontSize: 15, lineHeight: 1.8, color: "#1e293b",
    whiteSpace: "pre-wrap", wordBreak: "break-word",
  },
  dots: { display: "flex", gap: 6, padding: "10px 2px", alignItems: "center" },
  dot: {
    width: 7, height: 7, borderRadius: "50%",
    background: "#94a3b8", display: "inline-block",
    animation: "blink 1.2s infinite ease-in-out",
  },
  cursor: {
    display: "inline-block", width: 2, height: 16,
    background: "#6366f1", marginLeft: 2, verticalAlign: "text-bottom",
    animation: "cursorBlink 0.7s infinite",
  },

  /* ── PDF Panel ── */
  pdfPanel: {
    width: 306, minWidth: 306,
    borderLeft: "1px solid rgba(226,232,240,0.7)",
    display: "flex", flexDirection: "column",
    background: "rgba(248,250,255,0.7)",
    backdropFilter: "blur(12px)",
    padding: 12, gap: 10, flexShrink: 0,
  },
  pdfPanelHead: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "4px 2px 8px", borderBottom: "1px solid rgba(226,232,240,0.7)",
    marginBottom: 2,
  },
  pdfPanelTitle: {
    display: "flex", alignItems: "center", gap: 7,
    fontSize: 11, fontWeight: 700,
    color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em",
  },
  pdfWrap: {
    flex: 1, minHeight: 0, borderRadius: 12, overflow: "hidden",
    border: "1px solid rgba(226,232,240,0.7)", background: "#fff",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  },
  pdfIframe: { width: "100%", height: "100%", border: "none" },

  /* ── Chip ── */
  chipRow: { padding: "0 20px 8px", maxWidth: 740, margin: "0 auto", width: "100%" },
  chip: {
    display: "inline-flex", alignItems: "center", gap: 7,
    padding: "6px 14px 6px 10px",
    background: "linear-gradient(135deg,rgba(238,242,255,0.9),rgba(237,233,254,0.7))",
    border: "1px solid #c4b5fd",
    borderRadius: 20, fontSize: 12, color: "#4f46e5", fontWeight: 600,
    boxShadow: "0 2px 8px rgba(99,102,241,0.1)",
  },
  chipName: { maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  chipX: {
    background: "none", border: "none", color: "#94a3b8",
    cursor: "pointer", fontSize: 13, padding: "0 2px", lineHeight: 1,
  },

  /* ── Alerts dropdown ── */
  alertsDropdown: {
    position: "absolute", top: "calc(100% + 8px)", right: 0,
    width: 328,
    background: "rgba(255,255,255,0.95)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(226,232,240,0.8)", borderRadius: 16,
    boxShadow: "0 16px 48px rgba(0,0,0,0.14), 0 4px 16px rgba(99,102,241,0.08)",
    zIndex: 200, overflow: "hidden",
  },
  alertsHeader: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "14px 16px", borderBottom: "1px solid #f1f5f9",
  },

  /* ── Compare panel ── */
  comparePanel: {
    background: "rgba(255,255,255,0.75)",
    backdropFilter: "blur(16px)",
    border: "1px solid rgba(191,219,254,0.7)",
    borderRadius: 20, padding: "18px 20px", width: "100%",
    boxShadow: "0 8px 32px rgba(37,99,235,0.06)",
  },

  /* ── Suggestions ── */
  suggestionsRow: {
    display: "flex", flexWrap: "wrap", gap: 7, alignItems: "center",
    padding: "4px 0 0",
  },
  suggestionsLabel: {
    fontSize: 11, fontWeight: 700, color: "#94a3b8",
    textTransform: "uppercase", letterSpacing: "0.08em",
    flexBasis: "100%", marginBottom: 2,
  },
  suggestionChip: {
    background: "rgba(255,255,255,0.85)", border: "1px solid #e2e8f0",
    borderRadius: 20, padding: "5px 14px",
    fontSize: 12, color: "#4f46e5", cursor: "pointer",
    transition: "all 0.15s", fontFamily: "inherit",
    whiteSpace: "nowrap", fontWeight: 500,
  },

  /* ── Quick actions ── */
  quickActions: {
    display: "flex", gap: 6, padding: "0 20px 10px",
    maxWidth: 740, margin: "0 auto", width: "100%",
    flexWrap: "wrap",
  },
  quickBtn: {
    background: "rgba(255,255,255,0.85)", border: "1px solid #e2e8f0",
    borderRadius: 20, padding: "5px 14px",
    fontSize: 12, color: "#475569", cursor: "pointer",
    whiteSpace: "nowrap", transition: "all 0.18s", fontWeight: 500,
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },

  /* ── Input bar ── */
  inputBar: { padding: "8px 20px 22px", flexShrink: 0 },
  inputBox: {
    display: "flex", alignItems: "flex-end", gap: 8,
    background: "rgba(255,255,255,0.92)",
    backdropFilter: "blur(12px)",
    border: "1.5px solid rgba(226,232,240,0.9)",
    borderRadius: 18, padding: "9px 9px 9px 10px",
    maxWidth: 740, margin: "0 auto",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxShadow: "0 4px 24px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)",
  },
  textarea: {
    flex: 1, background: "transparent", border: "none", outline: "none",
    color: "#1e293b", fontSize: 15, lineHeight: 1.55,
    resize: "none", fontFamily: "inherit",
    maxHeight: 140, overflowY: "auto", padding: "5px 0",
  },
  inputHint: {
    textAlign: "center", fontSize: 11, color: "#cbd5e1",
    maxWidth: 740, margin: "6px auto 0",
  },
};
