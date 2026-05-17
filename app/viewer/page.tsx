"use client";

import { Suspense, useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import "./viewer.css";

const PdfViewer = dynamic(() => import("@/app/components/PdfViewer"), {
  ssr: false,
  loading: () => (
    <div className="vw-url-loading">
      <div className="vw-url-spinner" />
      <span>Loading viewer…</span>
    </div>
  ),
});

/* ── Types ──────────────────────────────────────────────────────────────── */
interface Message {
  id: number;
  role: "user" | "ai";
  text: string;
  done?: boolean;
}
interface DocItem {
  id: string;
  file_name: string;
  file_url: string;
  created_at: string;
}
interface Insights {
  summary: string;
  key_points: string[];
  suggested_questions: string[];
}
interface CompareResult {
  result: string;
  doc1: { id: string; name: string };
  doc2: { id: string; name: string };
}

/* ── Constants ──────────────────────────────────────────────────────────── */
const CHIPS = [
  "Summarise this document",
  "What are the key numbers?",
  "Any risks mentioned?",
  "Suggest follow-up questions",
];

/* ── Markdown-lite renderer ─────────────────────────────────────────────── */
function renderMarkdown(raw: string): React.ReactNode {
  if (!raw) return null;
  const lines = raw.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { nodes.push(<br key={i} />); i++; continue; }
    if (/^[-*•]\s/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^[-*•]\s/.test(lines[i])) {
        items.push(<li key={i}>{inlineRender(lines[i].replace(/^[-*•]\s/, ""))}</li>);
        i++;
      }
      nodes.push(<ul key={`ul-${i}`}>{items}</ul>);
      continue;
    }
    if (/^\d+\.\s/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(<li key={i}>{inlineRender(lines[i].replace(/^\d+\.\s/, ""))}</li>);
        i++;
      }
      nodes.push(<ol key={`ol-${i}`}>{items}</ol>);
      continue;
    }
    if (line.startsWith("```")) {
      const block: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) { block.push(lines[i]); i++; }
      nodes.push(<pre key={i}><code>{block.join("\n")}</code></pre>);
      i++;
      continue;
    }
    nodes.push(<p key={i}>{inlineRender(line)}</p>);
    i++;
  }
  return <>{nodes}</>;
}

