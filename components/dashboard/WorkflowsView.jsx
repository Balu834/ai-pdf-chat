"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STEP_TYPES = [
  { type: "summarize",      label: "Summarize PDF",   icon: "📄", color: "#7c3aed" },
  { type: "extract_fields", label: "Extract Fields",  icon: "🔍", color: "#06b6d4" },
  { type: "send_email",     label: "Send Email",      icon: "✉️",  color: "#10b981" },
  { type: "call_webhook",   label: "Call Webhook",    icon: "🔗", color: "#f59e0b" },
  { type: "condition",      label: "Condition",       icon: "❓", color: "#64748b" },
  { type: "run_agent",      label: "Run Agent",       icon: "🤖", color: "#ec4899" },
];

const TRIGGERS = [
  { value: "manual",     label: "Manual only" },
  { value: "pdf_upload", label: "On PDF upload" },
  { value: "scheduled",  label: "Scheduled" },
];

/* ── Shared token shortcuts ─────────────────────────────────────────────────── */
const inputStyle = {
  width: "100%", padding: "9px 12px", borderRadius: 9,
  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
  color: "#f1f5f9", fontSize: 13, boxSizing: "border-box", outline: "none",
};
const textareaStyle = { ...inputStyle, resize: "vertical", minHeight: 72 };
const labelStyle = { fontSize: 12, fontWeight: 600, color: "rgba(240,240,248,0.45)", display: "block", marginBottom: 6 };
const btnBase = { padding: "8px 16px", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", display: "flex", alignItems: "center", gap: 6 };
const btnPrimary = { ...btnBase, background: "linear-gradient(135deg,#7c3aed,#5b21b6)", color: "#fff", boxShadow: "0 4px 16px rgba(124,58,237,0.3)" };
const btnGhost = { ...btnBase, background: "rgba(255,255,255,0.05)", color: "#cbd5e1", border: "1px solid rgba(255,255,255,0.09)" };
const btnDanger = { ...btnBase, background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.18)" };

/* ── Step config editor ────────────────────────────────────────────────────── */
function StepConfig({ step, onChange }) {
  const cfg = step.config ?? {};
  const set = (key, val) => onChange({ ...step, config: { ...cfg, [key]: val } });

  if (step.type === "summarize") return (
    <div>
      <label style={labelStyle}>Style</label>
      <select style={inputStyle} value={cfg.style ?? "bullet"} onChange={(e) => set("style", e.target.value)}>
        <option value="bullet">Bullet points</option>
        <option value="paragraph">Paragraph</option>
        <option value="executive">Executive brief</option>
      </select>
    </div>
  );

  if (step.type === "extract_fields") return (
    <div>
      <label style={labelStyle}>Fields (one per line: name:type e.g. invoice_number:string)</label>
      <textarea
        style={textareaStyle}
        rows={4}
        placeholder={"invoice_number:string\ntotal_amount:number\ndue_date:date"}
        value={(cfg.fields ?? []).map((f) => `${f.name}:${f.type ?? "string"}`).join("\n")}
        onChange={(e) => {
          const fields = e.target.value.split("\n").filter(Boolean).map((line) => {
            const [name, type = "string"] = line.split(":");
            return { name: name.trim(), type: type.trim() };
          });
          set("fields", fields);
        }}
      />
    </div>
  );

  if (step.type === "send_email") return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>To (use {"{{field}}"} for dynamic values)</label>
        <input style={inputStyle} value={cfg.to ?? ""} onChange={(e) => set("to", e.target.value)} placeholder="recipient@example.com" />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Subject</label>
        <input style={inputStyle} value={cfg.subject ?? ""} onChange={(e) => set("subject", e.target.value)} placeholder="Document summary: {{document_id}}" />
      </div>
      <div>
        <label style={labelStyle}>Body</label>
        <textarea style={textareaStyle} rows={4} value={cfg.body ?? ""} onChange={(e) => set("body", e.target.value)} placeholder="Here is your summary:\n\n{{step_0.summary}}" />
      </div>
    </div>
  );

  if (step.type === "call_webhook") return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>URL (must start with https://)</label>
        <input style={inputStyle} value={cfg.url ?? ""} onChange={(e) => set("url", e.target.value)} placeholder="https://hooks.zapier.com/..." />
      </div>
      <div>
        <label style={labelStyle}>Payload JSON (use {"{{field}}"} for dynamic values)</label>
        <textarea
          style={textareaStyle}
          rows={4}
          value={typeof cfg.payload === "string" ? cfg.payload : JSON.stringify(cfg.payload ?? {}, null, 2)}
          onChange={(e) => {
            try { set("payload", JSON.parse(e.target.value)); }
            catch { set("payload", e.target.value); }
          }}
          placeholder='{"summary": "{{step_0.summary}}"}'
        />
      </div>
    </div>
  );

  if (step.type === "condition") return (
    <div style={{ display: "flex", gap: 8 }}>
      <div style={{ flex: 1 }}>
        <label style={labelStyle}>Field</label>
        <input style={inputStyle} value={cfg.field ?? ""} onChange={(e) => set("field", e.target.value)} placeholder="step_0.summary" />
      </div>
      <div style={{ width: 120 }}>
        <label style={labelStyle}>Operator</label>
        <select style={inputStyle} value={cfg.operator ?? "exists"} onChange={(e) => set("operator", e.target.value)}>
          <option value="exists">exists</option>
          <option value="equals">equals</option>
          <option value="contains">contains</option>
          <option value="gt">greater than</option>
          <option value="lt">less than</option>
        </select>
      </div>
      {cfg.operator !== "exists" && (
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Value</label>
          <input style={inputStyle} value={cfg.value ?? ""} onChange={(e) => set("value", e.target.value)} />
        </div>
      )}
    </div>
  );

  if (step.type === "run_agent") return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Agent ID</label>
        <input style={inputStyle} value={cfg.agent_id ?? ""} onChange={(e) => set("agent_id", e.target.value)} placeholder="Paste agent UUID" />
      </div>
      <div>
        <label style={labelStyle}>Task</label>
        <textarea style={textareaStyle} rows={3} value={cfg.task ?? ""} onChange={(e) => set("task", e.target.value)} placeholder="Analyze and summarize the key findings..." />
      </div>
    </div>
  );

  return null;
}

