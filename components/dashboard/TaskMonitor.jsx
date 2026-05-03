"use client";

import { useEffect, useState, useCallback, useRef } from "react";

const C = {
  bg:          "#0f1117",
  card:        "#16181f",
  border:      "rgba(255,255,255,0.07)",
  textPrimary: "#f0f2f5",
  textMuted:   "rgba(240,242,245,0.45)",
  accent:      "#6366f1",
  success:     "#34d399",
  error:       "#f87171",
  warn:        "#fbbf24",
};

const STATUS_META = {
  pending:                { color: C.textMuted, label: "Pending",     dot: "#6b7280" },
  running:                { color: "#60a5fa",   label: "Running",     dot: "#60a5fa" },
  awaiting_confirmation:  { color: C.warn,      label: "Needs OK",    dot: C.warn    },
  confirmed:              { color: "#a78bfa",   label: "Confirmed",   dot: "#a78bfa" },
  completed:              { color: C.success,   label: "Done",        dot: C.success },
  failed:                 { color: C.error,     label: "Failed",      dot: C.error   },
  cancelled:              { color: C.textMuted, label: "Cancelled",   dot: "#4b5563" },
};

const TOOL_ICONS = {
  send_email:            "📧",
  create_calendar_event: "📅",
  send_slack_message:    "💬",
  create_notion_page:    "📝",
  pipeline:              "⚙️",
  summarize_and_send:    "📤",
};

function Dot({ status }) {
  const meta = STATUS_META[status] ?? STATUS_META.pending;
  return (
    <span style={{
      width: 7, height: 7, borderRadius: "50%", background: meta.dot,
      display: "inline-block", flexShrink: 0,
      animation: status === "running" ? "tm-pulse 1.2s ease-in-out infinite" : "none",
    }} />
  );
}

function LogLine({ log }) {
  const color = log.level === "error" ? C.error : log.level === "warn" ? C.warn : C.textMuted;
  const prefix = log.level === "error" ? "✕" : log.level === "warn" ? "⚠" : "›";
  return (
    <div style={{ fontSize: 11, color, display: "flex", gap: 6, padding: "2px 0" }}>
      <span style={{ opacity: 0.5 }}>{new Date(log.created_at).toLocaleTimeString()}</span>
      <span>{prefix}</span>
      <span>{log.message}</span>
    </div>
  );
}

