"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState, useRef, useEffect, useCallback } from "react";

/* ── Suggestion chips ─────────────────────────────────────────────────────── */
const CHIPS = [
  "Summarise this document",
  "What are the key numbers?",
  "Any risks mentioned?",
  "Suggest follow-up questions",
];

/* ── Viewer content ───────────────────────────────────────────────────────── */
function ViewerContent() {
  const router         = useRouter();
  const searchParams   = useSearchParams();
  const fileUrl        = searchParams.get("url");

  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState("");
  const [streaming, setStreaming] = useState(false);
  const [chatError, setChatError] = useState(null);

  const endRef    = useRef(null);
  const inputRef  = useRef(null);
  const abortRef  = useRef(null);

  const fileName = fileUrl
    ? decodeURIComponent(fileUrl.split("/").pop().split("?")[0]).replace(/^\d+-/, "")
    : "Document";

  useEffect(() => {
    if (messages.length > 0) {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [messages, streaming]);

  const send = useCallback(async (question) => {
    const q = (question ?? input).trim();
    if (!q || streaming || !fileUrl) return;

    setInput("");
    setChatError(null);
    setMessages(m => [...m, { role: "user", text: q }]);
    setStreaming(true);

    // Abort previous stream if any
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q, fileUrl }),
        credentials: "include",
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setChatError(data.error || `Error ${res.status}`);
        setMessages(m => m.slice(0, -1));
        return;
      }

      // SSE streaming
      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      setMessages(m => [...m, { role: "ai", text: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6);
          if (payload === "[DONE]") break;
          full += payload.replace(/\\n/g, "\n");
          setMessages(m => {
            const copy = [...m];
            copy[copy.length - 1] = { role: "ai", text: full };
            return copy;
          });
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setChatError("Connection lost. Please try again.");
      }
    } finally {
      setStreaming(false);
    }
  }, [input, streaming, fileUrl]);

  if (!fileUrl) {
    return (
      <div style={S.noUrl}>
        <p style={{ fontFamily: "var(--font-fraunces, Georgia, serif)", fontStyle: "italic", fontSize: "18px", marginBottom: "16px" }}>
          No PDF URL provided.
        </p>
        <button style={S.backBtn} onClick={() => router.push("/dashboard")}>← Back to Reading Room</button>
      </div>
    );
  }

  return (
    <div style={S.root}>
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div style={S.topbar}>
        <button style={S.backBtn} onClick={() => router.push("/dashboard")}>
          ← Reading Room
        </button>
        <span style={S.docTitle}>{fileName}</span>
        <a href={fileUrl} target="_blank" rel="noreferrer" style={S.dlLink}>
          Download ↓
        </a>
      </div>

      {/* ── Split panels ─────────────────────────────────────────────────── */}
      <div style={S.panels}>

        {/* PDF panel */}
        <div style={S.pdfPanel}>
          <iframe
            src={fileUrl}
            title={fileName}
            style={S.iframe}
          />
        </div>

        {/* Chat panel */}
        <div style={S.chatPanel}>
          <div style={S.chatHdr}>
            <span style={S.chatHdrTitle}>Ask this document</span>
            {messages.length > 0 && (
              <button style={S.clearBtn} onClick={() => { setMessages([]); setChatError(null); }}>
                Clear
              </button>
            )}
          </div>

          {/* Messages */}
          <div style={S.msgs}>
            {messages.length === 0 && !streaming && (
              <div style={S.empty}>
                <div style={S.emptyIcon}>📄</div>
                <div style={S.emptyText}>Ask anything about this document</div>
                <div style={S.emptyHint}>Citations and sources included</div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} style={m.role === "user" ? S.msgUser : S.msgAi}>
                {m.role === "ai" && (
                  <div style={S.aiLabel}>Intellixy</div>
                )}
                <div style={S.msgText}>
                  {m.text.split("\n").map((line, j) => (
                    <span key={j}>
                      {line}
                      {j < m.text.split("\n").length - 1 && <br />}
                    </span>
                  ))}
                  {streaming && i === messages.length - 1 && m.role === "ai" && (
                    <span style={S.cursor}>▋</span>
                  )}
                </div>
              </div>
            ))}

            {chatError && (
              <div style={S.errMsg}>{chatError}</div>
            )}

            <div ref={endRef} />
          </div>

          {/* Chips */}
          {messages.length === 0 && (
            <div style={S.chips}>
              {CHIPS.map(c => (
                <button
                  key={c}
                  style={S.chip}
                  onClick={() => send(c)}
                  disabled={streaming}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={S.inputRow}>
            <input
              ref={inputRef}
              style={S.input}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="Ask a question about this document…"
              disabled={streaming}
              autoComplete="off"
            />
            <button
              style={{ ...S.sendBtn, ...(streaming || !input.trim() ? S.sendBtnDisabled : {}) }}
              onClick={() => send()}
              disabled={streaming || !input.trim()}
              aria-label="Send"
            >
              {streaming ? (
                <span style={S.dot}>·</span>
              ) : (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M13 1L1 7l4 2m8-8L7 13l-2-4m8-8L5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes dotPulse { 0%,80%,100%{transform:scale(1);opacity:.5} 40%{transform:scale(1.4);opacity:1} }
      `}</style>
    </div>
  );
}

/* ── Styles ───────────────────────────────────────────────────────────────── */
const S = {
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    background: "var(--paper, #faf6ef)",
    color: "var(--ink, #1a1814)",
    fontFamily: "var(--font-inter, Inter, -apple-system, sans-serif)",
    isolation: "isolate",
  },
  noUrl: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    background: "var(--paper, #faf6ef)",
    gap: "8px",
  },
  topbar: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "10px 20px",
    background: "var(--paper-2, #f3ede1)",
    borderBottom: "1.5px solid var(--ink, #1a1814)",
    flexShrink: 0,
  },
  backBtn: {
    fontFamily: "var(--font-mono, monospace)",
    fontSize: "11px",
    letterSpacing: ".08em",
    textTransform: "uppercase",
    color: "var(--ink-faint, #8a8378)",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "0",
    flexShrink: 0,
  },
  docTitle: {
    flex: 1,
    fontFamily: "var(--font-fraunces, Georgia, serif)",
    fontStyle: "italic",
    fontSize: "15px",
    color: "var(--ink, #1a1814)",
    fontVariationSettings: "'SOFT' 40",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    textAlign: "center",
  },
  dlLink: {
    fontFamily: "var(--font-mono, monospace)",
    fontSize: "10px",
    letterSpacing: ".08em",
    textTransform: "uppercase",
    color: "var(--accent, #b8552d)",
    textDecoration: "none",
    flexShrink: 0,
  },
  panels: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  },
  pdfPanel: {
    flex: "0 0 58%",
    borderRight: "1.5px solid var(--ink, #1a1814)",
    overflow: "hidden",
    background: "#fff",
  },
  iframe: {
    width: "100%",
    height: "100%",
    border: "none",
    display: "block",
  },
  chatPanel: {
    flex: "0 0 42%",
    display: "flex",
    flexDirection: "column",
    background: "var(--paper, #faf6ef)",
    overflow: "hidden",
  },
  chatHdr: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 18px 10px",
    borderBottom: "1px solid var(--rule, #d9d1bf)",
    flexShrink: 0,
  },
  chatHdrTitle: {
    fontFamily: "var(--font-fraunces, Georgia, serif)",
    fontSize: "14px",
    fontVariationSettings: "'SOFT' 30",
    color: "var(--ink, #1a1814)",
  },
  clearBtn: {
    fontFamily: "var(--font-mono, monospace)",
    fontSize: "9px",
    letterSpacing: ".1em",
    textTransform: "uppercase",
    color: "var(--ink-faint, #8a8378)",
    background: "none",
    border: "1px solid var(--rule, #d9d1bf)",
    borderRadius: "2px",
    padding: "3px 7px",
    cursor: "pointer",
  },
  msgs: {
    flex: 1,
    overflowY: "auto",
    padding: "16px 18px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  empty: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    paddingTop: "40px",
    textAlign: "center",
  },
  emptyIcon: {
    fontSize: "28px",
    marginBottom: "4px",
  },
  emptyText: {
    fontFamily: "var(--font-fraunces, Georgia, serif)",
    fontStyle: "italic",
    fontSize: "15px",
    fontVariationSettings: "'SOFT' 50",
    color: "var(--ink-soft, #4a443d)",
  },
  emptyHint: {
    fontFamily: "var(--font-mono, monospace)",
    fontSize: "10px",
    letterSpacing: ".08em",
    textTransform: "uppercase",
    color: "var(--ink-faint, #8a8378)",
  },
  msgUser: {
    alignSelf: "flex-end",
    maxWidth: "85%",
    background: "var(--ink, #1a1814)",
    color: "var(--paper, #faf6ef)",
    padding: "10px 13px",
    borderRadius: "3px 3px 0 3px",
    fontSize: "13px",
    lineHeight: "1.6",
  },
  msgAi: {
    alignSelf: "flex-start",
    maxWidth: "92%",
    background: "var(--paper-3, #ede5d3)",
    border: "1px solid var(--rule, #d9d1bf)",
    padding: "10px 13px",
    borderRadius: "3px 3px 3px 0",
    fontSize: "13px",
    lineHeight: "1.7",
    color: "var(--ink-soft, #4a443d)",
  },
  aiLabel: {
    fontFamily: "var(--font-mono, monospace)",
    fontSize: "9px",
    letterSpacing: ".1em",
    textTransform: "uppercase",
    color: "var(--accent, #b8552d)",
    marginBottom: "5px",
  },
  msgText: {
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  cursor: {
    animation: "blink 1s infinite",
    color: "var(--accent, #b8552d)",
    fontWeight: "bold",
  },
  errMsg: {
    alignSelf: "center",
    background: "#fff0ee",
    border: "1px solid #f5c0b4",
    borderRadius: "3px",
    padding: "8px 12px",
    fontSize: "12px",
    color: "#b8552d",
    fontFamily: "var(--font-mono, monospace)",
    letterSpacing: ".04em",
  },
  chips: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    padding: "0 18px 12px",
  },
  chip: {
    fontFamily: "var(--font-mono, monospace)",
    fontSize: "10px",
    letterSpacing: ".05em",
    textTransform: "uppercase",
    border: "1px solid var(--rule, #d9d1bf)",
    borderRadius: "2px",
    padding: "4px 8px",
    color: "var(--ink-soft, #4a443d)",
    cursor: "pointer",
    background: "none",
    transition: "border-color .15s, color .15s",
  },
  inputRow: {
    display: "flex",
    gap: "8px",
    padding: "12px 18px 14px",
    borderTop: "1px solid var(--rule, #d9d1bf)",
    flexShrink: 0,
  },
  input: {
    flex: 1,
    border: "1.5px solid var(--rule, #d9d1bf)",
    background: "var(--paper-2, #f3ede1)",
    borderRadius: "3px",
    padding: "9px 12px",
    fontSize: "13px",
    fontFamily: "inherit",
    color: "var(--ink, #1a1814)",
    outline: "none",
  },
  sendBtn: {
    width: "36px",
    height: "36px",
    background: "var(--ink, #1a1814)",
    color: "var(--paper, #faf6ef)",
    border: "none",
    borderRadius: "3px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
    transition: "background .15s",
  },
  sendBtnDisabled: {
    opacity: .45,
    cursor: "default",
  },
  dot: {
    fontSize: "24px",
    lineHeight: 0,
    animation: "dotPulse .9s infinite ease-in-out",
  },
};

/* ── Export ───────────────────────────────────────────────────────────────── */
export default function ViewerPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#faf6ef", fontFamily: "Georgia, serif", fontStyle: "italic", color: "#8a8378" }}>
        Opening document…
      </div>
    }>
      <ViewerContent />
    </Suspense>
  );
}
