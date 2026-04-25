"use client";
import { useState, useEffect, useCallback } from "react";

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

const s = {
  container: { padding: "24px 28px", maxWidth: 960 },
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
    resize: "vertical", minHeight: 64,
  },
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
  },
  modal: {
    background: "#1e293b", border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 16, padding: 28, width: "90%", maxWidth: 640, maxHeight: "92vh", overflowY: "auto",
  },
  modalTitle: { fontSize: 17, fontWeight: 700, color: "#f1f5f9", marginBottom: 20 },
  formGroup: { marginBottom: 16 },
  stepCard: {
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10, padding: 14, marginBottom: 8,
  },
  stepHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  empty: { textAlign: "center", padding: "48px 20px", color: "#64748b" },
  pill: {
    display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px",
    borderRadius: 20, fontSize: 11, fontWeight: 500,
  },
  stat: { fontSize: 11, color: "#64748b" },
};

// ── Step config editor ────────────────────────────────────────────────────────

function StepConfig({ step, onChange }) {
  const cfg = step.config ?? {};
  const set = (key, val) => onChange({ ...step, config: { ...cfg, [key]: val } });

  if (step.type === "summarize") return (
    <div>
      <label style={s.label}>Style</label>
      <select style={s.input} value={cfg.style ?? "bullet"} onChange={(e) => set("style", e.target.value)}>
        <option value="bullet">Bullet points</option>
        <option value="paragraph">Paragraph</option>
        <option value="executive">Executive brief</option>
      </select>
    </div>
  );

  if (step.type === "extract_fields") return (
    <div>
      <label style={s.label}>Fields (one per line: name:type e.g. invoice_number:string)</label>
      <textarea
        style={s.textarea}
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
      <div style={s.formGroup}>
        <label style={s.label}>To (use {{`{{field}}`}} for dynamic values)</label>
        <input style={s.input} value={cfg.to ?? ""} onChange={(e) => set("to", e.target.value)} placeholder="recipient@example.com" />
      </div>
      <div style={s.formGroup}>
        <label style={s.label}>Subject</label>
        <input style={s.input} value={cfg.subject ?? ""} onChange={(e) => set("subject", e.target.value)} placeholder="Document summary: {{document_id}}" />
      </div>
      <div>
        <label style={s.label}>Body</label>
        <textarea style={s.textarea} rows={4} value={cfg.body ?? ""} onChange={(e) => set("body", e.target.value)} placeholder="Here is your summary:\n\n{{step_0.summary}}" />
      </div>
    </div>
  );

  if (step.type === "call_webhook") return (
    <div>
      <div style={s.formGroup}>
        <label style={s.label}>URL (must start with https://)</label>
        <input style={s.input} value={cfg.url ?? ""} onChange={(e) => set("url", e.target.value)} placeholder="https://hooks.zapier.com/..." />
      </div>
      <div>
        <label style={s.label}>Payload JSON (use {{`{{field}}`}} for dynamic values)</label>
        <textarea
          style={s.textarea}
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
        <label style={s.label}>Field</label>
        <input style={s.input} value={cfg.field ?? ""} onChange={(e) => set("field", e.target.value)} placeholder="step_0.summary" />
      </div>
      <div style={{ width: 120 }}>
        <label style={s.label}>Operator</label>
        <select style={s.input} value={cfg.operator ?? "exists"} onChange={(e) => set("operator", e.target.value)}>
          <option value="exists">exists</option>
          <option value="equals">equals</option>
          <option value="contains">contains</option>
          <option value="gt">greater than</option>
          <option value="lt">less than</option>
        </select>
      </div>
      {cfg.operator !== "exists" && (
        <div style={{ flex: 1 }}>
          <label style={s.label}>Value</label>
          <input style={s.input} value={cfg.value ?? ""} onChange={(e) => set("value", e.target.value)} />
        </div>
      )}
    </div>
  );

  if (step.type === "run_agent") return (
    <div>
      <div style={s.formGroup}>
        <label style={s.label}>Agent ID</label>
        <input style={s.input} value={cfg.agent_id ?? ""} onChange={(e) => set("agent_id", e.target.value)} placeholder="Paste agent UUID" />
      </div>
      <div>
        <label style={s.label}>Task</label>
        <textarea style={s.textarea} rows={3} value={cfg.task ?? ""} onChange={(e) => set("task", e.target.value)} placeholder="Analyze and summarize the key findings..." />
      </div>
    </div>
  );

  return null;
}

// ── Workflow builder modal ────────────────────────────────────────────────────

function WorkflowModal({ workflow, initialSteps = [], onClose, onSave }) {
  const [form, setForm] = useState({
    name: workflow?.name ?? "",
    description: workflow?.description ?? "",
    trigger: workflow?.trigger ?? "manual",
    is_active: workflow?.is_active ?? true,
  });
  const [steps, setSteps] = useState(
    initialSteps.length > 0 ? initialSteps : []
  );
  const [saving, setSaving] = useState(false);

  const addStep = (type) => {
    setSteps((prev) => [...prev, { type, config: {}, position: prev.length }]);
  };

  const removeStep = (idx) => {
    setSteps((prev) => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, position: i })));
  };

  const updateStep = (idx, updated) => {
    setSteps((prev) => { const next = [...prev]; next[idx] = { ...updated, position: idx }; return next; });
  };

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
    <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        <div style={s.modalTitle}>{workflow ? "Edit Workflow" : "Create Workflow"}</div>

        <div style={s.formGroup}>
          <label style={s.label}>Name *</label>
          <input style={s.input} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Invoice Processing" />
        </div>
        <div style={s.formGroup}>
          <label style={s.label}>Description</label>
          <input style={s.input} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="What does this workflow do?" />
        </div>
        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={s.label}>Trigger</label>
            <select style={s.input} value={form.trigger} onChange={(e) => setForm((f) => ({ ...f, trigger: e.target.value }))}>
              {TRIGGERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          {workflow && (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
              <input type="checkbox" id="wf_active" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} style={{ accentColor: "#7c3aed" }} />
              <label htmlFor="wf_active" style={{ ...s.label, margin: 0, cursor: "pointer" }}>Active</label>
            </div>
          )}
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ ...s.label, marginBottom: 8 }}>Steps ({steps.length})</div>
          {steps.map((step, idx) => {
            const info = STEP_TYPES.find((t) => t.type === step.type);
            return (
              <div key={idx} style={s.stepCard}>
                <div style={s.stepHeader}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ ...s.pill, background: (info?.color ?? "#64748b") + "22", color: info?.color ?? "#94a3b8" }}>
                      {info?.icon} {info?.label}
                    </span>
                    <span style={{ fontSize: 11, color: "#64748b" }}>Step {idx + 1}</span>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {idx > 0 && <button style={{ ...s.btn, ...s.btnGhost, padding: "3px 8px", fontSize: 11 }} onClick={() => moveStep(idx, -1)}>↑</button>}
                    {idx < steps.length - 1 && <button style={{ ...s.btn, ...s.btnGhost, padding: "3px 8px", fontSize: 11 }} onClick={() => moveStep(idx, 1)}>↓</button>}
                    <button style={{ ...s.btn, ...s.btnDanger, padding: "3px 8px", fontSize: 11 }} onClick={() => removeStep(idx)}>✕</button>
                  </div>
                </div>
                <StepConfig step={step} onChange={(updated) => updateStep(idx, updated)} />
              </div>
            );
          })}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {STEP_TYPES.map(({ type, label, icon, color }) => (
              <button
                key={type}
                style={{ ...s.btn, ...s.btnGhost, fontSize: 12, padding: "5px 10px", color }}
                onClick={() => addStep(type)}
              >
                + {icon} {label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
          <button style={{ ...s.btn, ...s.btnGhost }} onClick={onClose}>Cancel</button>
          <button
            style={{ ...s.btn, ...s.btnPrimary, opacity: saving ? 0.6 : 1 }}
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
          >
            {saving ? "Saving..." : workflow ? "Save Changes" : "Create Workflow"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Workflow card ─────────────────────────────────────────────────────────────

function WorkflowCard({ workflow, documents, onEdit, onDelete }) {
  const [docId, setDocId] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [executions, setExecutions] = useState(null);
  const [showExec, setShowExec] = useState(false);

  const triggerInfo = TRIGGERS.find((t) => t.value === workflow.trigger);

  const handleRun = async () => {
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch(`/api/workflows/${workflow.id}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_id: docId || undefined }),
      });
      const data = await res.json();
      setResult(data);
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
    <div style={s.card}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: "#f1f5f9" }}>{workflow.name}</span>
            {!workflow.is_active && (
              <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: "rgba(148,163,184,0.1)", color: "#64748b" }}>Disabled</span>
            )}
          </div>
          {workflow.description && <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>{workflow.description}</div>}
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ ...s.pill, background: "rgba(100,116,139,0.15)", color: "#94a3b8" }}>
              {triggerInfo?.label ?? workflow.trigger}
            </span>
            <span style={s.stat}>{workflow.step_count ?? 0} steps · {workflow.runs_count} runs</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, marginLeft: 12 }}>
          <button style={{ ...s.btn, ...s.btnGhost, padding: "5px 12px" }} onClick={loadExecutions}>
            History
          </button>
          <button style={{ ...s.btn, ...s.btnGhost, padding: "5px 12px" }} onClick={() => onEdit(workflow)}>
            Edit
          </button>
          <button style={{ ...s.btn, ...s.btnDanger, padding: "5px 12px" }} onClick={() => onDelete(workflow.id)}>
            Delete
          </button>
        </div>
      </div>

      {/* Manual run */}
      {workflow.trigger === "manual" && workflow.is_active && (
        <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {documents?.length > 0 && (
            <select
              style={{ ...s.input, width: "auto", flex: 1, minWidth: 160 }}
              value={docId}
              onChange={(e) => setDocId(e.target.value)}
            >
              <option value="">No document</option>
              {documents.map((d) => <option key={d.id} value={d.id}>{d.name || d.file_name}</option>)}
            </select>
          )}
          <button
            style={{ ...s.btn, ...s.btnPrimary, opacity: running ? 0.6 : 1 }}
            onClick={handleRun}
            disabled={running}
          >
            {running ? "Running..." : "▶ Run Now"}
          </button>
        </div>
      )}

      {result && (
        <div style={{
          marginTop: 10, padding: 12, borderRadius: 8,
          background: result.status === "failed" ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)",
          border: `1px solid ${result.status === "failed" ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)"}`,
          fontSize: 12, color: "#e2e8f0",
        }}>
          {result.status === "failed"
            ? `Failed: ${result.error}`
            : `Completed in ${result.step_logs?.length ?? 0} steps. Execution ID: ${result.execution_id}`
          }
        </div>
      )}

      {showExec && executions !== null && (
        <div style={{ marginTop: 12 }}>
          <div style={{ ...s.label, marginBottom: 6 }}>Recent executions</div>
          {executions.length === 0 ? (
            <div style={{ fontSize: 12, color: "#64748b" }}>No executions yet</div>
          ) : executions.map((e) => (
            <div key={e.id} style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 12 }}>
              <span style={{
                ...s.pill,
                background: e.status === "completed" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                color: e.status === "completed" ? "#10b981" : "#f87171",
              }}>
                {e.status}
              </span>
              <span style={{ color: "#94a3b8" }}>{formatDate(e.created_at)}</span>
              {duration(e) && <span style={{ color: "#64748b" }}>{duration(e)}</span>}
              {e.error && <span style={{ color: "#f87171" }}>{e.error}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────

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
    setShowModal(false);
    setEditWf(null);
    setEditSteps([]);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this workflow and all its executions?")) return;
    await fetch(`/api/workflows/${id}`, { method: "DELETE" });
    setWorkflows((prev) => prev.filter((w) => w.id !== id));
  };

  const openEdit = async (wf) => {
    const res = await fetch(`/api/workflows/${wf.id}`);
    const data = await res.json();
    setEditWf(data.workflow ?? wf);
    setEditSteps(data.steps ?? []);
    setShowModal(true);
  };

  return (
    <div style={s.container}>
      <div style={s.header}>
        <div>
          <h2 style={s.title}>Workflows</h2>
          <p style={s.sub}>Automate multi-step document pipelines with triggers, actions, and conditions</p>
        </div>
        <button style={{ ...s.btn, ...s.btnPrimary }} onClick={() => { setEditWf(null); setEditSteps([]); setShowModal(true); }}>
          + New Workflow
        </button>
      </div>

      {loading ? (
        <div style={s.empty}>Loading workflows...</div>
      ) : workflows.length === 0 ? (
        <div style={s.empty}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⚡</div>
          <div style={{ color: "#94a3b8", marginBottom: 8 }}>No workflows yet</div>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>
            Build multi-step pipelines: extract data → send email → call webhook
          </div>
          <button style={{ ...s.btn, ...s.btnPrimary }} onClick={() => setShowModal(true)}>
            Create your first workflow
          </button>
        </div>
      ) : (
        workflows.map((wf) => (
          <WorkflowCard
            key={wf.id}
            workflow={wf}
            documents={documents}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        ))
      )}

      {showModal && (
        <WorkflowModal
          workflow={editWf}
          initialSteps={editSteps}
          onClose={() => { setShowModal(false); setEditWf(null); setEditSteps([]); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
