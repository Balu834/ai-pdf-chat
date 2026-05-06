"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = ["Productivity", "Finance", "Legal", "Education", "Other"];
const TEMPLATE_TYPES = [
  { value: "pdf_summarizer",    label: "PDF Summarizer" },
  { value: "invoice_extractor", label: "Invoice Extractor" },
  { value: "contract_checker",  label: "Contract Checker" },
  { value: "custom",            label: "Custom" },
];
const PRICE_PRESETS = [
  { label: "Free",  paise: 0 },
  { label: "₹99",  paise: 9900 },
  { label: "₹199", paise: 19900 },
  { label: "₹299", paise: 29900 },
  { label: "₹499", paise: 49900 },
  { label: "₹999", paise: 99900 },
];

// ── Styles ────────────────────────────────────────────────────────────────────

const s = {
  wrap:  { padding: "28px 28px 48px", maxWidth: 900 },
  title: { fontSize: 22, fontWeight: 900, color: "#f0f0f8", margin: 0, letterSpacing: "-0.4px" },
  sub:   { fontSize: 13, color: "rgba(240,240,248,0.4)", marginTop: 4 },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(168px, 1fr))", gap: 12, marginBottom: 32 },
  statCard: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "18px 16px", backdropFilter: "blur(12px)" },
  statVal:  { fontSize: 24, fontWeight: 900, color: "#f1f5f9", marginBottom: 4, letterSpacing: "-0.5px" },
  statLbl:  { fontSize: 10, color: "rgba(240,240,248,0.35)", textTransform: "uppercase", letterSpacing: "0.08em" },
  section:  { marginBottom: 28 },
  sectionHdr: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  sectionTitle: { fontSize: 12, fontWeight: 700, color: "rgba(240,240,248,0.35)", textTransform: "uppercase", letterSpacing: "0.09em" },
  card: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 16, marginBottom: 10, display: "flex", alignItems: "center", gap: 14, backdropFilter: "blur(8px)" },
  cardName: { fontSize: 14, fontWeight: 600, color: "#f1f5f9", marginBottom: 3 },
  cardMeta: { fontSize: 11, color: "rgba(240,240,248,0.35)" },
  btn: { padding: "7px 14px", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none", display: "flex", alignItems: "center", gap: 5 },
  btnPrimary: { background: "linear-gradient(135deg,#7c3aed,#5b21b6)", color: "#fff", boxShadow: "0 4px 14px rgba(124,58,237,0.3)" },
  btnGhost:   { background: "rgba(255,255,255,0.05)", color: "#cbd5e1", border: "1px solid rgba(255,255,255,0.09)" },
  btnDanger:  { background: "rgba(239,68,68,0.08)", color: "#f87171", border: "1px solid rgba(239,68,68,0.18)" },
  btnToggle:  { background: "rgba(245,158,11,0.08)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.18)" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal: { background: "linear-gradient(145deg,#12152a,#0d1020)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 28, width: "90%", maxWidth: 580, maxHeight: "92vh", overflowY: "auto", boxShadow: "0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(124,58,237,0.15)" },
  input: { width: "100%", padding: "9px 12px", borderRadius: 9, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#f1f5f9", fontSize: 13, boxSizing: "border-box", outline: "none" },
  textarea: { width: "100%", padding: "9px 12px", borderRadius: 9, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#f1f5f9", fontSize: 13, boxSizing: "border-box", outline: "none", resize: "vertical", minHeight: 80 },
  label: { fontSize: 12, fontWeight: 600, color: "rgba(240,240,248,0.45)", display: "block", marginBottom: 6 },
  fgroup: { marginBottom: 16 },
  pill: { display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600 },
  priceGrid: { display: "flex", gap: 8, flexWrap: "wrap" },
  pricePill: { padding: "6px 14px", borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1px solid", transition: "all 0.12s" },
  onboard: { background: "linear-gradient(135deg,rgba(124,58,237,0.1),rgba(79,70,229,0.06))", border: "1px solid rgba(124,58,237,0.22)", borderRadius: 18, padding: 36, textAlign: "center", marginBottom: 28 },
};

// ── Onboarding (no creator profile) ──────────────────────────────────────────

function OnboardingCard({ onCreated }) {
  const [form, setForm]  = useState({ display_name: "", bio: "" });
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!form.display_name.trim()) return;
    setSaving(true);
    const res = await fetch("/api/creator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (data.profile) onCreated(data.profile);
  };

  return (
    <div style={s.onboard}>
      <div style={{ fontSize: 44, marginBottom: 12 }}>🚀</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9", marginBottom: 6 }}>Become a Creator</div>
      <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 24, maxWidth: 360, margin: "0 auto 24px" }}>
        Publish AI agents and workflow templates. Earn money when users buy your paid templates.
      </p>
      <div style={{ maxWidth: 360, margin: "0 auto" }}>
        <div style={s.fgroup}>
          <label style={s.label}>Creator Name *</label>
          <input style={s.input} placeholder="e.g. Acme Automations" value={form.display_name} onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))} />
        </div>
        <div style={{ ...s.fgroup, marginBottom: 20 }}>
          <label style={s.label}>Bio (optional)</label>
          <textarea style={s.textarea} rows={2} placeholder="What do you build?" value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} />
        </div>
        <button
          style={{ ...s.btn, ...s.btnPrimary, width: "100%", justifyContent: "center", padding: "11px", opacity: saving ? 0.6 : 1, fontSize: 13 }}
          onClick={handleCreate}
          disabled={saving || !form.display_name.trim()}
        >
          {saving ? "Creating…" : "Create Creator Profile"}
        </button>
      </div>
    </div>
  );
}

