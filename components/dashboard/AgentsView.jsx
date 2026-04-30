"use client";
import { useState, useEffect, useCallback } from "react";
import { TOOL_LABELS } from "@/lib/tool-labels";

const TOOL_OPTIONS = Object.entries(TOOL_LABELS).map(([key, val]) => ({ key, ...val }));

const styles = {
  container: { padding: "24px 28px", maxWidth: 900 },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  title: { fontSize: 20, fontWeight: 700, color: "#f1f5f9", margin: 0 },
  sub: { fontSize: 13, color: "#94a3b8", marginTop: 4 },
  btn: {
    padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600,
    cursor: "pointer", border: "none", display: "flex", alignItems: "center", gap: 6,
  },
  btnPrimary: { background: "linear-gradient(135deg,#7c3aed,#6d28d9)", color: "#fff" },
  btnGhost: { background: "rgba(255,255,255,0.06)", color: "#cbd5e1", border: "1px solid rgba(255,255,255,0.1)" },
  btnDanger: { background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" },
  card: {
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12, padding: 20, marginBottom: 12,
  },
  agentName: { fontSize: 16, fontWeight: 600, color: "#f1f5f9", marginBottom: 4 },
  agentRole: { fontSize: 12, color: "#94a3b8", marginBottom: 8 },
  toolPill: {
    display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px",
    borderRadius: 20, fontSize: 11, fontWeight: 500, marginRight: 4, marginBottom: 4,
  },
  row: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  label: { fontSize: 12, color: "#94a3b8", display: "block", marginBottom: 6 },
  input: {
    width: "100%", padding: "8px 12px", borderRadius: 8,
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
    color: "#f1f5f9", fontSize: 13, boxSizing: "border-box", outline: "none",
  },
  textarea: {
    width: "100%", padding: "8px 12px", borderRadius: 8,
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
    color: "#f1f5f9", fontSize: 13, boxSizing: "border-box", outline: "none",
    resize: "vertical", minHeight: 80,
  },
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
  },
  modal: {
    background: "#1e293b", border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 16, padding: 28, width: "90%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto",
  },
  modalTitle: { fontSize: 17, fontWeight: 700, color: "#f1f5f9", marginBottom: 20 },
  formGroup: { marginBottom: 16 },
  empty: { textAlign: "center", padding: "48px 20px", color: "#64748b" },
  runBox: {
    marginTop: 16, padding: 16, borderRadius: 10,
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
  },
  resultBox: {
    marginTop: 12, padding: 14, borderRadius: 8,
    background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)",
    color: "#e2e8f0", fontSize: 13, whiteSpace: "pre-wrap", lineHeight: 1.6,
  },
  stat: { fontSize: 11, color: "#64748b", marginTop: 4 },
};

function ToolBadge({ toolKey }) {
  const info = TOOL_LABELS[toolKey];
  if (!info) return null;
  return (
    <span style={{ ...styles.toolPill, background: info.color + "22", color: info.color, border: `1px solid ${info.color}44` }}>
      {info.icon} {info.label}
    </span>
  );
}

