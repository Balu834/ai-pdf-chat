"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAgent } from "@/hooks/useAgent";
import { useMic } from "@/hooks/useMic";

// ── Tool metadata ─────────────────────────────────────────────────────────────
const TOOL_META = {
  search_document:       { icon: "🔍", label: "Search document"   },
  web_search:            { icon: "🌐", label: "Search web"        },
  calculate:             { icon: "🧮", label: "Calculate"         },
  get_current_datetime:  { icon: "🕐", label: "Get time"          },
  summarize_document:    { icon: "📄", label: "Summarise"         },
  send_email:            { icon: "📧", label: "Send email"        },
  create_calendar_event: { icon: "📅", label: "Create event"      },
  send_slack_message:    { icon: "💬", label: "Post to Slack"     },
  create_notion_page:    { icon: "📝", label: "Create Notion page" },
  list_jobs:             { icon: "📋", label: "Check jobs"        },
  schedule_reminder:     { icon: "⏰", label: "Set reminder"      },
  search_emails:         { icon: "📬", label: "Search emails"     },
  list_calendar_events:  { icon: "🗓",  label: "Check calendar"   },
  search_notion:         { icon: "🗃",  label: "Search Notion"    },
};

// ── CSS injection ─────────────────────────────────────────────────────────────
let cssInjected = false;
function InjectCSS() {
  useEffect(() => {
    if (cssInjected || typeof document === "undefined") return;
    cssInjected = true;
    const s = document.createElement("style");
    s.textContent = `
      @keyframes ac-pulse   { 0%,100%{opacity:.55} 50%{opacity:1} }
      @keyframes ac-spin    { to{transform:rotate(360deg)} }
      @keyframes ac-cursor  { 0%,100%{opacity:1} 50%{opacity:0} }
      @keyframes ac-slide   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
      .ac-scroll::-webkit-scrollbar       { width:4px }
      .ac-scroll::-webkit-scrollbar-track { background:transparent }
      .ac-scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1);border-radius:4px }
    `;
    document.head.appendChild(s);
  }, []);
  return null;
}

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner({ size = 14, color = "#a78bfa" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ animation: "ac-spin 0.8s linear infinite", flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2.5" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// ── Tool execution card ───────────────────────────────────────────────────────
function ToolCard({ call }) {
  const [expanded, setExpanded] = useState(false);
  const meta    = TOOL_META[call.name] ?? { icon: "⚙️", label: call.name };
  const running = call.status === "running";
  const hasErr  = call.status === "error";

  const argsStr = Object.entries(call.args ?? {})
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join("  ·  ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        borderRadius:  10,
        border:        hasErr ? "1px solid rgba(239,68,68,0.3)" : running ? "1px solid rgba(167,139,250,0.25)" : "1px solid rgba(255,255,255,0.09)",
        background:    hasErr ? "rgba(239,68,68,0.06)" : running ? "rgba(167,139,250,0.07)" : "rgba(255,255,255,0.03)",
        overflow:      "hidden",
        marginBottom:  4,
      }}
    >
      {/* Header row */}
      <div
        onClick={() => !running && call.result && setExpanded((e) => !e)}
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", cursor: !running && call.result ? "pointer" : "default" }}
      >
        {running ? <Spinner size={13} /> : (
          <span style={{ fontSize: 13, lineHeight: 1 }}>{meta.icon}</span>
        )}
        <span style={{ fontSize: 12, fontWeight: 600, color: hasErr ? "#fca5a5" : running ? "#c4b5fd" : "rgba(240,240,248,0.72)", flex: 1 }}>
          {meta.label}
          {argsStr && <span style={{ fontWeight: 400, color: "rgba(240,240,248,0.35)", marginLeft: 6 }}>{argsStr}</span>}
        </span>
        {!running && (
          <span style={{ fontSize: 10, color: "rgba(240,240,248,0.28)" }}>
            {hasErr ? "failed" : call.ms != null ? `${call.ms}ms` : ""}
            {call.result && <span style={{ marginLeft: 6 }}>{expanded ? "▲" : "▼"}</span>}
          </span>
        )}
      </div>

      {/* Expanded result */}
      <AnimatePresence>
        {expanded && call.result && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "0 12px 10px", fontSize: 11.5, color: "rgba(240,240,248,0.52)", lineHeight: 1.6, whiteSpace: "pre-wrap", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 8, marginTop: 2 }}>
              {call.result.length > 600 ? call.result.slice(0, 600) + "…" : call.result}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Confirmation card (sensitive action requires user approval) ───────────────
function ConfirmCard({ action, onConfirm }) {
  const [state, setState] = useState("idle"); // idle | loading | done
  const meta = TOOL_META[action.tool] ?? { icon: "⚙️", label: action.tool };

  async function handle(approved) {
    if (!action.jobId) return;
    setState("loading");
    try {
      await fetch(`/api/jobs/${action.jobId}/confirm`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved }),
      });
      setState(approved ? "approved" : "rejected");
      onConfirm?.(action.jobId, approved);
    } catch { setState("idle"); }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      style={{
        borderRadius: 12, border: "1px solid rgba(251,191,36,0.3)",
        background: "rgba(251,191,36,0.05)", padding: "12px 14px", marginBottom: 4,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 14 }}>{meta.icon}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#fbbf24" }}>Action requires your approval</span>
      </div>
      <div style={{ fontSize: 12.5, color: "rgba(240,240,248,0.8)", marginBottom: 12, lineHeight: 1.5 }}>
        {action.preview}
      </div>
      {state === "idle" && action.jobId && (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => handle(true)}
            style={{
              background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)",
              color: "#34d399", padding: "6px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}
          >
            Approve
          </button>
          <button
            onClick={() => handle(false)}
            style={{
              background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)",
              color: "#f87171", padding: "6px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}
          >
            Reject
          </button>
        </div>
      )}
      {state === "loading" && <span style={{ fontSize: 12, color: "rgba(240,240,248,0.4)" }}>Processing…</span>}
      {state === "approved" && <span style={{ fontSize: 12, color: "#34d399", fontWeight: 600 }}>✓ Approved — job queued</span>}
      {state === "rejected" && <span style={{ fontSize: 12, color: "#f87171", fontWeight: 600 }}>✕ Rejected — action cancelled</span>}
      {!action.jobId && (
        <span style={{ fontSize: 11, color: "rgba(240,240,248,0.35)" }}>Job ID unavailable — confirm via Task Queue</span>
      )}
    </motion.div>
  );
}

