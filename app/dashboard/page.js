"use client";

import { useState, useRef, useEffect, useCallback } from "react";

/* ─── MOCK DATA ──────────────────────────────────────────────────────────── */
const MOCK_PDFS = [
  { id: 1, name: "Research Paper Q4.pdf",   pages: 24, size: "2.1 MB", date: "Today" },
  { id: 2, name: "Contract 2024.pdf",        pages: 8,  size: "0.8 MB", date: "Yesterday" },
  { id: 3, name: "Annual Report.pdf",        pages: 52, size: "4.6 MB", date: "2 days ago" },
  { id: 4, name: "Meeting Notes April.pdf",  pages: 5,  size: "0.3 MB", date: "Apr 3" },
  { id: 5, name: "Technical Manual v3.pdf",  pages: 116,size: "8.2 MB", date: "Mar 28" },
];

const MOCK_ANALYSIS = {
  overview: "These documents collectively cover Q4 financial performance, contractual obligations, and technical specifications. The research paper provides supporting data for strategic decisions outlined in the annual report.",
  themes: ["Financial Performance", "AI & Automation", "Risk Assessment", "Product Roadmap", "Compliance"],
  differences: [
    "Research paper focuses on long-term projections while the contract specifies short-term deliverables.",
    "Annual report uses conservative estimates whereas the technical manual assumes optimistic adoption rates.",
    "Compliance requirements differ between the contract (GDPR) and the annual report (SOX).",
  ],
  actions: [
    "Schedule legal review of Contract 2024 clauses 7–12 before May 15.",
    "Cross-reference Q4 research findings with annual report projections.",
    "Update technical manual to reflect new compliance requirements.",
    "Prepare executive summary combining key insights from all documents.",
  ],
  questions: [
    "What are the key financial projections for Q4?",
    "What compliance requirements apply across all documents?",
    "Which action items are highest priority?",
    "How do the technical specs align with business goals?",
  ],
};

const MOCK_AI_RESPONSES = [
  "Based on the document, the main conclusion is that transformer-based models outperform traditional NLP methods by approximately **34% accuracy** on long-document tasks. This was validated across 5 benchmark datasets.",
  "The key financial projections show a **12% revenue growth** target for Q4, driven primarily by enterprise contracts and new product launches in the APAC region.",
  "Section 3 covers the **fine-tuning methodology** — the model was trained on 50,000 domain-specific documents using a custom pipeline with reinforcement learning from human feedback (RLHF).",
  "The compliance requirements include GDPR Article 17 (right to erasure), SOX Section 404 (internal controls), and CCPA data processing standards. All three apply to your current document set.",
];

/* ─── ICONS ──────────────────────────────────────────────────────────────── */
const PdfIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
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
const CloseIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const RefreshIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
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