/* ── Workflow builder modal ─────────────────────────────────────────────────── */
function WorkflowModal({ workflow, initialSteps = [], onClose, onSave }) {
  const [form, setForm] = useState({
    name: workflow?.name ?? "",
    description: workflow?.description ?? "",
    trigger: workflow?.trigger ?? "manual",
    is_active: workflow?.is_active ?? true,
  });
  const [steps, setSteps] = useState(initialSteps.length > 0 ? initialSteps : []);
  const [saving, setSaving] = useState(false);

  const addStep = (type) => setSteps((prev) => [...prev, { type, config: {}, position: prev.length }]);
  const removeStep = (idx) => setSteps((prev) => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, position: i })));
  const updateStep = (idx, updated) => setSteps((prev) => { const next = [...prev]; next[idx] = { ...updated, position: idx }; return next; });
  const moveStep = (idx, dir) => {
    const next = [...steps];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setSteps(next.map((s, i) => ({ ...s, position: i })));
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const url = workflow ? `/api/workflows/${workflow.id}` : "/api/workflows";
    const method = workflow ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, steps }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.workflow) onSave(data.workflow, data.steps ?? []);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: "spring", bounce: 0.2, duration: 0.45 }}
        style={{ background: "linear-gradient(145deg,#12152a,#0d1020)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 28, width: "90%", maxWidth: 640, maxHeight: "92vh", overflowY: "auto", boxShadow: "0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(124,58,237,0.15)" }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9", margin: "0 0 22px", letterSpacing: "-0.3px" }}>
          {workflow ? "Edit Workflow" : "Create Workflow"}
        </h2>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Name *</label>
          <input style={inputStyle} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Invoice Processing" />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Description</label>
          <input style={inputStyle} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="What does this workflow do?" />
        </div>
        <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Trigger</label>
            <select style={inputStyle} value={form.trigger} onChange={(e) => setForm((f) => ({ ...f, trigger: e.target.value }))}>
              {TRIGGERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          {workflow && (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
              <input type="checkbox" id="wf_active" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} style={{ accentColor: "#7c3aed" }} />
              <label htmlFor="wf_active" style={{ ...labelStyle, margin: 0, cursor: "pointer" }}>Active</label>
            </div>
          )}
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ ...labelStyle, marginBottom: 10 }}>Steps ({steps.length})</label>
          {steps.map((step, idx) => {
            const info = STEP_TYPES.find((t) => t.type === step.type);
            return (
              <div key={idx} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 14, marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 9px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: (info?.color ?? "#64748b") + "22", color: info?.color ?? "#94a3b8", border: `1px solid ${(info?.color ?? "#64748b")}33` }}>
                      {info?.icon} {info?.label}
                    </span>
                    <span style={{ fontSize: 11, color: "rgba(240,240,248,0.3)" }}>Step {idx + 1}</span>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {idx > 0 && <button style={{ ...btnGhost, padding: "3px 8px", fontSize: 11 }} onClick={() => moveStep(idx, -1)}>↑</button>}
                    {idx < steps.length - 1 && <button style={{ ...btnGhost, padding: "3px 8px", fontSize: 11 }} onClick={() => moveStep(idx, 1)}>↓</button>}
                    <button style={{ ...btnDanger, padding: "3px 8px", fontSize: 11 }} onClick={() => removeStep(idx)}>✕</button>
                  </div>
                </div>
                <StepConfig step={step} onChange={(updated) => updateStep(idx, updated)} />
              </div>
            );
          })}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
            {STEP_TYPES.map(({ type, label, icon, color }) => (
              <button key={type} style={{ ...btnGhost, fontSize: 12, padding: "5px 10px", color }} onClick={() => addStep(type)}>
                + {icon} {label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <button style={btnGhost} onClick={onClose}>Cancel</button>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
          >
            {saving ? "Saving…" : workflow ? "Save Changes" : "Create Workflow"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Workflow card ────────────────────────────────────────────────────────── */
function WorkflowCard({ workflow, documents, onEdit, onDelete, index }) {
  const [docId, setDocId] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [executions, setExecutions] = useState(null);
  const [showExec, setShowExec] = useState(false);

  const triggerInfo = TRIGGERS.find((t) => t.value === workflow.trigger);

  const handleRun = async () => {
    setRunning(true); setResult(null);
    try {
      const res = await fetch(`/api/workflows/${workflow.id}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_id: docId || undefined }),
      });
      setResult(await res.json());
    } catch {
      setResult({ status: "failed", error: "Network error" });
    } finally {
      setRunning(false);
    }
  };

  const loadExecutions = async () => {
    if (executions !== null) { setShowExec((v) => !v); return; }
    const res = await fetch(`/api/workflows/${workflow.id}/executions?limit=5`);
    const data = await res.json();
    setExecutions(data.executions ?? []);
    setShowExec(true);
  };

  const formatDate = (d) => d ? new Date(d).toLocaleString() : "—";
  const duration = (e) => {
    if (!e.started_at || !e.finished_at) return "";
    const ms = new Date(e.finished_at) - new Date(e.started_at);
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      whileHover={{ y: -2, boxShadow: "0 0 0 1px rgba(124,58,237,0.22), 0 12px 32px rgba(124,58,237,0.12)" }}
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 20, marginBottom: 12, backdropFilter: "blur(12px)", transition: "border-color 0.2s" }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>{workflow.name}</span>
            {!workflow.is_active && (
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: "rgba(148,163,184,0.1)", color: "#64748b", border: "1px solid rgba(148,163,184,0.15)" }}>Disabled</span>
            )}
            {workflow.is_active && (
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: "rgba(74,222,128,0.1)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.2)" }}>Active</span>
            )}
          </div>
          {workflow.description && <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>{workflow.description}</div>}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 9px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: "rgba(100,116,139,0.12)", color: "#94a3b8", border: "1px solid rgba(100,116,139,0.2)" }}>
              {triggerInfo?.label ?? workflow.trigger}
            </span>
            <span style={{ fontSize: 11, color: "rgba(240,240,248,0.3)" }}>{workflow.step_count ?? 0} steps · {workflow.runs_count} runs</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, marginLeft: 12 }}>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} style={{ ...btnGhost, padding: "5px 12px", fontSize: 12 }} onClick={loadExecutions}>
            History
          </motion.button>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} style={{ ...btnGhost, padding: "5px 12px", fontSize: 12 }} onClick={() => onEdit(workflow)}>
            Edit
          </motion.button>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} style={{ ...btnDanger, padding: "5px 12px", fontSize: 12 }} onClick={() => onDelete(workflow.id)}>
            Delete
          </motion.button>
        </div>
      </div>

      {workflow.trigger === "manual" && workflow.is_active && (
        <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {documents?.length > 0 && (
            <select style={{ ...inputStyle, width: "auto", flex: 1, minWidth: 160 }} value={docId} onChange={(e) => setDocId(e.target.value)}>
              <option value="">No document</option>
              {documents.map((d) => <option key={d.id} value={d.id}>{d.name || d.file_name}</option>)}
            </select>
          )}
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            style={{ ...btnPrimary, opacity: running ? 0.6 : 1 }}
            onClick={handleRun}
            disabled={running}
          >
            {running ? (
              <>
                <div style={{ width: 11, height: 11, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                Running…
              </>
            ) : "▶ Run Now"}
          </motion.button>
        </div>
      )}

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            style={{ marginTop: 10, padding: 12, borderRadius: 10, background: result.status === "failed" ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)", border: `1px solid ${result.status === "failed" ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)"}`, fontSize: 12, color: "#e2e8f0" }}
          >
            {result.status === "failed"
              ? `Failed: ${result.error}`
              : `Completed in ${result.step_logs?.length ?? 0} steps. Execution ID: ${result.execution_id}`}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showExec && executions !== null && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            style={{ marginTop: 12, overflow: "hidden" }}
          >
            <div style={{ ...labelStyle, marginBottom: 8 }}>Recent executions</div>
            {executions.length === 0 ? (
              <div style={{ fontSize: 12, color: "#64748b" }}>No executions yet</div>
            ) : executions.map((e) => (
              <div key={e.id} style={{ display: "flex", gap: 8, alignItems: "center", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 12 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 9px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: e.status === "completed" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)", color: e.status === "completed" ? "#10b981" : "#f87171", border: `1px solid ${e.status === "completed" ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}` }}>
                  {e.status}
                </span>
                <span style={{ color: "#94a3b8" }}>{formatDate(e.created_at)}</span>
                {duration(e) && <span style={{ color: "#64748b" }}>{duration(e)}</span>}
                {e.error && <span style={{ color: "#f87171" }}>{e.error}</span>}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Main view ────────────────────────────────────────────────────────────── */
export default function WorkflowsView({ documents = [] }) {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editWf, setEditWf] = useState(null);
  const [editSteps, setEditSteps] = useState([]);

  const fetchWorkflows = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/workflows");
    const data = await res.json();
    setWorkflows(data.workflows ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchWorkflows(); }, [fetchWorkflows]);

  const handleSave = (wf) => {
    setWorkflows((prev) => {
      const idx = prev.findIndex((w) => w.id === wf.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = wf; return next; }
      return [wf, ...prev];
    });
    setShowModal(false); setEditWf(null); setEditSteps([]);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this workflow and all its executions?")) return;
    await fetch(`/api/workflows/${id}`, { method: "DELETE" });
    setWorkflows((prev) => prev.filter((w) => w.id !== id));
  };

  const openEdit = async (wf) => {
    const res = await fetch(`/api/workflows/${wf.id}`);
    const data = await res.json();
    setEditWf(data.workflow ?? wf); setEditSteps(data.steps ?? []); setShowModal(true);
  };

  return (
    <div style={{ padding: "28px 28px 40px", maxWidth: 960 }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(240,240,248,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 4px" }}>Automation</p>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "#f0f0f8", margin: "0 0 6px", letterSpacing: "-0.4px" }}>
            Work<span style={{ background: "linear-gradient(135deg,#a78bfa,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>flows</span>
          </h1>
          <p style={{ fontSize: 13, color: "rgba(240,240,248,0.4)", margin: 0 }}>Automate multi-step document pipelines with triggers, actions, and conditions</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03, boxShadow: "0 8px 28px rgba(124,58,237,0.45)" }}
          whileTap={{ scale: 0.97 }}
          style={btnPrimary}
          onClick={() => { setEditWf(null); setEditSteps([]); setShowModal(true); }}
        >
          + New Workflow
        </motion.button>
      </motion.div>

      {/* Content */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 20, height: 88, animation: "pulse 1.5s ease-in-out infinite" }} />
          ))}
        </div>
      ) : workflows.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          style={{ textAlign: "center", padding: "64px 20px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20 }}
        >
          <div style={{ width: 64, height: 64, borderRadius: 18, background: "linear-gradient(135deg,rgba(124,58,237,0.2),rgba(6,182,212,0.15))", border: "1px solid rgba(124,58,237,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", fontSize: 28 }}>⚡</div>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: "#f1f5f9", margin: "0 0 8px" }}>No workflows yet</h3>
          <p style={{ fontSize: 13, color: "rgba(240,240,248,0.4)", margin: "0 0 24px", maxWidth: 360, marginLeft: "auto", marginRight: "auto" }}>
            Build multi-step pipelines: extract data → send email → call webhook
          </p>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} style={btnPrimary} onClick={() => setShowModal(true)}>
            Create your first workflow
          </motion.button>
        </motion.div>
      ) : (
        workflows.map((wf, i) => (
          <WorkflowCard key={wf.id} workflow={wf} documents={documents} onEdit={openEdit} onDelete={handleDelete} index={i} />
        ))
      )}

      <AnimatePresence>
        {showModal && (
          <WorkflowModal
            workflow={editWf}
            initialSteps={editSteps}
            onClose={() => { setShowModal(false); setEditWf(null); setEditSteps([]); }}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