// ── User bubble ───────────────────────────────────────────────────────────────
function UserBubble({ content }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", animation: "ac-slide 0.2s ease" }}>
      <div style={{
        maxWidth: "78%", padding: "10px 14px", borderRadius: "16px 16px 4px 16px",
        background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.25)",
        fontSize: 13.5, lineHeight: 1.65, color: "rgba(240,240,248,0.9)",
      }}>
        {content}
      </div>
    </div>
  );
}

// ── Assistant message ─────────────────────────────────────────────────────────
function AssistantBubble({ msg }) {
  const hasTools    = msg.toolCalls.length > 0;
  const hasConfirms = (msg.confirms ?? []).length > 0;
  const hasText     = msg.content.length > 0;
  const streaming   = msg.isStreaming;
  const thinking    = streaming && !hasTools && !hasConfirms && !hasText;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, animation: "ac-slide 0.2s ease" }}>
      {thinking && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 4px" }}>
          <Spinner size={14} />
          <span style={{ fontSize: 12, color: "rgba(240,240,248,0.4)", animation: "ac-pulse 1.4s ease infinite" }}>
            Agent is thinking…
          </span>
        </div>
      )}

      {hasTools && (
        <div>
          {msg.toolCalls.map((tc) => <ToolCard key={tc.id} call={tc} />)}
        </div>
      )}

      {/* Confirmation cards for sensitive actions */}
      {hasConfirms && (
        <div>
          {msg.confirms.map((c, i) => <ConfirmCard key={c.jobId ?? i} action={c} />)}
        </div>
      )}

      {hasText && (
        <div style={{
          maxWidth: "88%", padding: "10px 14px", borderRadius: "16px 16px 16px 4px",
          background: "rgba(52,211,153,0.07)", border: "1px solid rgba(52,211,153,0.16)",
          fontSize: 13.5, lineHeight: 1.7, color: "rgba(240,240,248,0.9)",
        }}>
          {msg.content}
          {streaming && (
            <span style={{ display: "inline-block", width: 2, height: "0.9em", background: "#34d399", marginLeft: 3, borderRadius: 2, verticalAlign: "text-bottom", animation: "ac-cursor 0.55s steps(1) infinite" }} />
          )}
        </div>
      )}
    </div>
  );
}