// ── Publish modal ─────────────────────────────────────────────────────────────

function PublishModal({ type, sourceItems, onClose, onPublished }) {
  const isAgent = type === "agent";
  const [form, setForm] = useState({
    name: "", description: "", category: "Productivity",
    template_type: "custom", price_paise: 0,
    source_id: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSourceChange = (id) => {
    const src = sourceItems.find((s) => s.id === id);
    setForm((f) => ({
      ...f,
      source_id: id,
      name: f.name || (src?.name ?? ""),
      description: f.description || (src?.description ?? ""),
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.category) return;
    setSaving(true);
    const res = await fetch("/api/creator/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, ...form }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.published) { onPublished(data.listing, type); onClose(); }
  };

  return (
    <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        <div style={{ fontSize: 17, fontWeight: 800, color: "#f1f5f9", marginBottom: 20 }}>
          Publish {isAgent ? "Agent" : "Template"} to Marketplace
        </div>

        {sourceItems.length > 0 && (
          <div style={s.fgroup}>
            <label style={s.label}>Import from existing {isAgent ? "agent" : "workflow"} (optional)</label>
            <select style={s.input} value={form.source_id} onChange={(e) => handleSourceChange(e.target.value)}>
              <option value="">— Start from scratch —</option>
              {sourceItems.map((src) => <option key={src.id} value={src.id}>{src.name}</option>)}
            </select>
          </div>
        )}

        <div style={s.fgroup}>
          <label style={s.label}>Name *</label>
          <input style={s.input} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Invoice Data Extractor" />
        </div>

        <div style={s.fgroup}>
          <label style={s.label}>Description</label>
          <textarea style={s.textarea} rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="What does this do? Who is it for?" />
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={s.label}>Category</label>
            <select style={s.input} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {!isAgent && (
            <div style={{ flex: 1 }}>
              <label style={s.label}>Type</label>
              <select style={s.input} value={form.template_type} onChange={(e) => setForm((f) => ({ ...f, template_type: e.target.value }))}>
                {TEMPLATE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          )}
        </div>

        {!isAgent && (
          <div style={s.fgroup}>
            <label style={s.label}>Pricing</label>
            <div style={s.priceGrid}>
              {PRICE_PRESETS.map(({ label, paise }) => (
                <button
                  key={paise}
                  style={{
                    ...s.pricePill,
                    background: form.price_paise === paise ? (paise === 0 ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)") : "rgba(255,255,255,0.04)",
                    borderColor: form.price_paise === paise ? (paise === 0 ? "rgba(16,185,129,0.4)" : "rgba(245,158,11,0.4)") : "rgba(255,255,255,0.1)",
                    color: form.price_paise === paise ? (paise === 0 ? "#10b981" : "#f59e0b") : "#94a3b8",
                  }}
                  onClick={() => setForm((f) => ({ ...f, price_paise: paise }))}
                >
                  {label}
                </button>
              ))}
            </div>
            {form.price_paise > 0 && (
              <p style={{ fontSize: 11, color: "#64748b", marginTop: 8 }}>
                You earn ₹{((form.price_paise * 0.8) / 100).toFixed(0)} per sale · Platform fee: 20%
              </p>
            )}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
          <button style={{ ...s.btn, ...s.btnGhost }} onClick={onClose}>Cancel</button>
          <button
            style={{ ...s.btn, ...s.btnPrimary, opacity: (saving || !form.name.trim()) ? 0.6 : 1 }}
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
          >
            {saving ? "Publishing…" : "Publish to Marketplace"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Listing row ───────────────────────────────────────────────────────────────

function ListingRow({ item, type, onToggle, onDelete }) {
  const isTemplate = type === "template";
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    await fetch(`/api/creator/listings/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, is_published: !item.is_published }),
    });
    setToggling(false);
    onToggle(item.id, !item.is_published);
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${item.name}" from marketplace?`)) return;
    await fetch(`/api/creator/listings/${item.id}?type=${type}`, { method: "DELETE" });
    onDelete(item.id, type);
  };

  return (
    <div style={s.card}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: isTemplate ? "rgba(245,158,11,0.12)" : "rgba(124,58,237,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
        {isTemplate ? "⚡" : "🤖"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ ...s.cardName, display: "flex", alignItems: "center", gap: 8 }}>
          {item.name}
          {!item.is_published && <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: "rgba(148,163,184,0.1)", color: "#64748b" }}>Hidden</span>}
          {isTemplate && item.price_paise > 0 && (
            <span style={{ ...s.pill, background: "rgba(245,158,11,0.12)", color: "#f59e0b" }}>₹{item.price_paise / 100}</span>
          )}
        </div>
        <div style={s.cardMeta}>
          {item.category} · ⭐ {item.avg_rating > 0 ? item.avg_rating.toFixed(1) : "New"} ({item.review_count} reviews) · {item.install_count} installs
          {isTemplate && item.price_paise > 0 && ` · Est. ₹${Math.round(item.install_count * item.price_paise * 0.8 / 100)} earned`}
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <button style={{ ...s.btn, ...s.btnToggle, opacity: toggling ? 0.6 : 1 }} onClick={handleToggle} disabled={toggling}>
          {toggling ? "…" : item.is_published ? "Hide" : "Publish"}
        </button>
        <button style={{ ...s.btn, ...s.btnDanger }} onClick={handleDelete}>Delete</button>
      </div>
    </div>
  );
}

// ── Edit profile modal ────────────────────────────────────────────────────────

function EditProfileModal({ profile, onClose, onSaved }) {
  const [form, setForm] = useState({ display_name: profile.display_name, bio: profile.bio });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch("/api/creator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (data.profile) { onSaved(data.profile); onClose(); }
  };

  return (
    <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ ...s.modal, maxWidth: 440 }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: "#f1f5f9", marginBottom: 20 }}>Edit Creator Profile</div>
        <div style={s.fgroup}>
          <label style={s.label}>Display Name</label>
          <input style={s.input} value={form.display_name} onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))} />
        </div>
        <div style={{ ...s.fgroup, marginBottom: 20 }}>
          <label style={s.label}>Bio</label>
          <textarea style={s.textarea} rows={3} value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} />
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button style={{ ...s.btn, ...s.btnGhost }} onClick={onClose}>Cancel</button>
          <button style={{ ...s.btn, ...s.btnPrimary, opacity: saving ? 0.6 : 1 }} onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────

export default function CreatorView({ onToast }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]   = useState(null); // "agent" | "template" | "profile"
  const [userAgents,    setUserAgents]    = useState([]);
  const [userWorkflows, setUserWorkflows] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/creator");
    const d = await res.json();
    setData(d);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Pre-fetch user's agents + workflows for the publish modal
  const openPublish = async (type) => {
    if (type === "agent" && !userAgents.length) {
      const res = await fetch("/api/agents");
      const d = await res.json();
      setUserAgents(d.agents ?? []);
    }
    if (type === "template" && !userWorkflows.length) {
      const res = await fetch("/api/workflows");
      const d = await res.json();
      setUserWorkflows(d.workflows ?? []);
    }
    setModal(type);
  };

  const handlePublished = (listing, type) => {
    setData((prev) => ({
      ...prev,
      agents:    type === "agent"    ? [listing, ...(prev.agents ?? [])]    : prev.agents,
      templates: type === "template" ? [listing, ...(prev.templates ?? [])] : prev.templates,
      stats: {
        ...prev.stats,
        published_agents:    type === "agent"    ? (prev.stats.published_agents ?? 0) + 1    : prev.stats.published_agents,
        published_templates: type === "template" ? (prev.stats.published_templates ?? 0) + 1 : prev.stats.published_templates,
      },
    }));
    onToast?.(`"${listing.name}" published to marketplace!`);
  };

  const handleToggle = (id, isPublished, type) => {
    const key = type === "agent" ? "agents" : "templates";
    setData((prev) => ({ ...prev, [key]: prev[key].map((i) => i.id === id ? { ...i, is_published: isPublished } : i) }));
  };

  const handleDelete = (id, type) => {
    const key = type === "agent" ? "agents" : "templates";
    setData((prev) => ({ ...prev, [key]: prev[key].filter((i) => i.id !== id) }));
  };

  if (loading) return (
    <div style={{ padding: 48, textAlign: "center" }}>
      <div style={{ width: 36, height: 36, border: "3px solid rgba(124,58,237,0.2)", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
      <p style={{ fontSize: 13, color: "rgba(240,240,248,0.3)", margin: 0 }}>Loading creator dashboard…</p>
    </div>
  );

  // No profile → show onboarding
  if (!data?.profile) {
    return (
      <div style={s.wrap}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(240,240,248,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 4px" }}>Studio</p>
          <h2 style={s.title}>
            Creator{" "}
            <span style={{ background: "linear-gradient(135deg,#a78bfa,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Studio
            </span>
          </h2>
          <p style={s.sub}>Publish, monetize, and track your AI agents &amp; workflow templates</p>
        </motion.div>
        <OnboardingCard onCreated={(profile) => setData((d) => ({ ...d, profile }))} />
      </div>
    );
  }

  const { profile, stats, agents = [], templates = [], recent_purchases = [] } = data;
  const earnings    = (stats.total_earnings_paise ?? 0) / 100;
  const pending     = (stats.pending_payout_paise ?? 0) / 100;

  return (
    <div style={s.wrap}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}
      >
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(240,240,248,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 4px" }}>Studio</p>
          <h2 style={s.title}>
            Creator{" "}
            <span style={{ background: "linear-gradient(135deg,#a78bfa,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Studio
            </span>
          </h2>
          <p style={{ ...s.sub, marginTop: 4 }}>
            <span style={{ color: "#a78bfa", fontWeight: 600 }}>{profile.display_name}</span>
            {profile.bio && <span> · {profile.bio}</span>}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          style={{ ...s.btn, ...s.btnGhost }}
          onClick={() => setModal("profile")}
        >
          Edit Profile
        </motion.button>
      </motion.div>

      {/* Stats row */}
      <div style={s.statsRow}>
        {[
          { val: `₹${earnings.toFixed(0)}`, lbl: "Total Earnings",       color: "#10b981", glow: "rgba(16,185,129,0.12)"  },
          { val: `₹${pending.toFixed(0)}`,  lbl: "Pending Payout",       color: "#f59e0b", glow: "rgba(245,158,11,0.12)"  },
          { val: stats.total_installs ?? 0, lbl: "Total Installs",        color: "#a78bfa", glow: "rgba(167,139,250,0.12)" },
          { val: stats.published_agents ?? 0,    lbl: "Agents Published",    color: "#60a5fa", glow: "rgba(96,165,250,0.1)"   },
          { val: stats.published_templates ?? 0, lbl: "Templates Published", color: "#34d399", glow: "rgba(52,211,153,0.1)"   },
        ].map(({ val, lbl, color, glow }, i) => (
          <motion.div
            key={lbl}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, duration: 0.35 }}
            whileHover={{ scale: 1.02, boxShadow: `0 0 0 1px ${color}44, 0 8px 24px ${glow}` }}
            style={{ ...s.statCard, background: `linear-gradient(135deg, ${glow}, rgba(255,255,255,0.02))`, transition: "border-color 0.2s" }}
          >
            <div style={{ ...s.statVal, color }}>{val}</div>
            <div style={s.statLbl}>{lbl}</div>
          </motion.div>
        ))}
      </div>

      {/* My Published Agents */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.35 }} style={s.section}>
        <div style={s.sectionHdr}>
          <div style={s.sectionTitle}>🤖 My Agents ({agents.length})</div>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            style={{ ...s.btn, ...s.btnPrimary }}
            onClick={() => openPublish("agent")}
          >
            + Publish Agent
          </motion.button>
        </div>
        {agents.length === 0 ? (
          <div style={{ padding: "24px", textAlign: "center", color: "rgba(240,240,248,0.3)", fontSize: 13, background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px dashed rgba(255,255,255,0.07)" }}>
            No agents published yet — be the first to share yours!
          </div>
        ) : (
          agents.map((a) => (
            <ListingRow key={a.id} item={a} type="agent"
              onToggle={(id, val) => handleToggle(id, val, "agent")}
              onDelete={(id) => handleDelete(id, "agent")}
            />
          ))
        )}
      </motion.div>

      {/* My Published Templates */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38, duration: 0.35 }} style={s.section}>
        <div style={s.sectionHdr}>
          <div style={s.sectionTitle}>⚡ My Templates ({templates.length})</div>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            style={{ ...s.btn, ...s.btnPrimary }}
            onClick={() => openPublish("template")}
          >
            + Publish Template
          </motion.button>
        </div>
        {templates.length === 0 ? (
          <div style={{ padding: "24px", textAlign: "center", color: "rgba(240,240,248,0.3)", fontSize: 13, background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px dashed rgba(255,255,255,0.07)" }}>
            No templates published yet
          </div>
        ) : (
          templates.map((t) => (
            <ListingRow key={t.id} item={t} type="template"
              onToggle={(id, val) => handleToggle(id, val, "template")}
              onDelete={(id) => handleDelete(id, "template")}
            />
          ))
        )}
      </motion.div>

      {/* Recent sales */}
      {recent_purchases.length > 0 && (
        <div style={s.section}>
          <div style={s.sectionHdr}>
            <div style={s.sectionTitle}>💰 Recent Sales</div>
          </div>
          {recent_purchases.map((p) => (
            <div key={p.id} style={{ ...s.card, padding: "12px 16px" }}>
              <div style={{ fontSize: 18 }}>💳</div>
              <div style={{ flex: 1 }}>
                <div style={s.cardName}>{p.marketplace_templates?.name ?? "Template"}</div>
                <div style={s.cardMeta}>{new Date(p.created_at).toLocaleDateString()}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#10b981" }}>+₹{(p.creator_paise / 100).toFixed(0)}</div>
                <div style={{ fontSize: 10, color: "#64748b" }}>of ₹{(p.amount_paise / 100).toFixed(0)} sale</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payout notice */}
      {pending > 0 && (
        <div style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 12, padding: "14px 18px", fontSize: 12, color: "#fbbf24", lineHeight: 1.6 }}>
          💰 You have <strong>₹{pending.toFixed(0)}</strong> in pending payouts. Payouts are processed monthly to your registered bank account. Contact support to update payout details.
        </div>
      )}

      {/* Modals */}
      {modal === "agent" && (
        <PublishModal type="agent" sourceItems={userAgents}
          onClose={() => setModal(null)}
          onPublished={(listing) => handlePublished(listing, "agent")}
        />
      )}
      {modal === "template" && (
        <PublishModal type="template" sourceItems={userWorkflows}
          onClose={() => setModal(null)}
          onPublished={(listing) => handlePublished(listing, "template")}
        />
      )}
      {modal === "profile" && (
        <EditProfileModal
          profile={profile}
          onClose={() => setModal(null)}
          onSaved={(p) => setData((d) => ({ ...d, profile: p }))}
        />
      )}
    </div>
  );
}