function inlineRender(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`"))
      return <code key={i}>{part.slice(1, -1)}</code>;
    return part;
  });
}

/* ── Citation extractor ─────────────────────────────────────────────────── */
function splitCitation(text: string): { body: string; cite: string | null } {
  const patterns = [
    /\n+(?:Source|Cited from|Citation|References?):\s*(.+)$/i,
    /\n+((?:p\.\s*\d+|§\s*[\d.]+|chart\s*[\d.]+|appendix\s*\w+)[^\n]{0,120})$/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return { body: text.slice(0, m.index!).trimEnd(), cite: m[1].trim() };
  }
  return { body: text, cite: null };
}

function useAutoResize(ref: React.RefObject<HTMLTextAreaElement | null>, value: string) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value, ref]);
}

/* ── File icon ──────────────────────────────────────────────────────────── */
function FileIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   VIEWER CONTENT
   ══════════════════════════════════════════════════════════════════════════ */
function ViewerContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const rawUrl       = useMemo(() => searchParams.get("url") ?? "", [searchParams]);

  /* PDF state */
  const [signedUrl,   setSignedUrl]   = useState<string>("");
  const [urlLoading,  setUrlLoading]  = useState(true);
  const [fileName,    setFileName]    = useState("Document");
  const [pageInfo,    setPageInfo]    = useState({ current: 1, total: 0 });
  const [showPreview, setShowPreview] = useState(false);

  /* Chat state */
  const [messages,  setMessages]  = useState<Message[]>([]);
  const [input,     setInput]     = useState("");
  const [streaming, setStreaming] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  /* Files sidebar */
  const [allDocs,   setAllDocs]   = useState<DocItem[]>([]);
  const [showFiles, setShowFiles] = useState(true);

  /* Right panel: insights / compare */
  const [rightTab,      setRightTab]      = useState<"insights" | "compare" | null>(null);
  const [insights,      setInsights]      = useState<Insights | null>(null);
  const [insightsLoad,  setInsightsLoad]  = useState(false);
  const [insightsErr,   setInsightsErr]   = useState<string | null>(null);
  const [compareDocId,  setCompareDocId]  = useState<string>("");
  const [compareQ,      setCompareQ]      = useState("");
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const [compareLoad,   setCompareLoad]   = useState(false);
  const [compareErr,    setCompareErr]    = useState<string | null>(null);

  const endRef      = useRef<HTMLDivElement>(null);
  const abortRef    = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useAutoResize(textareaRef, input);

  /* Derived: current doc ID from allDocs list */
  const currentDoc = useMemo(
    () => allDocs.find(d => d.file_url === rawUrl || rawUrl.includes(d.file_url)) ?? null,
    [allDocs, rawUrl]
  );

  /* Fetch all docs for sidebar */
  useEffect(() => {
    fetch("/api/docs", { credentials: "include" })
      .then(r => r.json())
      .then((data: DocItem[]) => Array.isArray(data) && setAllDocs(data))
      .catch(() => {});
  }, []);

  /* Derive file name from URL */
  useEffect(() => {
    if (!rawUrl) return;
    const raw = decodeURIComponent(rawUrl.split("/").pop()?.split("?")[0] ?? "");
    const name = raw.replace(/^\d{13}-/, "").replace(/^\d+-/, "");
    if (name) setFileName(name);
  }, [rawUrl]);

  /* Fetch signed URL */
  useEffect(() => {
    if (!rawUrl) { setUrlLoading(false); return; }
    setUrlLoading(true);
    const ctrl = new AbortController();
    fetch(`/api/pdf-signed-url?fileUrl=${encodeURIComponent(rawUrl)}`, {
      credentials: "include", signal: ctrl.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        const json = await res.json() as { signedUrl?: string; fileName?: string };
        setSignedUrl(json.signedUrl ?? rawUrl);
        if (json.fileName) setFileName(json.fileName);
      })
      .catch((err: unknown) => {
        if ((err as Error).name !== "AbortError") setSignedUrl(rawUrl);
      })
      .finally(() => setUrlLoading(false));
    return () => ctrl.abort();
  }, [rawUrl]);

  /* Auto-scroll chat */
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, streaming]);

  /* Reset insights when doc changes */
  useEffect(() => {
    setInsights(null);
    setInsightsErr(null);
    setCompareResult(null);
    setCompareErr(null);
    setCompareDocId("");
  }, [rawUrl]);

  /* Load insights */
  const loadInsights = useCallback(async () => {
    if (!currentDoc) { setInsightsErr("Document not found in your library."); return; }
    setInsightsLoad(true);
    setInsightsErr(null);
    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: currentDoc.id, fileUrl: rawUrl }),
        credentials: "include",
      });
      const data = await res.json() as Insights & { error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed");
      setInsights(data);
    } catch (e: unknown) {
      setInsightsErr((e as Error).message ?? "Could not load insights.");
    } finally {
      setInsightsLoad(false);
    }
  }, [currentDoc, rawUrl]);

  /* Run compare */
  const runCompare = useCallback(async () => {
    if (!currentDoc || !compareDocId) return;
    setCompareLoad(true);
    setCompareErr(null);
    setCompareResult(null);
    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc1Id: currentDoc.id, doc2Id: compareDocId, question: compareQ.trim() || undefined }),
        credentials: "include",
      });
      const data = await res.json() as CompareResult & { error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed");
      setCompareResult(data);
    } catch (e: unknown) {
      setCompareErr((e as Error).message ?? "Comparison failed.");
    } finally {
      setCompareLoad(false);
    }
  }, [currentDoc, compareDocId, compareQ]);

  /* Send chat message */
  const send = useCallback(async (question?: string) => {
    const q = (question ?? input).trim();
    if (!q || streaming || !rawUrl) return;
    setInput(""); setChatError(null);
    const uid = Date.now();
    setMessages(m => [...m, { id: uid, role: "user", text: q, done: true }]);
    setStreaming(true);
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const aiId = uid + 1;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q, fileUrl: rawUrl }),
        credentials: "include",
        signal: abortRef.current.signal,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? `Server error ${res.status}`);
      }
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = "";
      setMessages(m => [...m, { id: aiId, role: "ai", text: "", done: false }]);
      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6);
          if (payload === "[DONE]") break outer;
          full += payload.replace(/\\n/g, "\n");
          setMessages(m => {
            const copy = [...m];
            const idx = copy.findLastIndex(msg => msg.id === aiId);
            if (idx >= 0) copy[idx] = { ...copy[idx], text: full };
            return copy;
          });
        }
      }
      setMessages(m => {
        const copy = [...m];
        const idx = copy.findLastIndex(msg => msg.id === aiId);
        if (idx >= 0) copy[idx] = { ...copy[idx], done: true };
        return copy;
      });
    } catch (err: unknown) {
      const msg = (err as Error)?.message ?? "Unknown error";
      if (msg === "AbortError" || (err as Error)?.name === "AbortError") return;
      setChatError(msg);
      setMessages(m => m.filter(msg => msg.id !== aiId));
    } finally {
      setStreaming(false);
    }
  }, [input, streaming, rawUrl]);

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }, [send]);

  /* Open right tab and auto-load insights */
  const openRightTab = useCallback((tab: "insights" | "compare") => {
    setRightTab(prev => prev === tab ? null : tab);
    if (tab === "insights" && !insights && !insightsLoad) {
      loadInsights();
    }
  }, [insights, insightsLoad, loadInsights]);

  /* ── No URL ─────────────────────────────────────────────────────────────── */
  if (!rawUrl) {
    return (
      <div className="vw-root">
        <div className="vw-no-url">
          <div className="vw-no-url-icon"><FileIcon size={28} /></div>
          <div className="vw-no-url-title">No document selected</div>
          <div className="vw-no-url-sub">Open a PDF from your dashboard to start chatting with it.</div>
          <button className="vw-no-url-btn" onClick={() => router.push("/dashboard")}>Go to Dashboard</button>
        </div>
      </div>
    );
  }

  const otherDocs = allDocs.filter(d => d.id !== currentDoc?.id);

  /* ── Main viewer ─────────────────────────────────────────────────────────── */
  return (
    <div className="vw-root">

      {/* ── TOP BAR ────────────────────────────────────────────────────────── */}
      <div className="vw-topbar">
        {/* Left controls */}
        <button className="vw-back-btn" onClick={() => router.push("/dashboard")}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path d="M9 3L5 7.5 9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Dashboard
        </button>

        {/* Files toggle */}
        <button
          className={`vw-topbar-btn${showFiles ? " vw-topbar-btn-active" : ""}`}
          onClick={() => setShowFiles(v => !v)}
          title="Toggle files panel"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <line x1="8" y1="4" x2="8" y2="20"/>
          </svg>
          Files {allDocs.length > 0 && <span className="vw-files-count">{allDocs.length}</span>}
        </button>

        <div className="vw-topbar-title">{fileName}</div>

        <div className="vw-topbar-actions">
          {showPreview && pageInfo.total > 0 && (
            <span style={{ fontSize: 12, color: "var(--text-3)", marginRight: 4 }}>
              p.{pageInfo.current}/{pageInfo.total}
            </span>
          )}
          <button
            className={`vw-topbar-btn vw-preview-toggle${showPreview ? " active" : ""}`}
            onClick={() => setShowPreview(v => !v)}
            title={showPreview ? "Hide PDF preview" : "Show PDF preview"}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <line x1="9" y1="3" x2="9" y2="21"/>
            </svg>
            <span>{showPreview ? "Hide PDF" : "View PDF"}</span>
          </button>

          {/* Insights button */}
          <button
            className={`vw-topbar-btn${rightTab === "insights" ? " vw-topbar-btn-active" : ""}`}
            onClick={() => openRightTab("insights")}
            title="AI Insights"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Insights
          </button>

          {/* Compare button */}
          <button
            className={`vw-topbar-btn${rightTab === "compare" ? " vw-topbar-btn-active" : ""}`}
            onClick={() => openRightTab("compare")}
            title="Compare with another document"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="18" rx="1"/>
              <rect x="14" y="3" width="7" height="18" rx="1"/>
            </svg>
            Compare
          </button>

          <a className="vw-topbar-btn" href={rawUrl} target="_blank" rel="noreferrer" download>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 1v8M3.5 6l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M1 10.5h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            Download
          </a>
        </div>
      </div>

      {/* ── PANELS ─────────────────────────────────────────────────────────── */}
      <div className="vw-panels">

        {/* ── LEFT: FILES SIDEBAR ──────────────────────────────────────────── */}
        {showFiles && (
          <div className="vw-files-panel">
            <div className="vw-files-header">
              <span>Your Files</span>
              <span className="vw-files-count-badge">{allDocs.length}</span>
            </div>
            <div className="vw-files-list">
              {allDocs.length === 0 && (
                <div className="vw-files-empty">No documents yet</div>
              )}
              {allDocs.map(doc => {
                const isActive = doc.file_url === rawUrl;
                const cleanName = doc.file_name.replace(/\.pdf$/i, "");
                return (
                  <button
                    key={doc.id}
                    className={`vw-file-item${isActive ? " active" : ""}`}
                    onClick={() => !isActive && router.push(`/viewer?url=${encodeURIComponent(doc.file_url)}`)}
                    title={cleanName}
                  >
                    <span className="vw-file-item-icon"><FileIcon size={13} /></span>
                    <span className="vw-file-item-name">{cleanName}</span>
                    {isActive && <span className="vw-file-item-dot" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── CENTER: PDF + CHAT ───────────────────────────────────────────── */}
        <div className={`vw-center${showPreview ? "" : " vw-center-chat-only"}${rightTab ? " vw-center-with-right" : ""}`}>

          {/* PDF preview */}
          {showPreview && (
            <div className="vw-pdf-panel">
              {urlLoading ? (
                <div className="vw-url-loading">
                  <div className="vw-url-spinner" />
                  <span>Preparing document…</span>
                </div>
              ) : (
                <PdfViewer
                  url={signedUrl || rawUrl}
                  onPageChange={(cur, tot) => setPageInfo({ current: cur, total: tot })}
                />
              )}
            </div>
          )}

          {/* Chat */}
          <div className="vw-chat-panel">
            <div className="ch-header">
              <div className="ch-header-left">
                <div className="ch-header-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <div>
                  <div className="ch-header-title">Ask this document</div>
                  {messages.length > 0 && (
                    <div className="ch-header-sub">{messages.length} message{messages.length > 1 ? "s" : ""}</div>
                  )}
                </div>
              </div>
              {messages.length > 0 && (
                <button className="ch-clear-btn" onClick={() => { setMessages([]); setChatError(null); }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  Clear
                </button>
              )}
            </div>

            <div className="ch-messages">
              {messages.length === 0 && !streaming && (
                <div className="ch-empty">
                  <div className="ch-empty-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M9 12h6M9 16h4M17 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/>
                    </svg>
                  </div>
                  <div className="ch-empty-title">Ready to answer</div>
                  <div className="ch-empty-sub">Ask anything — summaries, key figures, risk analysis, or specific clauses. Every answer is cited.</div>
                </div>
              )}

              {messages.map(msg => {
                if (msg.role === "user") {
                  return (
                    <div key={msg.id} className="ch-msg ch-msg-user">
                      <div className="ch-msg-label">You</div>
                      <div className="ch-bubble">{msg.text}</div>
                    </div>
                  );
                }
                const { body, cite } = splitCitation(msg.text);
                const isStreaming = !msg.done && streaming;
                return (
                  <div key={msg.id} className="ch-msg ch-msg-ai">
                    <div className="ch-msg-label">Intellixy AI</div>
                    <div className="ch-bubble">
                      {renderMarkdown(body)}
                      {isStreaming && !body && <span style={{ color: "var(--text-3)", fontStyle: "italic" }}>Thinking…</span>}
                      {isStreaming && <span className="ch-cursor" />}
                      {cite && msg.done && (
                        <div className="ch-citation">
                          <span className="ch-citation-icon">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3z"/>
                              <polyline points="15 3 15 9 21 9"/>
                            </svg>
                          </span>
                          <span>Cited from {cite}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {streaming && messages[messages.length - 1]?.role !== "ai" && (
                <div className="ch-typing">
                  <span className="ch-dot" /><span className="ch-dot" /><span className="ch-dot" />
                </div>
              )}

              {chatError && (
                <div className="ch-error-bubble">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {chatError}
                  <button className="ch-error-retry" onClick={() => setChatError(null)}>Dismiss</button>
                </div>
              )}

              <div ref={endRef} />
            </div>

            {messages.length === 0 && (
              <div className="ch-chips">
                {CHIPS.map(c => (
                  <button key={c} className="ch-chip" onClick={() => send(c)} disabled={streaming}>{c}</button>
                ))}
              </div>
            )}

            <div className="ch-input-area">
              <div className="ch-input-row">
                <textarea
                  ref={textareaRef}
                  className="ch-textarea"
                  rows={1}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Ask about this document…"
                  disabled={streaming}
                  autoComplete="off"
                />
                <button className="ch-send-btn" onClick={() => send()} disabled={streaming || !input.trim()} aria-label="Send">
                  {streaming ? (
                    <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "pvw-spin .7s linear infinite" }} />
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M13 1L1 7l4 2m8-8L7 13l-2-4m8-8L5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

        </div>{/* end vw-center */}

        {/* ── RIGHT: INSIGHTS / COMPARE ────────────────────────────────────── */}
        {rightTab && (
          <div className="vw-right-panel">
            {/* Tabs */}
            <div className="vw-right-tabs">
              <button
                className={`vw-right-tab${rightTab === "insights" ? " active" : ""}`}
                onClick={() => { setRightTab("insights"); if (!insights && !insightsLoad) loadInsights(); }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Insights
              </button>
              <button
                className={`vw-right-tab${rightTab === "compare" ? " active" : ""}`}
                onClick={() => setRightTab("compare")}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="18" rx="1"/>
                </svg>
                Compare
              </button>
              <button className="vw-right-close" onClick={() => setRightTab(null)} title="Close">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* ── Insights tab ─────────────────────────────────── */}
            {rightTab === "insights" && (
              <div className="vw-right-body">
                {insightsLoad && (
                  <div className="vw-right-loading">
                    <div className="vw-url-spinner" />
                    <span>Analysing document…</span>
                  </div>
                )}
                {insightsErr && !insightsLoad && (
                  <div className="vw-right-err">
                    {insightsErr}
                    <button className="vw-right-retry" onClick={loadInsights}>Retry</button>
                  </div>
                )}
                {!insights && !insightsLoad && !insightsErr && (
                  <div className="vw-right-loading">
                    <div className="vw-url-spinner" />
                    <span>Generating insights…</span>
                  </div>
                )}
                {insights && (
                  <>
                    <div className="vw-right-section">
                      <div className="vw-right-section-label">Summary</div>
                      <p className="vw-right-summary">{insights.summary}</p>
                    </div>
                    {insights.key_points?.length > 0 && (
                      <div className="vw-right-section">
                        <div className="vw-right-section-label">Key Points</div>
                        <ul className="vw-right-list">
                          {insights.key_points.map((pt, i) => (
                            <li key={i} className="vw-right-list-item">{pt}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {insights.suggested_questions?.length > 0 && (
                      <div className="vw-right-section">
                        <div className="vw-right-section-label">Ask the AI</div>
                        <div className="vw-right-chips">
                          {insights.suggested_questions.map((q, i) => (
                            <button
                              key={i}
                              className="vw-right-chip"
                              onClick={() => { send(q); }}
                              disabled={streaming}
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── Compare tab ──────────────────────────────────── */}
            {rightTab === "compare" && (
              <div className="vw-right-body">
                <div className="vw-right-section">
                  <div className="vw-right-section-label">Current document</div>
                  <div className="vw-compare-current">
                    <FileIcon size={12} />
                    <span>{fileName.replace(/\.pdf$/i, "")}</span>
                  </div>
                </div>

                <div className="vw-right-section">
                  <div className="vw-right-section-label">Compare with</div>
                  {otherDocs.length === 0 ? (
                    <p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.5 }}>
                      Upload another document to enable comparison.
                    </p>
                  ) : (
                    <div className="vw-compare-list">
                      {otherDocs.map(doc => (
                        <button
                          key={doc.id}
                          className={`vw-compare-doc${compareDocId === doc.id ? " selected" : ""}`}
                          onClick={() => setCompareDocId(doc.id)}
                        >
                          <FileIcon size={12} />
                          <span>{doc.file_name.replace(/\.pdf$/i, "")}</span>
                          {compareDocId === doc.id && (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: "auto", flexShrink: 0 }}>
                              <path d="M2 6l3 3 5-5" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {compareDocId && (
                  <div className="vw-right-section">
                    <div className="vw-right-section-label">Question (optional)</div>
                    <input
                      className="vw-compare-input"
                      value={compareQ}
                      onChange={e => setCompareQ(e.target.value)}
                      placeholder="e.g. Compare the financial figures"
                    />
                    <button
                      className="vw-compare-btn"
                      onClick={runCompare}
                      disabled={compareLoad}
                    >
                      {compareLoad ? "Comparing…" : "Compare documents"}
                    </button>
                  </div>
                )}

                {compareErr && (
                  <div className="vw-right-err">{compareErr}</div>
                )}

                {compareResult && (
                  <div className="vw-right-section">
                    <div className="vw-right-section-label">
                      {compareResult.doc1.name} vs {compareResult.doc2.name}
                    </div>
                    <div className="vw-compare-result">
                      {renderMarkdown(compareResult.result)}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </div>{/* end vw-panels */}
    </div>
  );
}

export default function ViewerPage() {
  return (
    <Suspense
      fallback={
        <div className="vw-root" style={{ alignItems: "center", justifyContent: "center" }}>
          <div className="vw-url-loading">
            <div className="vw-url-spinner" />
            <span>Opening document…</span>
          </div>
        </div>
      }
    >
      <ViewerContent />
    </Suspense>
  );
}
