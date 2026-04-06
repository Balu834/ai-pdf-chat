"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase-browser";

/* ─────────────────────────────────────────────
   ICONS
───────────────────────────────────────────── */
const Icons = {
  PDF:      () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline strokeLinecap="round" strokeLinejoin="round" points="14 2 14 8 20 8"/></svg>,
  Plus:     () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Trash:    () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>,
  Send:     () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Copy:     () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>,
  Eye:      ({on}) => <svg className="w-4 h-4" fill="none" stroke={on?"#fff":"currentColor"} viewBox="0 0 24 24" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  External: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  Download: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Mic:      () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8"><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M19 10a7 7 0 01-14 0"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg>,
  MicOff:   () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6"/><path d="M17 16.95A7 7 0 015 10v-1m14 0v1a7 7 0 01-.11 1.23"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg>,
  Speaker:  () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>,
  Compare:  () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8"><rect x="2" y="3" width="8" height="18" rx="1"/><rect x="14" y="3" width="8" height="18" rx="1"/><line x1="10" y1="12" x2="14" y2="12"/></svg>,
  Bell:     () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  Menu:     () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  Close:    () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Sparkle:  () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>,
};

/* ─────────────────────────────────────────────
   HINT DATA
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
   EXTRACTION CARD
───────────────────────────────────────────── */
function ExtractionCard({ data, onCopy, copied }) {
  const fields = data?.extracted_fields || data || {};
  const docType = data?.document_type || "document";

  function renderValue(val) {
    if (val === null || val === undefined || val === "") return <span className="text-gray-400">—</span>;
    if (Array.isArray(val)) {
      if (val.length === 0) return <span className="text-gray-400">—</span>;
      if (typeof val[0] === "object") {
        return (
          <div className="mt-1.5 flex flex-col gap-1">
            {val.map((item, i) => (
              <div key={i} className="bg-gray-50 rounded-lg px-3 py-2 text-xs">
                {Object.entries(item).map(([k, v]) => (
                  <div key={k}><span className="text-gray-500 font-semibold">{k}:</span> {String(v ?? "—")}</div>
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
    <div className="max-w-lg w-full bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-bold text-gray-900 capitalize">📊 {docType.replace(/_/g, " ")} extraction</span>
        <button onClick={onCopy} className={`text-xs px-3 py-1 rounded-lg border transition-colors ${copied ? "border-emerald-300 text-emerald-600 bg-emerald-50" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
          {copied ? "✓ Copied" : "Copy JSON"}
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {Object.entries(fields).map(([key, val]) => (
          <div key={key} className="grid gap-2 text-sm" style={{ gridTemplateColumns: "140px 1fr" }}>
            <span className="text-gray-500 font-semibold capitalize truncate">{key.replace(/_/g, " ")}</span>
            <span className="text-gray-900 break-words">{renderValue(val)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   AGENT PANEL
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

  const themeColors = [
    "bg-violet-100 text-violet-700 border-violet-200",
    "bg-blue-100 text-blue-700 border-blue-200",
    "bg-emerald-100 text-emerald-700 border-emerald-200",
    "bg-pink-100 text-pink-700 border-pink-200",
  ];

  return (
    <div className="w-full bg-white/80 backdrop-blur-sm border border-indigo-100 rounded-2xl p-5 shadow-md shadow-indigo-500/5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-lg shadow-lg shadow-indigo-500/30 shrink-0">🤖</div>
          <div>
            <p className="text-sm font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">AI Agent Analysis</p>
            {job?.doc_count > 0 && <p className="text-xs text-indigo-400">{job.doc_count} documents analyzed</p>}
          </div>
          {job?.status === "running" && (
            <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-2.5 py-1 rounded-full font-semibold">Processing…</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {job?.status === "done" && onRerun && (
            <button onClick={onRerun} className="text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg font-semibold transition-colors">↻ Refresh</button>
          )}
          {!loading && (
            <button onClick={onDismiss} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"><Icons.Close /></button>
          )}
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="flex flex-col gap-2.5">
          <p className="text-xs text-indigo-500 font-medium mb-1">🤖 Analyzing your documents…</p>
          {[90, 70, 80, 55].map((w, i) => (
            <div key={i} className="h-3 rounded-full bg-gradient-to-r from-indigo-100 via-indigo-200 to-indigo-100 animate-pulse" style={{ width: `${w}%` }} />
          ))}
        </div>
      )}

      {!loading && job?.status === "failed" && (
        <p className="text-sm text-red-500">⚠ {job.error || "Analysis failed. Try refreshing."}</p>
      )}

      {!loading && job?.status === "done" && (
        <>
          {/* Tabs */}
          <div className="flex gap-1.5 mb-4 bg-gray-50 p-1 rounded-xl w-fit">
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${tab === t.id ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/30" : "text-gray-500 hover:text-gray-700 hover:bg-white"}`}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === "overview" && (
            <div className="flex flex-col gap-4">
              {r.overview && <p className="text-sm text-gray-700 leading-relaxed">{r.overview}</p>}
              {r.themes?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Common Themes</p>
                  <div className="flex flex-wrap gap-2">
                    {r.themes.map((t, i) => (
                      <span key={i} className={`text-xs font-semibold px-3 py-1 rounded-full border ${themeColors[i % 4]}`}>{t}</span>
                    ))}
                  </div>
                </div>
              )}
              {r.document_summaries?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Documents</p>
                  <div className="flex flex-col gap-2">
                    {r.document_summaries.map((d, i) => (
                      <div key={i} className="flex gap-3 items-start bg-gray-50 hover:bg-indigo-50/50 border border-gray-100 hover:border-indigo-100 rounded-xl px-3 py-2.5 transition-colors">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">{i + 1}</div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-800 truncate">{d.name}</p>
                          <p className="text-xs text-gray-500 leading-relaxed">{d.one_liner}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "differences" && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Key Differences</p>
              {r.key_differences?.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {r.key_differences.map((d, i) => (
                    <li key={i} className="flex gap-3 items-start text-sm text-gray-700">
                      <span className="text-red-500 font-bold shrink-0 mt-0.5">≠</span>{d}
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-gray-400">No major differences found.</p>}
            </div>
          )}

          {tab === "actions" && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Action Items</p>
              {r.action_items?.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {r.action_items.map((a, i) => (
                    <li key={i} className="flex gap-3 items-start text-sm text-gray-700">
                      <span className="text-emerald-500 font-bold shrink-0 mt-0.5">→</span>{a}
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-gray-400">No action items found.</p>}
            </div>
          )}

          {tab === "questions" && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Suggested Questions</p>
              <div className="flex flex-wrap gap-2">
                {r.suggested_questions?.map((q, i) => (
                  <button key={i} onClick={() => onQuestionClick(q)}
                    className="text-xs text-indigo-600 font-medium bg-white hover:bg-indigo-50 border border-indigo-200 hover:border-indigo-300 px-3 py-2 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-sm">
                    {q}
                  </button>
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
   INSIGHTS PANEL
───────────────────────────────────────────── */
function InsightsPanel({ insights, loading, onQuestionClick, onDismiss }) {
  if (!loading && !insights) return null;
  return (
    <div className="w-full bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl p-5 shadow-md shadow-blue-500/5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-lg shadow-lg shadow-blue-500/25 shrink-0">✨</div>
          <p className="text-sm font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">AI Insights</p>
        </div>
        {!loading && (
          <button onClick={onDismiss} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"><Icons.Close /></button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col gap-2.5">
          {[80, 60, 90, 70].map((w, i) => (
            <div key={i} className="h-3 rounded-full bg-gradient-to-r from-blue-100 via-blue-200 to-blue-100 animate-pulse" style={{ width: `${w}%` }} />
          ))}
        </div>
      ) : (
        <>
          {insights.summary && <p className="text-sm text-gray-700 leading-relaxed mb-4">{insights.summary}</p>}
          {insights.key_points?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Key Points</p>
              <ul className="flex flex-col gap-2">
                {insights.key_points.map((pt, i) => (
                  <li key={i} className="flex gap-2 items-start text-sm text-gray-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-2" />{pt}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {insights.suggested_questions?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Ask about this document</p>
              <div className="flex flex-wrap gap-2">
                {insights.suggested_questions.map((q, i) => (
                  <button key={i} onClick={() => onQuestionClick(q)}
                    className="text-xs text-blue-600 font-medium bg-white hover:bg-blue-50 border border-blue-200 hover:border-blue-300 px-3 py-2 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-sm">
                    {q}
                  </button>
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
   MAIN DASHBOARD
───────────────────────────────────────────── */
export default function Dashboard() {
  const [docs, setDocs] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [typingText, setTypingText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [snackbar, setSnackbar] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [usage, setUsage] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [agentJob, setAgentJob] = useState(null);
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentDismissed, setAgentDismissed] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareDoc, setCompareDoc] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareQuestion, setCompareQuestion] = useState("");
  const [selectionBubble, setSelectionBubble] = useState(null);

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
      if (textareaRef.current?.contains(e.target)) return;
      setTimeout(() => {
        const sel = window.getSelection();
        const text = sel?.toString().trim();
        if (text && text.length > 10 && text.length < 500) {
          const range = sel.getRangeAt(0).getBoundingClientRect();
          setSelectionBubble({ x: range.left + range.width / 2, y: range.top - 12, text });
        } else setSelectionBubble(null);
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

  /* ── TTS ── */
  const speak = useCallback((text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.slice(0, 800));
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  }, []);

  /* ── Voice recording ── */
  const toggleRecording = useCallback(async () => {
    if (isRecording) { mediaRecorderRef.current?.stop(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
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
          if (data.text) { setInput(data.text); setTimeout(() => textareaRef.current?.focus(), 50); }
          else showSnackbar("Could not transcribe audio", "error");
        } catch { showSnackbar("Transcription failed", "error"); }
        finally { setTranscribing(false); }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch { showSnackbar("Microphone access denied", "error"); }
  }, [isRecording, showSnackbar]);

  /* ── Compare ── */
  const handleCompare = useCallback(async (secondDoc) => {
    if (!selectedDoc || !secondDoc) return;
    setCompareLoading(true);
    setCompareMode(false);
    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc1Id: selectedDoc.id, doc2Id: secondDoc.id, question: compareQuestion.trim() }),
      });
      const data = await res.json();
      if (data.error) showSnackbar(data.error, "error");
      else setMessages((prev) => [...prev, { role: "ai", text: `📊 **Comparing "${data.doc1.name}" vs "${data.doc2.name}"**\n\n${data.result}`, isCompare: true }]);
    } catch { showSnackbar("Comparison failed", "error"); }
    finally { setCompareLoading(false); setCompareQuestion(""); setCompareDoc(null); }
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

  /* ── Agent ── */
  const fetchAgentJob = useCallback(async () => {
    try {
      const res = await fetch("/api/agent/status");
      if (!res.ok) return;
      const data = await res.json();
      if (data) { setAgentJob(data); setAgentDismissed(false); }
    } catch {}
  }, []);

  const runAgent = useCallback(async () => {
    setAgentLoading(true);
    setAgentDismissed(false);
    try {
      const res = await fetch("/api/agent/run", { method: "POST" });
      const data = await res.json();
      if (data.jobId && !data.skipped) {
        let attempts = 0;
        const poll = setInterval(async () => {
          attempts++;
          const s = await fetch("/api/agent/status").then((r) => r.json()).catch(() => null);
          if (s?.status === "done" || s?.status === "failed" || attempts > 15) {
            clearInterval(poll); setAgentJob(s); setAgentLoading(false);
          }
        }, 2000);
      } else { await fetchAgentJob(); setAgentLoading(false); }
    } catch { setAgentLoading(false); }
  }, [fetchAgentJob]);

  /* ── Docs & Usage ── */
  const fetchDocs = useCallback(async () => {
    try {
      const res = await fetch("/api/docs");
      if (res.status === 401) { window.location.href = "/login"; return; }
      const data = await res.json();
      setDocs(Array.isArray(data) ? data : []);
    } catch { setDocs([]); }
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
    } catch { showSnackbar("Checkout failed. Please try again.", "error"); }
  }, [showSnackbar]);

  const handlePortal = useCallback(async () => {
    showSnackbar("Opening billing portal…");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (data.url) window.location.href = data.url;
      else showSnackbar(data.error || "Portal failed", "error");
    } catch { showSnackbar("Portal failed. Please try again.", "error"); }
  }, [showSnackbar]);

  useEffect(() => {
    fetchDocs(); fetchUsage(); fetchAgentJob(); fetchAlerts();
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgraded") === "1") {
      showSnackbar("Welcome to Pro! Limits removed.");
      window.history.replaceState({}, "", "/dashboard");
    }
  }, [fetchDocs, fetchUsage, fetchAgentJob, fetchAlerts, showSnackbar]);

  /* ── Load history + insights ── */
  useEffect(() => {
    if (!selectedDoc?.id) return;
    fetch(`/api/messages?documentId=${selectedDoc.id}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0)
          setMessages(data.map((m) => ({ role: m.role === "assistant" ? "ai" : "user", text: m.message })));
      }).catch(() => {});

    setInsightsLoading(true);
    fetch(`/api/insights?documentId=${selectedDoc.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setInsights(data || null))
      .catch(() => setInsights(null))
      .finally(() => setInsightsLoading(false));
  }, [selectedDoc?.id]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading, typingText]);

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
      await fetchDocs(); await fetchUsage();
      const newDoc = { id: data.id, name: file.name, file_url: data.url };
      setSelectedDoc(newDoc); setMessages([]); setSuggestions([]); setInsights(null);
      showSnackbar("PDF uploaded! Generating insights…");
      if (data.id) {
        setInsightsLoading(true);
        fetch("/api/insights", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ documentId: data.id, fileUrl: data.url }) })
          .then((r) => r.json()).then((d) => { if (d && !d.error) setInsights(d); }).catch(() => {}).finally(() => setInsightsLoading(false));
      }
      if (docs.length >= 2) runAgent();
    } else if (data.limitExceeded) {
      showSnackbar(`PDF limit reached (${data.error})`, "error");
    } else showSnackbar("Upload failed", "error");
    e.target.value = "";
  };

  /* ── Chat ── */
  const handleAsk = useCallback(async () => {
    if (!selectedDoc) return showSnackbar("Select a PDF first", "error");
    if (!input.trim() || loading || isTyping) return;

    const userText = input.trim();
    setSuggestions([]);
    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setInput(""); setLoading(true);

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
        } else setMessages((prev) => [...prev, { role: "ai", text: err.error || "❌ Something went wrong" }]);
        return;
      }
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const json = await res.json().catch(() => ({}));
        setLoading(false);
        if (json.type === "extraction") setMessages((prev) => [...prev, { role: "ai", text: null, extraction: json.data }]);
        else setMessages((prev) => [...prev, { role: "ai", text: JSON.stringify(json, null, 2) }]);
        fetchUsage(); return;
      }
      setLoading(false); setIsTyping(true); setTypingText("");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        setTypingText(fullText);
      }
      setIsTyping(false); setTypingText("");
      setMessages((prev) => [...prev, { role: "ai", text: fullText }]);
      fetchUsage();
      if (voiceMode) speak(fullText);

      const recentForSuggestions = [
        ...messages.slice(-3).map((m) => ({ role: m.role === "ai" ? "assistant" : "user", content: m.text || "" })),
        { role: "user", content: userText },
        { role: "assistant", content: fullText },
      ];
      fetch("/api/suggestions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recentMessages: recentForSuggestions }) })
        .then((r) => r.json()).then((d) => { if (d.suggestions?.length > 0) setSuggestions(d.suggestions); }).catch(() => {});
    } catch {
      setLoading(false); setIsTyping(false); setTypingText("");
      setMessages((prev) => [...prev, { role: "ai", text: "❌ Something went wrong" }]);
    } finally { textareaRef.current?.focus(); }
  }, [selectedDoc, input, loading, isTyping, messages, voiceMode, speak, showSnackbar, fetchUsage]);

  /* ── Delete ── */
  const handleDelete = async (e, doc) => {
    e.stopPropagation();
    const res = await fetch("/api/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: doc.id, fileUrl: doc.file_url }) });
    const data = await res.json();
    if (data.success) {
      fetchDocs();
      if (selectedDoc?.id === doc.id) { setSelectedDoc(null); setMessages([]); setPreviewOpen(false); }
      showSnackbar(`"${doc.name}" deleted`);
    } else showSnackbar("Delete failed", "error");
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleCopyLink = () => {
    if (!selectedDoc?.file_url) return;
    navigator.clipboard.writeText(selectedDoc.file_url);
    showSnackbar("Link copied!");
  };

  const handleDownload = () => {
    if (!selectedDoc?.file_url) return;
    const a = document.createElement("a");
    a.href = selectedDoc.file_url; a.download = selectedDoc.name; a.click();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAsk(); }
  };

  const selectDoc = (doc) => {
    if (compareMode && selectedDoc && doc.id !== selectedDoc.id) { setCompareDoc(doc); return; }
    setSelectedDoc(doc); setMessages([]); setSuggestions([]); setInsights(null);
    setInsightsLoading(false); setCompareMode(false); setCompareDoc(null);
    setPreviewOpen(false); setSidebarOpen(false);
  };

  const hints = selectedDoc ? HINTS_PDF : HINTS_DEFAULT;
  const canSend = !!(selectedDoc && !loading && !isTyping && input.trim());
  const unreadAlerts = alerts.some(a => !a.read);

  /* ─────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────── */
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans">
      <style>{`
        @keyframes fadeIn  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes blink   { 0%,80%,100%{opacity:.2;transform:scale(.75)} 40%{opacity:1;transform:scale(1)} }
        @keyframes cursorB { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes micPulse{ 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.3)} 50%{box-shadow:0 0 0 6px rgba(239,68,68,0)} }
        .msg-anim { animation: fadeIn .3s ease both; }
        .cursor-blink::after { content:''; display:inline-block; width:2px; height:15px; background:#6366f1; margin-left:2px; vertical-align:text-bottom; animation:cursorB .7s infinite; }
        .dot-1,.dot-2,.dot-3 { width:7px; height:7px; border-radius:50%; background:#94a3b8; display:inline-block; animation:blink 1.2s infinite ease-in-out; }
        .dot-2{animation-delay:.15s} .dot-3{animation-delay:.3s}
        .mic-pulse { animation: micPulse 1.2s ease-in-out infinite; }
        ::-webkit-scrollbar{width:5px;height:5px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:4px} ::-webkit-scrollbar-thumb:hover{background:#cbd5e1}
      `}</style>

      {/* ── SNACKBAR ── */}
      {snackbar && (
        <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-2xl text-sm font-semibold text-white shadow-xl whitespace-nowrap ${snackbar.type === "error" ? "bg-gradient-to-r from-red-500 to-rose-600" : "bg-gradient-to-r from-emerald-500 to-teal-600"}`}>
          {snackbar.type === "success" ? "✓ " : "✕ "}{snackbar.message}
        </div>
      )}

      {/* ── SELECTION BUBBLE ── */}
      {selectionBubble && selectedDoc && (
        <button onMouseDown={(e) => { e.preventDefault(); handleAskSelection(); }}
          className="fixed z-[9998] bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-xl whitespace-nowrap hover:bg-indigo-700 transition-colors"
          style={{ left: Math.min(selectionBubble.x, window.innerWidth - 130), top: Math.max(selectionBubble.y - 40, 8), transform: "translateX(-50%)" }}>
          ⚡ Ask AI
        </button>
      )}

      {/* ── SIDEBAR OVERLAY (mobile) ── */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ════════════════════════════════════════
          LEFT SIDEBAR
      ════════════════════════════════════════ */}
      <aside className={`
        fixed md:relative top-0 left-0 h-full z-40 md:z-auto
        w-64 flex flex-col bg-gray-900 border-r border-gray-800
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        {/* Brand */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </div>
            <span className="text-white font-bold text-base tracking-tight">PDF Chat</span>
          </div>
          <button className="md:hidden text-gray-400 hover:text-white transition-colors" onClick={() => setSidebarOpen(false)}><Icons.Close /></button>
        </div>

        {/* Upload btn */}
        <div className="px-3 py-3">
          <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" suppressHydrationWarning onChange={handleFileChange} />
          <button onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5">
            <Icons.Plus />
            Upload PDF
          </button>
        </div>

        {/* Compare mode hint */}
        {compareMode && (
          <div className="mx-3 mb-2 px-3 py-2 bg-blue-900/40 border border-blue-700/50 rounded-xl">
            <p className="text-xs text-blue-300 font-medium">📊 Pick a document to compare</p>
          </div>
        )}

        {/* PDF list label */}
        <p className="px-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">
          {docs.length > 0 ? `Your PDFs (${docs.length})` : "Your PDFs"}
        </p>

        {/* PDF list */}
        <nav className="flex-1 overflow-y-auto px-2 pb-3">
          {docs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-center px-4">
              <div className="w-12 h-12 rounded-2xl bg-gray-800 flex items-center justify-center text-2xl">📂</div>
              <p className="text-gray-500 text-xs leading-relaxed">Upload your first PDF to get started</p>
            </div>
          ) : (
            docs.map((doc) => {
              const active = selectedDoc?.id === doc.id;
              const isCompareTarget = compareDoc?.id === doc.id;
              return (
                <div key={doc.id} onClick={() => selectDoc(doc)}
                  className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer mb-1 transition-all duration-150 border
                    ${isCompareTarget ? "bg-emerald-900/30 border-emerald-700/40 text-emerald-300"
                    : active && !compareMode ? "bg-indigo-600/20 border-indigo-500/30 text-indigo-300"
                    : "border-transparent text-gray-400 hover:bg-white/5 hover:text-gray-200 hover:border-gray-700/50"}`}>
                  <div className={`shrink-0 ${active ? "text-indigo-400" : "text-gray-600 group-hover:text-gray-400"}`}><Icons.PDF /></div>
                  <span className="flex-1 text-sm truncate">{doc.name}</span>
                  {!compareMode && (
                    <button className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-500/20 hover:text-red-400 text-gray-600 transition-all" onClick={(e) => handleDelete(e, doc)}>
                      <Icons.Trash />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </nav>

        {/* Sidebar footer */}
        <div className="border-t border-gray-800 px-3 py-3 flex flex-col gap-2">
          {usage && (
            <>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${usage.plan === "pro" ? "bg-amber-900/40 border-amber-600/40 text-amber-400" : "bg-gray-800 border-gray-700 text-gray-400"}`}>
                  {usage.plan === "pro" ? "⚡ Pro" : "Free"}
                </span>
                {usage.plan === "pro"
                  ? <button onClick={handlePortal} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Manage</button>
                  : <button onClick={handleUpgrade} className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors">Upgrade ↗</button>}
              </div>

              {usage.plan !== "pro" && (
                <div className="bg-gray-800/60 rounded-xl p-2.5 flex flex-col gap-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">PDFs</span>
                    <span className="text-gray-300 font-semibold">{usage.pdfs.used}/{usage.pdfs.max}</span>
                  </div>
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all" style={{ width: `${Math.min(100, (usage.pdfs.used / usage.pdfs.max) * 100)}%` }} />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Questions</span>
                    <span className="text-gray-300 font-semibold">{usage.questions.used}/{usage.questions.max}</span>
                  </div>
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (usage.questions.used / usage.questions.max) * 100)}%`, background: usage.questions.remaining === 0 ? "#ef4444" : "linear-gradient(90deg,#6366f1,#4f46e5)" }} />
                  </div>
                  {usage.questions.remaining === 0 && <p className="text-xs text-red-400 text-center">Daily limit reached</p>}
                </div>
              )}

              {usage.plan === "pro" && <p className="text-xs text-emerald-400 font-medium text-center">✨ Unlimited PDFs & questions</p>}
            </>
          )}

          {usage?.email && (
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-xs text-gray-600 truncate flex-1">{usage.email}</span>
              <button onClick={handleSignOut} className="text-xs text-gray-600 hover:text-red-400 transition-colors shrink-0">Sign out</button>
            </div>
          )}
        </div>
      </aside>

      {/* ════════════════════════════════════════
          MAIN AREA
      ════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* ── TOP BAR ── */}
        <header className="flex items-center gap-3 px-4 sm:px-5 py-3 border-b border-gray-200 bg-white/90 backdrop-blur-sm shrink-0 min-h-[56px]">
          {/* Mobile menu toggle */}
          <button className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors" onClick={() => setSidebarOpen(true)}>
            <Icons.Menu />
          </button>

          {/* Title */}
          <div className="flex-1 min-w-0">
            {selectedDoc
              ? <p className="text-sm text-gray-600 truncate flex items-center gap-1.5"><span className="text-gray-400"><Icons.PDF /></span>{selectedDoc.name}</p>
              : <p className="text-sm font-bold text-gray-900">AI PDF Chat</p>}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            {selectedDoc?.file_url && !isMobile && (
              <>
                <button onClick={() => setPreviewOpen(v => !v)} title="Toggle PDF preview"
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors ${previewOpen ? "bg-indigo-100 text-indigo-600" : ""}`}>
                  <Icons.Eye on={previewOpen} />
                </button>
                <button onClick={handleCopyLink} title="Copy link" className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"><Icons.Copy /></button>
                <button onClick={() => window.open(selectedDoc.file_url, "_blank")} title="Open in new tab" className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"><Icons.External /></button>
                <button onClick={handleDownload} title="Download" className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"><Icons.Download /></button>
              </>
            )}
            {selectedDoc && docs.length > 1 && !isMobile && (
              <button onClick={() => { setCompareMode(v => !v); setCompareDoc(null); if (!compareMode) setSidebarOpen(true); }}
                title={compareMode ? "Exit compare" : "Compare docs"}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${compareMode ? "bg-blue-100 text-blue-600" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"}`}>
                <Icons.Compare />
              </button>
            )}
            <button onClick={() => { setVoiceMode(v => !v); window.speechSynthesis?.cancel(); }}
              title={voiceMode ? "Voice on" : "Voice off"}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${voiceMode ? "bg-emerald-100 text-emerald-600" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"}`}>
              <Icons.Speaker />
            </button>

            {/* Bell */}
            <div className="relative">
              <button onClick={() => { setAlertsOpen(v => !v); if (!alertsOpen && unreadAlerts) markAlertsRead(); }}
                className={`relative w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${alertsOpen ? "bg-amber-100 text-amber-600" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"}`}>
                <Icons.Bell />
                {unreadAlerts && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 border-2 border-white" />}
              </button>
              {alertsOpen && (
                <div className="absolute top-[calc(100%+8px)] right-0 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <span className="font-bold text-sm text-gray-900">🔔 Alerts</span>
                    <button onClick={() => setAlertsOpen(false)} className="text-gray-400 hover:text-gray-600"><Icons.Close /></button>
                  </div>
                  {alerts.length === 0
                    ? <div className="px-4 py-8 text-center text-sm text-gray-400">No alerts yet.<br /><span className="text-xs">AI analysis runs every 6 hours.</span></div>
                    : <div className="overflow-y-auto max-h-72">
                        {alerts.map((alert) => (
                          <div key={alert.id} className={`flex gap-3 px-4 py-3 border-b border-gray-50 ${alert.read ? "" : "bg-amber-50"}`}>
                            <span className="text-base shrink-0 mt-0.5">{alert.type === "warning" ? "⚠️" : alert.type === "success" ? "✅" : "ℹ️"}</span>
                            <div>
                              <p className="text-sm text-gray-700 leading-relaxed">{alert.message}</p>
                              <p className="text-xs text-gray-400 mt-1">{new Date(alert.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                            </div>
                          </div>
                        ))}
                      </div>}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── BODY ── */}
        <div className="flex-1 flex overflow-hidden">

          {/* Chat area */}
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* Scrollable chat */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-4 flex flex-col gap-5">

                {/* Agent panel */}
                {!agentDismissed && docs.length >= 2 && (agentJob || agentLoading) && (
                  <AgentPanel job={agentJob} loading={agentLoading}
                    onQuestionClick={(q) => injectPrompt(q)}
                    onDismiss={() => setAgentDismissed(true)}
                    onRerun={runAgent} />
                )}

                {/* Compare panel */}
                {compareMode && selectedDoc && (
                  <div className="w-full bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl p-5 shadow-md">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-blue-700 flex items-center gap-2"><Icons.Compare /> Compare with another document</span>
                      <button onClick={() => { setCompareMode(false); setCompareDoc(null); }} className="text-gray-400 hover:text-gray-600"><Icons.Close /></button>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">Click a document in the sidebar, or pick one below:</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {docs.filter(d => d.id !== selectedDoc.id).map((d) => (
                        <button key={d.id} onClick={() => setCompareDoc(d)}
                          className={`text-xs px-3 py-2 rounded-xl border font-medium transition-all ${compareDoc?.id === d.id ? "bg-blue-100 border-blue-300 text-blue-700" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-200"}`}>
                          {d.name}
                        </button>
                      ))}
                    </div>
                    <input type="text" value={compareQuestion} onChange={(e) => setCompareQuestion(e.target.value)}
                      placeholder="Optional question — e.g. 'Which has better pricing?'"
                      className="w-full text-sm px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 mb-3 bg-white" />
                    <button onClick={() => handleCompare(compareDoc)} disabled={!compareDoc || compareLoading}
                      className={`text-sm font-semibold px-5 py-2.5 rounded-xl transition-all ${compareDoc ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
                      {compareLoading ? "Comparing…" : compareDoc ? `Compare with "${compareDoc.name}"` : "Select a document above"}
                    </button>
                  </div>
                )}

                {/* Insights panel */}
                {selectedDoc && (insights || insightsLoading) && (
                  <InsightsPanel insights={insights} loading={insightsLoading}
                    onQuestionClick={(q) => injectPrompt(q)}
                    onDismiss={() => setInsights(null)} />
                )}

                {/* Empty state */}
                {messages.length === 0 && !loading && !isTyping && !(insights || insightsLoading) && (
                  <div className="flex flex-col items-center text-center pt-16 gap-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-indigo-400/15 rounded-full blur-2xl scale-150" />
                      <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-3xl shadow-xl shadow-indigo-500/25">
                        {selectedDoc ? "💬" : "📄"}
                      </div>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {selectedDoc ? "Ask anything about this PDF" : "What can I help with?"}
                      </h2>
                      {selectedDoc && <p className="text-sm text-gray-500">{selectedDoc.name}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                      {hints.map((h, i) => (
                        <button key={i} onClick={() => selectedDoc ? setInput(h.text) : fileInputRef.current?.click()}
                          className="flex items-start gap-3 p-4 bg-white hover:bg-indigo-50/60 border border-gray-200 hover:border-indigo-200 rounded-2xl text-left text-sm text-gray-700 transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:shadow-indigo-500/10">
                          <span className="text-lg shrink-0">{h.icon}</span>
                          <span className="leading-snug">{h.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Messages */}
                {messages.map((msg, i) => (
                  <div key={i} className={`msg-anim flex items-end gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "ai" && (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-sm shadow-md shadow-indigo-500/25 shrink-0 mb-1">⚡</div>
                    )}
                    {msg.extraction ? (
                      <ExtractionCard data={msg.extraction}
                        onCopy={() => { navigator.clipboard.writeText(JSON.stringify(msg.extraction, null, 2)); setCopiedIdx(i); setTimeout(() => setCopiedIdx(null), 2000); }}
                        copied={copiedIdx === i} />
                    ) : (
                      <div className={`max-w-[78%] ${msg.role === "user"
                        ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-2xl rounded-br-sm px-4 py-3 shadow-lg shadow-indigo-500/20"
                        : "bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm"}`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                        {msg.role === "ai" && (
                          <div className="flex gap-2 mt-2.5 pt-2.5 border-t border-gray-100">
                            <button onClick={() => handleCopy(msg.text, i)}
                              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 transition-colors">
                              <Icons.Copy />{copiedIdx === i ? <span className="text-emerald-500">Copied!</span> : "Copy"}
                            </button>
                            <button onClick={() => speak(msg.text)} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 transition-colors">
                              <Icons.Speaker />Listen
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    {msg.role === "user" && (
                      <div className="w-8 h-8 rounded-xl bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600 shrink-0 mb-1">U</div>
                    )}
                  </div>
                ))}

                {/* Follow-up suggestions */}
                {suggestions.length > 0 && !loading && !isTyping && (
                  <div className="flex flex-wrap gap-2">
                    <span className="w-full text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Follow-up</span>
                    {suggestions.map((s, i) => (
                      <button key={i} onClick={() => { injectPrompt(s); setSuggestions([]); }}
                        className="text-xs text-indigo-600 font-medium bg-white hover:bg-indigo-50 border border-indigo-200 hover:border-indigo-300 px-3 py-2 rounded-xl transition-all hover:-translate-y-0.5">
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                {/* Loading dots */}
                {loading && (
                  <div className="msg-anim flex items-end gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-sm shadow-md shrink-0 mb-1">⚡</div>
                    <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-4 shadow-sm">
                      <div className="flex gap-1.5"><span className="dot-1"/><span className="dot-2"/><span className="dot-3"/></div>
                    </div>
                  </div>
                )}

                {/* Typing stream */}
                {isTyping && (
                  <div className="msg-anim flex items-end gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-sm shadow-md shrink-0 mb-1">⚡</div>
                    <div className="max-w-[78%] bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words cursor-blink">{typingText}</p>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>
            </div>

            {/* ── BOTTOM AREA ── */}
            <div className="border-t border-gray-200 bg-white/90 backdrop-blur-sm px-4 sm:px-6 pt-3 pb-5 shrink-0">

              {/* Doc chip */}
              {selectedDoc && (
                <div className="max-w-3xl mx-auto mb-2.5 flex items-center gap-2">
                  <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                    <Icons.PDF />
                    <span className="max-w-[180px] truncate">{selectedDoc.name}</span>
                    <button className="text-indigo-400 hover:text-indigo-700 transition-colors ml-0.5"
                      onClick={() => { setSelectedDoc(null); setMessages([]); setPreviewOpen(false); }}>✕</button>
                  </div>
                </div>
              )}

              {/* Quick actions */}
              {selectedDoc && (
                <div className="max-w-3xl mx-auto mb-2.5 flex flex-wrap gap-1.5">
                  {[
                    { label: "Summarize", prompt: "Summarize this document" },
                    { label: "Key Points", prompt: "What are the key points?" },
                    { label: "Extract Data", prompt: "Extract all important data" },
                    { label: "Explain", prompt: "Explain this in simple terms" },
                  ].map(({ label, prompt }) => (
                    <button key={label} onClick={() => injectPrompt(prompt)}
                      className="text-xs text-gray-600 font-medium bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 hover:text-indigo-600 px-3 py-1.5 rounded-full transition-all">
                      {label}
                    </button>
                  ))}
                  {docs.length > 1 && (
                    <button onClick={() => { setCompareMode(v => !v); setCompareDoc(null); }}
                      className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${compareMode ? "bg-blue-100 border-blue-300 text-blue-700" : "text-gray-600 bg-gray-50 border-gray-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600"}`}>
                      ⚖ Compare
                    </button>
                  )}
                  {docs.length >= 2 && (
                    <button onClick={() => { setAgentDismissed(false); runAgent(); }} disabled={agentLoading}
                      className="text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-full transition-all disabled:opacity-60">
                      {agentLoading ? "🤖 Analyzing…" : "🤖 AI Analysis"}
                    </button>
                  )}
                </div>
              )}

              {/* Input box */}
              <div className="max-w-3xl mx-auto">
                <div className="flex items-end gap-2.5 bg-white border-2 border-gray-200 focus-within:border-indigo-400 focus-within:shadow-lg focus-within:shadow-indigo-500/10 rounded-2xl px-3 py-2.5 transition-all duration-200">
                  {/* Upload */}
                  <button onClick={() => fileInputRef.current?.click()} title="Upload PDF"
                    className="w-8 h-8 shrink-0 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors mb-0.5">
                    <Icons.Plus />
                  </button>

                  {/* Mic */}
                  <button onClick={toggleRecording} disabled={!selectedDoc || transcribing} title={isRecording ? "Stop" : "Voice"}
                    className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-xl transition-all mb-0.5 ${
                      isRecording ? "bg-red-100 text-red-500 mic-pulse" : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    } disabled:opacity-40`}>
                    {transcribing ? <span className="text-[10px] font-bold text-gray-400">…</span> : isRecording ? <Icons.MicOff /> : <Icons.Mic />}
                  </button>

                  {/* Textarea */}
                  <textarea ref={textareaRef} suppressHydrationWarning
                    value={input} rows={1}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={!selectedDoc || loading || isTyping || isRecording}
                    placeholder={
                      isRecording ? "🔴 Listening… click mic to stop"
                      : transcribing ? "Transcribing…"
                      : selectedDoc ? "Ask anything about this PDF…"
                      : "Upload a PDF to start chatting…"
                    }
                    className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 placeholder-gray-400 resize-none leading-relaxed py-1 max-h-36 overflow-y-auto disabled:opacity-50"
                    style={{ minHeight: 28 }}
                  />

                  {/* Send */}
                  <button onClick={handleAsk} disabled={!canSend} title="Send (Enter)"
                    className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-xl transition-all mb-0.5 ${
                      canSend
                        ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105 active:scale-95 cursor-pointer"
                        : "bg-gray-100 text-gray-300 cursor-not-allowed"
                    }`}>
                    <Icons.Send />
                  </button>
                </div>
                <p className="text-center text-xs text-gray-300 mt-2">Enter to send · Shift+Enter for new line</p>
              </div>
            </div>
          </div>

          {/* ── PDF PREVIEW PANEL ── */}
          {previewOpen && selectedDoc?.file_url && !isMobile && (
            <div className="w-72 shrink-0 border-l border-gray-200 flex flex-col bg-gray-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5"><Icons.PDF /> Preview</span>
                <button className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors" onClick={() => setPreviewOpen(false)}><Icons.Close /></button>
              </div>
              <div className="flex-1 min-h-0 m-3 rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm">
                <iframe src={selectedDoc.file_url + "#toolbar=0&navpanes=0&zoom=page-width"} className="w-full h-full border-none" title="PDF Preview" />
              </div>
              <div className="p-3">
                <button onClick={() => window.open(selectedDoc.file_url, "_blank")}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold py-2.5 rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-0.5 transition-all">
                  <Icons.External /> Open Full PDF
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