function AgentCard({ agent, documents, onEdit, onDelete }) {
  const [task, setTask] = useState("");
  const [docId, setDocId] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [showRun, setShowRun] = useState(false);

  const handleRun = async () => {
    if (!task.trim()) return;
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch(`/api/agents/${agent.id}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, document_id: docId || undefined }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ status: "failed", error: "Network error" });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div style={styles.card}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={styles.agentName}>{agent.name}</div>
            {!agent.is_active && (
              <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: "rgba(148,163,184,0.1)", color: "#64748b" }}>
                Disabled
              </span>
            )}
          </div>
          <div style={styles.agentRole}>{agent.role}</div>
          <div style={styles.row}>
            {(agent.tools ?? []).map((t) => <ToolBadge key={t} toolKey={t} />)}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, marginLeft: 12 }}>
          <button style={{ ...styles.btn, ...styles.btnGhost, padding: "5px 12px" }} onClick={() => setShowRun((v) => !v)}>
            {showRun ? "Hide" : "Run"}
          </button>
          <button style={{ ...styles.btn, ...styles.btnGhost, padding: "5px 12px" }} onClick={() => onEdit(agent)}>
            Edit
          </button>
          <button style={{ ...styles.btn, ...styles.btnDanger, padding: "5px 12px" }} onClick={() => onDelete(agent.id)}>
            Delete
          </button>
        </div>
      </div>

      <div style={styles.stat}>{agent.runs_count} runs</div>

      {showRun && (
        <div style={styles.runBox}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Task</label>
            <textarea
              style={styles.textarea}
              placeholder="Describe what you want the agent to do..."
              value={task}
              onChange={(e) => setTask(e.target.value)}
              rows={3}
            />
          </div>
          {documents?.length > 0 && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Document (optional)</label>
              <select
                style={{ ...styles.input }}
                value={docId}
                onChange={(e) => setDocId(e.target.value)}
              >
                <option value="">No document</option>
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>{d.name || d.file_name}</option>
                ))}
              </select>
            </div>
          )}
          <button
            style={{ ...styles.btn, ...styles.btnPrimary, opacity: running ? 0.6 : 1 }}
            onClick={handleRun}
            disabled={running || !task.trim()}
          >
            {running ? "Running..." : "Run Agent"}
          </button>
          {result && (
            <div style={{ ...styles.resultBox, borderColor: result.status === "failed" ? "rgba(239,68,68,0.3)" : "rgba(124,58,237,0.2)" }}>
              {result.status === "failed" ? `Error: ${result.error}` : result.output}
              {result.tool_calls_log?.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 11, color: "#64748b" }}>
                  Tools used: {result.tool_calls_log.map((c) => c.tool).join(", ")} · {result.rounds} round{result.rounds !== 1 ? "s" : ""}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AgentModal({ agent, onClose, onSave }) {
  const [form, setForm] = useState({
    name: agent?.name ?? "",
    role: agent?.role ?? "General Assistant",
    instructions: agent?.instructions ?? "",
    tools: agent?.tools ?? [],
    is_active: agent?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);

  const toggleTool = (key) => {
    setForm((f) => ({
      ...f,
      tools: f.tools.includes(key) ? f.tools.filter((t) => t !== key) : [...f.tools, key],
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const url = agent ? `/api/agents/${agent.id}` : "/api/agents";
    const method = agent ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (data.agent) onSave(data.agent);
  };

  return (
    <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>
        <div style={styles.modalTitle}>{agent ? "Edit Agent" : "Create Agent"}</div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Agent Name *</label>
          <input style={styles.input} placeholder="e.g. Invoice Analyzer" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Role</label>
          <input style={styles.input} placeholder="e.g. Document specialist" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Instructions</label>
          <textarea style={styles.textarea} rows={4} placeholder="What should this agent do? Be specific about its behavior and output format." value={form.instructions} onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))} />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Tools</label>
          <div style={styles.row}>
            {TOOL_OPTIONS.map(({ key, label, icon, color }) => {
              const active = form.tools.includes(key);
              return (
                <button
                  key={key}
                  style={{
                    ...styles.toolPill,
                    cursor: "pointer", border: "none",
                    background: active ? color + "33" : "rgba(255,255,255,0.06)",
                    color: active ? color : "#94a3b8",
                    outline: active ? `1px solid ${color}66` : "none",
                    padding: "5px 12px",
                  }}
                  onClick={() => toggleTool(key)}
                >
                  {icon} {label}
                </button>
              );
            })}
          </div>
        </div>

        {agent && (
          <div style={{ ...styles.formGroup, display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              style={{ accentColor: "#7c3aed" }}
            />
            <label htmlFor="is_active" style={{ ...styles.label, margin: 0, cursor: "pointer" }}>Active</label>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
          <button style={{ ...styles.btn, ...styles.btnGhost }} onClick={onClose}>Cancel</button>
          <button
            style={{ ...styles.btn, ...styles.btnPrimary, opacity: saving ? 0.6 : 1 }}
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
          >
            {saving ? "Saving..." : agent ? "Save Changes" : "Create Agent"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AgentsView({ documents = [] }) {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editAgent, setEditAgent] = useState(null);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/agents");
    const data = await res.json();
    setAgents(data.agents ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  const handleSave = (agent) => {
    setAgents((prev) => {
      const idx = prev.findIndex((a) => a.id === agent.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = agent; return next; }
      return [agent, ...prev];
    });
    setShowModal(false);
    setEditAgent(null);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this agent?")) return;
    await fetch(`/api/agents/${id}`, { method: "DELETE" });
    setAgents((prev) => prev.filter((a) => a.id !== id));
  };

  const openCreate = () => { setEditAgent(null); setShowModal(true); };
  const openEdit = (agent) => { setEditAgent(agent); setShowModal(true); };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>AI Agents</h2>
          <p style={styles.sub}>Create agents that use tools to automate document tasks</p>
        </div>
        <button style={{ ...styles.btn, ...styles.btnPrimary }} onClick={openCreate}>
          + New Agent
        </button>
      </div>

      {loading ? (
        <div style={styles.empty}>Loading agents...</div>
      ) : agents.length === 0 ? (
        <div style={styles.empty}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🤖</div>
          <div style={{ color: "#94a3b8", marginBottom: 8 }}>No agents yet</div>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>
            Create an agent to automate tasks like summarizing, extracting data, sending emails
          </div>
          <button style={{ ...styles.btn, ...styles.btnPrimary }} onClick={openCreate}>
            Create your first agent
          </button>
        </div>
      ) : (
        agents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            documents={documents}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        ))
      )}

      {showModal && (
        <AgentModal
          agent={editAgent}
          onClose={() => { setShowModal(false); setEditAgent(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