// ── Suggested prompts ─────────────────────────────────────────────────────────
const SUGGESTIONS = [
  { icon: "📊", text: "Summarise this document" },
  { icon: "🔢", text: "Extract all numbers and amounts" },
  { icon: "🌐", text: "Search web for latest AI news" },
  { icon: "🧮", text: "What is 15% of 48500?" },
];

// ── Main component ────────────────────────────────────────────────────────────
export default function AgentChat({ fileUrl, lang = "en-US" }) {
  const agent    = useAgent({ fileUrl });
  const [input,  setInput]  = useState("");
  const listRef  = useRef(null);
  const inputRef = useRef(null);

  const mic = useMic({
    lang,
    onTranscript: (text, isFinal) => {
      setInput(text);
      if (isFinal && text.trim()) {
        setInput("");
        agent.send(text.trim());
      }
    },
    onError: (msg) => agent.clearError(), // suppress — show via agent error
  });

  // Auto-scroll to bottom
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [agent.messages]);

  // Focus input after send
  useEffect(() => {
    if (!agent.isRunning) inputRef.current?.focus();
  }, [agent.isRunning]);

  function handleSend() {
    const text = input.trim();
    if (!text || agent.isRunning) return;
    setInput("");
    agent.send(text);
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  const isEmpty = agent.messages.length === 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "rgba(10,8,24,0.6)", position: "relative" }}>
      <InjectCSS />

      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: "linear-gradient(135deg,rgba(167,139,250,0.35),rgba(96,165,250,0.28))",
            border: "1px solid rgba(167,139,250,0.28)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
          }}>
            ◈
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(240,240,248,0.85)", lineHeight: 1.2 }}>AI Agent</div>
            <div style={{ fontSize: 10, color: "rgba(240,240,248,0.3)", lineHeight: 1.3 }}>
              Tools: search · web · calculate · datetime · summarise
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Tool indicator pills */}
          {agent.isRunning && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 99, background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.22)" }}>
              <Spinner size={10} />
              <span style={{ fontSize: 10, color: "#c4b5fd", fontWeight: 600 }}>Running</span>
            </div>
          )}
          {agent.messages.length > 0 && (
            <motion.button
              onClick={agent.clear}
              whileHover={{ scale: 1.06, background: "rgba(255,255,255,0.07)" }}
              whileTap={{ scale: 0.94 }}
              style={{ padding: "5px 12px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", fontSize: 11, color: "rgba(240,240,248,0.38)", transition: "all 0.15s" }}
            >
              Clear
            </motion.button>
          )}
        </div>
      </div>

      {/* ── Error banner ── */}
      <AnimatePresence>
        {agent.error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            onClick={agent.clearError}
            style={{ margin: "8px 16px 0", padding: "8px 14px", borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", fontSize: 12, color: "#fca5a5", cursor: "pointer" }}
          >
            {agent.error} &nbsp;✕
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Message list ── */}
      <div ref={listRef} className="ac-scroll" style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Empty state */}
        {isEmpty && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, paddingTop: 40 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>◈</div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "rgba(240,240,248,0.72)", marginBottom: 6 }}>AI Agent Ready</h3>
              <p style={{ margin: 0, fontSize: 12.5, color: "rgba(240,240,248,0.35)", lineHeight: 1.6, maxWidth: 340, textAlign: "center" }}>
                Ask anything. The agent will pick the right tools and reason step-by-step to give you accurate answers.
              </p>
            </div>

            {/* Suggestion chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 420 }}>
              {SUGGESTIONS.map((s) => (
                <motion.button
                  key={s.text}
                  onClick={() => { setInput(s.text); inputRef.current?.focus(); }}
                  whileHover={{ scale: 1.04, borderColor: "rgba(167,139,250,0.4)", color: "rgba(240,240,248,0.75)" }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    padding: "7px 13px", borderRadius: 99, cursor: "pointer",
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)",
                    fontSize: 12, color: "rgba(240,240,248,0.45)", display: "flex", alignItems: "center", gap: 6,
                    transition: "all 0.15s",
                  }}
                >
                  <span>{s.icon}</span>{s.text}
                </motion.button>
              ))}
            </div>

            {/* Capabilities */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, width: "100%", maxWidth: 440 }}>
              {[
                { icon: "🔍", title: "Document Q&A",  desc: "RAG-powered semantic search in your PDFs" },
                { icon: "🌐", title: "Web Search",     desc: "Live internet results via Serper or Brave"  },
                { icon: "🧮", title: "Calculator",     desc: "Safe math eval — arithmetic to percentages"  },
                { icon: "📄", title: "Summarisation",  desc: "Full document summary with key insights"     },
              ].map((c) => (
                <div key={c.title} style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                    <span style={{ fontSize: 14 }}>{c.icon}</span>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: "rgba(240,240,248,0.6)" }}>{c.title}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 10.5, color: "rgba(240,240,248,0.28)", lineHeight: 1.5 }}>{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {agent.messages.map((msg) =>
          msg.role === "user"
            ? <UserBubble key={msg.id} content={msg.content} />
            : <AssistantBubble key={msg.id} msg={msg} />
        )}
      </div>

      {/* ── Input bar ── */}
      <div style={{ padding: "12px 16px 16px", borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        <div style={{
          display: "flex", alignItems: "flex-end", gap: 8,
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 14, padding: "8px 10px 8px 14px",
          transition: "border-color 0.15s",
        }}>
          {/* Textarea */}
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask anything — I'll use tools to find the answer…"
            disabled={agent.isRunning}
            rows={1}
            style={{
              flex: 1, background: "none", border: "none", outline: "none", resize: "none",
              fontSize: 13.5, color: "rgba(240,240,248,0.88)", lineHeight: 1.55,
              fontFamily: "inherit", maxHeight: 120, overflowY: "auto",
              placeholder: "color: rgba(240,240,248,0.3)",
              opacity: agent.isRunning ? 0.5 : 1,
            }}
            onInput={(e) => {
              // Auto-grow
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = Math.min(el.scrollHeight, 120) + "px";
            }}
          />

          {/* Mic button */}
          <motion.button
            onClick={mic.toggle}
            disabled={agent.isRunning}
            whileHover={!agent.isRunning ? { scale: 1.08 } : {}}
            whileTap={!agent.isRunning ? { scale: 0.92 } : {}}
            style={{
              width: 34, height: 34, borderRadius: 9, flexShrink: 0,
              border: mic.isListening ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.1)",
              background: mic.isListening ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.06)",
              cursor: agent.isRunning ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: mic.isListening ? "#f87171" : "rgba(240,240,248,0.5)",
              boxShadow: mic.isListening ? "0 0 0 3px rgba(239,68,68,0.15)" : "none",
              transition: "all 0.15s",
            }}
          >
            {mic.isRequesting ? <Spinner size={14} color="#a78bfa" /> : (
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="9" y="2" width="6" height="12" rx="3" fill={mic.isListening ? "rgba(239,68,68,0.2)" : "none"} stroke="currentColor" strokeWidth="2"/>
                <path strokeLinecap="round" d="M5 10a7 7 0 0014 0"/>
                <line x1="12" y1="19" x2="12" y2="22" strokeLinecap="round"/>
                <line x1="9" y1="22" x2="15" y2="22" strokeLinecap="round"/>
              </svg>
            )}
          </motion.button>

          {/* Send / Stop button */}
          <motion.button
            onClick={agent.isRunning ? agent.stop : handleSend}
            disabled={!agent.isRunning && !input.trim()}
            whileHover={agent.isRunning || input.trim() ? { scale: 1.06 } : {}}
            whileTap={agent.isRunning || input.trim() ? { scale: 0.94 } : {}}
            style={{
              width: 34, height: 34, borderRadius: 9, flexShrink: 0,
              border: "none", cursor: agent.isRunning || input.trim() ? "pointer" : "not-allowed",
              background: agent.isRunning
                ? "rgba(239,68,68,0.2)"
                : input.trim()
                  ? "linear-gradient(135deg,rgba(167,139,250,0.85),rgba(96,165,250,0.8))"
                  : "rgba(255,255,255,0.06)",
              display: "flex", alignItems: "center", justifyContent: "center",
              opacity: !agent.isRunning && !input.trim() ? 0.35 : 1,
              transition: "all 0.15s",
            }}
          >
            {agent.isRunning ? (
              <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24" style={{ color: "#f87171" }}>
                <rect x="4" y="4" width="16" height="16" rx="2"/>
              </svg>
            ) : (
              <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            )}
          </motion.button>
        </div>

        {/* Hints */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 7, paddingInline: 2 }}>
          <span style={{ fontSize: 10, color: "rgba(240,240,248,0.2)" }}>
            Enter to send · Shift+Enter for new line
          </span>
          {fileUrl && (
            <span style={{ fontSize: 10, color: "rgba(52,211,153,0.5)", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#34d399", display: "inline-block" }} />
              Document loaded
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