/* ─── AI ANALYSIS CARD ───────────────────────────────────────────────────── */
function AnalysisCard({ onAsk }) {
  const [tab, setTab] = useState("overview");
  const [refreshing, setRefreshing] = useState(false);
  const tabs = ["overview", "differences", "actions", "ask"];

  const themeColors = [
    "bg-violet-100 text-violet-700 border-violet-200 hover:bg-violet-200",
    "bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200",
    "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200",
    "bg-cyan-100 text-cyan-700 border-cyan-200 hover:bg-cyan-200",
    "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200",
  ];

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  return (
    <div className="w-full bg-white/70 backdrop-blur-md border border-indigo-100/80 rounded-2xl shadow-xl shadow-indigo-500/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/30 shrink-0">
            <SparkleIcon />
            <span className="sr-only">AI</span>
          </div>
          <div>
            <p className="text-sm font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent leading-tight">
              AI Agent Analysis
            </p>
            <p className="text-[11px] text-gray-400">{MOCK_PDFS.length} documents analyzed</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          className={`flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg transition-all ${refreshing ? "opacity-60" : ""}`}
        >
          <span className={refreshing ? "animate-spin" : ""}><RefreshIcon /></span>
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* Tabs */}
      <div className="px-5 pt-4">
        <div className="flex gap-1 bg-gray-50 p-1 rounded-xl w-fit">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all duration-200 ${
                tab === t
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/30"
                  : "text-gray-500 hover:text-gray-800 hover:bg-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-5 py-4">
        {/* Overview */}
        {tab === "overview" && (
          <div className="flex flex-col gap-5">
            <p className="text-sm text-gray-700 leading-relaxed">{MOCK_ANALYSIS.overview}</p>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Common Themes</p>
              <div className="flex flex-wrap gap-2">
                {MOCK_ANALYSIS.themes.map((t, i) => (
                  <span key={i} className={`text-xs font-semibold px-3 py-1.5 rounded-full border cursor-default transition-colors ${themeColors[i % themeColors.length]}`}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Documents</p>
              <div className="flex flex-col gap-2">
                {MOCK_PDFS.slice(0, 3).map((doc, i) => (
                  <div key={doc.id} className="flex items-center gap-3 bg-gray-50 hover:bg-indigo-50/60 border border-gray-100 hover:border-indigo-200 rounded-xl px-3 py-2.5 transition-all duration-150 group cursor-default">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">{i + 1}</div>
                    <span className="text-xs font-medium text-gray-700 truncate flex-1">{doc.name}</span>
                    <span className="text-[10px] text-gray-400 shrink-0">{doc.pages}p</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Differences */}
        {tab === "differences" && (
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Key Differences</p>
            <ul className="flex flex-col gap-3">
              {MOCK_ANALYSIS.differences.map((d, i) => (
                <li key={i} className="flex gap-3 items-start text-sm text-gray-700">
                  <span className="w-5 h-5 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">≠</span>
                  <span className="leading-relaxed">{d}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        {tab === "actions" && (
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Action Items</p>
            <ul className="flex flex-col gap-3">
              {MOCK_ANALYSIS.actions.map((a, i) => (
                <li key={i} className="flex gap-3 items-start text-sm text-gray-700">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">→</span>
                  <span className="leading-relaxed">{a}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Ask */}
        {tab === "ask" && (
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Suggested Questions</p>
            <div className="flex flex-wrap gap-2">
              {MOCK_ANALYSIS.questions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => onAsk(q)}
                  className="text-xs text-indigo-600 font-medium bg-white hover:bg-indigo-50 border border-indigo-200 hover:border-indigo-300 px-3 py-2 rounded-xl transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── DASHBOARD ──────────────────────────────────────────────────────────── */
export default function Dashboard() {
  const [selectedPdf, setSelectedPdf] = useState(MOCK_PDFS[0]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingText, setTypingText] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [activeView, setActiveView] = useState("chat"); // "chat" | "analysis"

  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const responseIdx = useRef(0);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingText]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
  }, [input]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isTyping) return;
    const text = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setIsTyping(true);
    setTypingText("");

    // Simulate streaming AI response
    const response = MOCK_AI_RESPONSES[responseIdx.current % MOCK_AI_RESPONSES.length];
    responseIdx.current++;
    let i = 0;
    const interval = setInterval(() => {
      i += 3;
      setTypingText(response.slice(0, i));
      if (i >= response.length) {
        clearInterval(interval);
        setIsTyping(false);
        setTypingText("");
        setMessages((prev) => [...prev, { role: "ai", text: response }]);
      }
    }, 18);
  }, [input, isTyping]);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleAskFromPanel = (q) => {
    setInput(q);
    setActiveView("chat");
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const selectPdf = (pdf) => {
    setSelectedPdf(pdf);
    setMessages([]);
    setSidebarOpen(false);
  };

  const quickPrompts = ["Summarize this document", "What are the key points?", "Extract important data", "Explain the main topic"];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <style>{`
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes blink { 0%,80%,100%{opacity:.25;transform:scale(.8)} 40%{opacity:1;transform:scale(1)} }
        @keyframes cursorBlink { 0%,100%{opacity:1} 50%{opacity:0} }
        .msg-in { animation: fadeSlideUp .28s ease both; }
        .dot { width:7px;height:7px;border-radius:50%;background:#94a3b8;display:inline-block;animation:blink 1.2s infinite ease-in-out; }
        .dot:nth-child(2){animation-delay:.15s} .dot:nth-child(3){animation-delay:.3s}
        .cursor-type::after { content:''; display:inline-block;width:2px;height:15px;background:#6366f1;margin-left:2px;vertical-align:text-bottom;animation:cursorBlink .7s infinite; }
        ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:4px} ::-webkit-scrollbar-thumb:hover{background:#cbd5e1}
      `}</style>

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ══════════════════════════════════════════
          LEFT SIDEBAR
      ══════════════════════════════════════════ */}
      <aside className={`
        fixed md:relative inset-y-0 left-0 z-40 w-64 flex flex-col
        bg-gray-900 border-r border-gray-800
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        {/* Brand */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800 shrink-0">
          <a href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </div>
            <span className="text-white font-bold text-base tracking-tight">PDF Chat</span>
          </a>
          <button className="md:hidden text-gray-400 hover:text-white transition-colors" onClick={() => setSidebarOpen(false)}>
            <CloseIcon />
          </button>
        </div>

        {/* Upload button */}
        <div className="px-3 py-3 shrink-0">
          <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5"
          >
            <PlusIcon />
            Upload PDF
          </button>
        </div>

        {/* PDF list */}
        <div className="px-3 mb-2 shrink-0">
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.12em] px-1">Recent PDFs</p>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 pb-4">
          {MOCK_PDFS.map((pdf) => {
            const active = selectedPdf?.id === pdf.id;
            return (
              <button
                key={pdf.id}
                onClick={() => selectPdf(pdf)}
                className={`group w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl mb-1 text-left transition-all duration-150 border ${
                  active
                    ? "bg-indigo-600/20 border-indigo-500/30 text-indigo-300"
                    : "border-transparent text-gray-400 hover:bg-white/5 hover:text-gray-200 hover:border-gray-700/50"
                }`}
              >
                <div className={`shrink-0 mt-0.5 ${active ? "text-indigo-400" : "text-gray-600 group-hover:text-gray-400"}`}>
                  <PdfIcon />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm truncate leading-tight">{pdf.name}</p>
                  <p className="text-[10px] text-gray-600 mt-0.5">{pdf.pages}p · {pdf.size} · {pdf.date}</p>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="border-t border-gray-800 px-4 py-4 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 bg-gray-800 border border-gray-700 px-2.5 py-1 rounded-full">Free Plan</span>
            <a href="/dashboard" className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors">Upgrade ↗</a>
          </div>
          <div className="bg-gray-800/60 rounded-xl p-2.5 mb-3">
            <div className="flex justify-between text-[10px] mb-1.5">
              <span className="text-gray-500">PDFs used</span>
              <span className="text-gray-300 font-semibold">3 / 5</span>
            </div>
            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full w-[60%] bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full" />
            </div>
          </div>
          <a href="/login" className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-300 transition-colors">
            <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-300">U</div>
            user@example.com
          </a>
        </div>
      </aside>

      {/* ══════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* ── TOP BAR ── */}
        <header className="flex items-center gap-3 px-4 sm:px-5 py-3 border-b border-gray-200 bg-white/90 backdrop-blur-sm shrink-0 min-h-[56px]">
          <button
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <MenuIcon />
          </button>

          {/* PDF name */}
          <div className="flex-1 min-w-0 flex items-center gap-2">
            {selectedPdf ? (
              <>
                <div className="text-gray-400 shrink-0"><PdfIcon /></div>
                <p className="text-sm font-semibold text-gray-800 truncate">{selectedPdf.name}</p>
                <span className="hidden sm:block text-xs text-gray-400 shrink-0">{selectedPdf.pages} pages</span>
              </>
            ) : (
              <p className="text-sm font-bold text-gray-900">AI PDF Chat</p>
            )}
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveView("chat")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeView === "chat" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveView("analysis")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeView === "analysis" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              Analysis
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => { setMessages([]); }}
              title="New chat"
              className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            >
              <PlusIcon />
            </button>
          </div>
        </header>

        {/* ── BODY ── */}
        <div className="flex-1 overflow-hidden flex flex-col">

          {/* ANALYSIS VIEW */}
          {activeView === "analysis" && (
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
              <div className="max-w-3xl mx-auto">
                <AnalysisCard onAsk={handleAskFromPanel} />

                {/* Full PDF list */}
                <div className="mt-6 bg-white/70 backdrop-blur-sm border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <p className="text-sm font-bold text-gray-800 mb-4">All Documents</p>
                  <div className="flex flex-col gap-2">
                    {MOCK_PDFS.map((pdf) => (
                      <div
                        key={pdf.id}
                        onClick={() => { setSelectedPdf(pdf); setActiveView("chat"); }}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm ${selectedPdf?.id === pdf.id ? "bg-indigo-50 border-indigo-200" : "bg-gray-50 border-gray-100 hover:bg-indigo-50/60 hover:border-indigo-100"}`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${selectedPdf?.id === pdf.id ? "bg-gradient-to-br from-indigo-500 to-violet-500 text-white" : "bg-gray-200 text-gray-500"}`}>
                          <PdfIcon />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{pdf.name}</p>
                          <p className="text-xs text-gray-400">{pdf.pages} pages · {pdf.size}</p>
                        </div>
                        <span className="text-xs text-gray-400 shrink-0">{pdf.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CHAT VIEW */}
          {activeView === "chat" && (
            <>
              {/* Scrollable chat */}
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-4 flex flex-col gap-5">

                  {/* Inline analysis card (collapsed) */}
                  {showAnalysis && (
                    <div className="w-full bg-gradient-to-r from-indigo-50/80 to-violet-50/80 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-sm shrink-0 shadow-md shadow-indigo-500/25">🤖</div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">AI Analysis ready</p>
                          <p className="text-xs text-gray-500">{MOCK_PDFS.length} documents · {MOCK_ANALYSIS.themes.length} themes identified</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => setActiveView("analysis")} className="text-xs font-semibold text-indigo-600 bg-white border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors">
                          View
                        </button>
                        <button onClick={() => setShowAnalysis(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><CloseIcon /></button>
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {messages.length === 0 && !isTyping && (
                    <div className="flex flex-col items-center text-center pt-10 gap-6">
                      <div className="relative">
                        <div className="absolute inset-0 bg-indigo-400/15 rounded-full blur-2xl scale-150" />
                        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-3xl shadow-xl shadow-indigo-500/25">💬</div>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Ask anything about this PDF</h2>
                        <p className="text-sm text-gray-500 max-w-sm">{selectedPdf ? `Currently reading: ${selectedPdf.name}` : "Select a PDF from the sidebar to start"}</p>
                      </div>
                      {/* Quick prompt cards */}
                      <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                        {quickPrompts.map((p, i) => (
                          <button
                            key={i}
                            onClick={() => setInput(p)}
                            className="p-4 bg-white hover:bg-indigo-50/70 border border-gray-200 hover:border-indigo-200 rounded-2xl text-sm text-gray-700 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:shadow-indigo-500/8"
                          >
                            <span className="text-base mr-2">{["📋","🔑","📊","🧠"][i]}</span>
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Messages */}
                  {messages.map((msg, i) => (
                    <div key={i} className={`msg-in flex items-end gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      {msg.role === "ai" && (
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-sm shadow-md shadow-indigo-500/25 shrink-0 mb-0.5">⚡</div>
                      )}

                      <div className={`max-w-[78%] ${
                        msg.role === "user"
                          ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-2xl rounded-br-sm px-4 py-3 shadow-lg shadow-indigo-500/20"
                          : "bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm"
                      }`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                        {msg.role === "ai" && (
                          <div className="flex gap-2 mt-2.5 pt-2 border-t border-gray-100">
                            <button
                              onClick={() => handleCopy(msg.text, i)}
                              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 transition-colors"
                            >
                              <CopyIcon />
                              {copiedIdx === i ? <span className="text-emerald-500">Copied!</span> : "Copy"}
                            </button>
                          </div>
                        )}
                      </div>

                      {msg.role === "user" && (
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0 mb-0.5">U</div>
                      )}
                    </div>
                  ))}

                  {/* Loading dots */}
                  {isTyping && !typingText && (
                    <div className="msg-in flex items-end gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-sm shadow-md shrink-0">⚡</div>
                      <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-4 shadow-sm">
                        <div className="flex gap-1.5"><span className="dot"/><span className="dot"/><span className="dot"/></div>
                      </div>
                    </div>
                  )}

                  {/* Typing stream */}
                  {isTyping && typingText && (
                    <div className="msg-in flex items-end gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-sm shadow-md shrink-0">⚡</div>
                      <div className="max-w-[78%] bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words cursor-type">{typingText}</p>
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>
              </div>

              {/* ── INPUT BAR ── */}
              <div className="border-t border-gray-200 bg-white/95 backdrop-blur-sm px-4 sm:px-6 pt-3 pb-5 shrink-0">
                {/* Quick action chips */}
                <div className="max-w-3xl mx-auto mb-2.5 flex flex-wrap gap-1.5">
                  {quickPrompts.map((p) => (
                    <button
                      key={p}
                      onClick={() => setInput(p)}
                      className="text-xs text-gray-500 font-medium bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 hover:text-indigo-600 px-3 py-1.5 rounded-full transition-all duration-150"
                    >
                      {p}
                    </button>
                  ))}
                </div>

                {/* PDF chip */}
                {selectedPdf && (
                  <div className="max-w-3xl mx-auto mb-2 flex items-center">
                    <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                      <PdfIcon />
                      <span className="max-w-[180px] sm:max-w-none truncate">{selectedPdf.name}</span>
                      <button onClick={() => setSelectedPdf(null)} className="text-indigo-400 hover:text-indigo-700 ml-0.5 transition-colors">✕</button>
                    </div>
                  </div>
                )}

                {/* Input box */}
                <div className="max-w-3xl mx-auto">
                  <div className="flex items-end gap-2.5 bg-white border-2 border-gray-200 focus-within:border-indigo-400 focus-within:shadow-lg focus-within:shadow-indigo-500/10 rounded-2xl px-4 py-3 transition-all duration-200">
                    <textarea
                      ref={textareaRef}
                      value={input}
                      rows={1}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKey}
                      placeholder={selectedPdf ? `Ask anything about "${selectedPdf.name}"…` : "Upload a PDF to start chatting…"}
                      disabled={isTyping}
                      className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 placeholder-gray-400 resize-none leading-relaxed py-0.5 max-h-36 overflow-y-auto disabled:opacity-50"
                      style={{ minHeight: 24 }}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!input.trim() || isTyping}
                      className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-xl transition-all duration-200 ${
                        input.trim() && !isTyping
                          ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30 hover:scale-105 hover:shadow-indigo-500/50 active:scale-95 cursor-pointer"
                          : "bg-gray-100 text-gray-300 cursor-not-allowed"
                      }`}
                    >
                      <SendIcon />
                    </button>
                  </div>
                  <p className="text-center text-[11px] text-gray-300 mt-2">
                    Enter to send · Shift+Enter for new line · Responses are simulated for demo
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