function JobCard({ job, onConfirm, onCancel, onExpand, expanded }) {
  const meta = STATUS_META[job.status] ?? STATUS_META.pending;
  const icon = TOOL_ICONS[job.type] ?? "🔧";

  return (
    <div style={{
      background: C.card, border: `1px solid ${job.status === "awaiting_confirmation" ? "rgba(251,191,36,0.3)" : C.border}`,
      borderRadius: 12, overflow: "hidden",
    }}>
      <div
        style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
        onClick={onExpand}
      >
        <span style={{ fontSize: 16 }}>{icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {job.name}
          </div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 1 }}>
            {new Date(job.created_at).toLocaleString()}
            {job.retries > 0 && ` · Retry ${job.retries}/${job.max_retries}`}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <Dot status={job.status} />
          <span style={{ fontSize: 11, fontWeight: 600, color: meta.color }}>{meta.label}</span>
        </div>
        <span style={{ fontSize: 11, color: C.textMuted, marginLeft: 4 }}>{expanded ? "▲" : "▼"}</span>
      </div>

      {/* Confirmation buttons */}
      {job.status === "awaiting_confirmation" && (
        <div style={{ padding: "0 16px 14px", display: "flex", gap: 8 }}>
          <button
            onClick={() => onConfirm(job.id, true)}
            style={{
              background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)",
              color: C.success, padding: "6px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}
          >
            Approve
          </button>
          <button
            onClick={() => onConfirm(job.id, false)}
            style={{
              background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)",
              color: C.error, padding: "6px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}
          >
            Reject
          </button>
        </div>
      )}

      {/* Cancel button for pending */}
      {job.status === "pending" && (
        <div style={{ padding: "0 16px 14px" }}>
          <button
            onClick={() => onCancel(job.id)}
            style={{
              background: "transparent", border: `1px solid ${C.border}`,
              color: C.textMuted, padding: "4px 12px", borderRadius: 6, fontSize: 11, cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Expanded: logs + result */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${C.border}`, padding: "12px 16px" }}>
          {job.error && (
            <div style={{ fontSize: 12, color: C.error, marginBottom: 8 }}>Error: {job.error}</div>
          )}
          {job.result && (
            <div style={{
              fontSize: 11, color: C.textMuted, background: "rgba(255,255,255,0.03)",
              borderRadius: 6, padding: "8px 10px", marginBottom: 8, fontFamily: "monospace", wordBreak: "break-all",
            }}>
              {JSON.stringify(job.result, null, 2)}
            </div>
          )}
          {(job.logs ?? []).length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {job.logs.map((l) => <LogLine key={l.id} log={l} />)}
            </div>
          )}
          {!(job.logs ?? []).length && !job.result && !job.error && (
            <div style={{ fontSize: 12, color: C.textMuted }}>No logs yet.</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TaskMonitor() {
  const [jobs,     setJobs]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [filter,   setFilter]   = useState("all");
  const pollRef                  = useRef(null);

  const load = useCallback(async () => {
    try {
      const url = filter === "all" ? "/api/jobs" : `/api/jobs?status=${filter}`;
      const res  = await fetch(url, { credentials: "include" });
      const data = await res.json();
      setJobs(data.jobs ?? []);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
    pollRef.current = setInterval(load, 5000);
    return () => clearInterval(pollRef.current);
  }, [load]);

  async function handleConfirm(jobId, approved) {
    const res = await fetch(`/api/jobs/${jobId}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ approved }),
    });
    if (res.ok) load();
  }

  async function handleCancel(jobId) {
    await fetch(`/api/jobs/${jobId}`, { method: "DELETE", credentials: "include" });
    load();
  }

  async function triggerWorker() {
    await fetch("/api/jobs/worker", { method: "POST", credentials: "include" });
    setTimeout(load, 1200);
  }

  const displayed = jobs.filter((j) => filter === "all" || j.status === filter);

  const counts = jobs.reduce((acc, j) => { acc[j.status] = (acc[j.status] ?? 0) + 1; return acc; }, {});
  const needsAction = counts["awaiting_confirmation"] ?? 0;

  const FILTERS = ["all", "awaiting_confirmation", "running", "pending", "completed", "failed"];

  return (
    <div style={{ padding: "24px 0", maxWidth: 700 }}>
      <style>{`@keyframes tm-pulse{0%,100%{opacity:.5}50%{opacity:1}}`}</style>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: C.textPrimary, margin: 0 }}>Task Queue</h2>
          <p style={{ fontSize: 12, color: C.textMuted, margin: "4px 0 0" }}>
            Background jobs · {jobs.length} total
            {needsAction > 0 && (
              <span style={{ marginLeft: 8, color: C.warn, fontWeight: 600 }}>
                {needsAction} need{needsAction === 1 ? "s" : ""} approval
              </span>
            )}
          </p>
        </div>
        <button
          onClick={triggerWorker}
          style={{
            background: "rgba(99,102,241,0.1)", border: `1px solid rgba(99,102,241,0.25)`,
            color: C.accent, padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}
        >
          Run worker
        </button>
      </div>

      {/* Filter pills */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer",
              background: filter === f ? C.accent : "rgba(255,255,255,0.04)",
              border: filter === f ? "none" : `1px solid ${C.border}`,
              color: filter === f ? "#fff" : C.textMuted,
            }}
          >
            {f === "awaiting_confirmation" ? "Needs OK" : f.charAt(0).toUpperCase() + f.slice(1)}
            {counts[f] ? ` (${counts[f]})` : f === "all" ? ` (${jobs.length})` : ""}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: C.textMuted, fontSize: 13 }}>Loading…</div>
      ) : displayed.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "48px 16px",
          color: C.textMuted, fontSize: 13, border: `1px dashed ${C.border}`, borderRadius: 12,
        }}>
          No jobs found. Ask the agent to send an email, create a calendar event, or run a multi-step pipeline.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {displayed.map((j) => (
            <JobCard
              key={j.id}
              job={j}
              onConfirm={handleConfirm}
              onCancel={handleCancel}
              expanded={expanded === j.id}
              onExpand={() => setExpanded((prev) => prev === j.id ? null : j.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
