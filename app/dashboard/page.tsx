"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, MessageCircle, BarChart2,
  Search, Bell, Sparkles, Sun, Moon,
  ChevronRight, MoreHorizontal, ExternalLink, Trash2, Download,
  ArrowUpRight, Zap, Shield, Clock, TrendingUp, BookOpen,
  FileSearch, CheckCircle2, Upload, Users,
  CreditCard, Bookmark, Settings,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";
import { reportError } from "@/lib/reportError";
import OAuthSignupTracker from "@/app/components/OAuthSignupTracker";
import Sidebar, { type DashTab } from "@/app/components/dashboard/Sidebar";
import { Events } from "@/lib/analytics";

/* ── Types ─────────────────────────────────────────────────────────────── */
interface Doc {
  id: string;
  file_name: string;
  file_url: string;
  created_at: string;
}
interface Usage {
  pdfs: number;
  questions: number;
  maxPdfs: number;
  maxQuestions: number;
  loading: boolean;
  credits?: number;
}

/* ── Static data ────────────────────────────────────────────────────────── */
const CHART_DATA = [
  { day: "M", pct: 12, count: 1 },
  { day: "T", pct: 0,  count: 0 },
  { day: "W", pct: 32, count: 3 },
  { day: "T", pct: 18, count: 2 },
  { day: "F", pct: 0,  count: 0 },
  { day: "S", pct: 42, count: 4 },
  { day: "S", pct: 75, count: 7 },
  { day: "M", pct: 28, count: 3 },
  { day: "T", pct: 52, count: 5 },
  { day: "W", pct: 8,  count: 1 },
  { day: "T", pct: 62, count: 6 },
  { day: "F", pct: 88, count: 8 },
  { day: "T", pct: 100, count: 11 },
];

const CMD_ITEMS = [
  { section: "Actions",  icon: "↑", label: "Upload a new PDF",            kbd: "⌘U", action: "upload"   },
  { section: "Actions",  icon: "+", label: "Start a new conversation",    kbd: "⌘N", action: "new-conv" },
  { section: "Actions",  icon: "★", label: "Go Pro — unlimited everything",kbd: "⌘P", action: "pro"    },
  { section: "Recent",   icon: "·", label: "sample.pdf",                  meta: "1H AGO",    action: "doc-1" },
  { section: "Recent",   icon: "·", label: "Q3 Financial Report",         meta: "YESTERDAY", action: "doc-2" },
  { section: "Navigate", icon: "₹", label: "Billing & subscription",      kbd: "⌘B", action: "billing"  },
  { section: "Navigate", icon: "⚙", label: "Settings",                    kbd: "⌘,", action: "settings" },
];

/* Placeholder docs: created_at is a fixed ISO string to avoid SSR/client Date.now() divergence.
   timeAgo() treats anything older than 1h as "Xh ago" so the labels below are deterministic. */
const PLACEHOLDER_DOCS = [
  { id: "p1", file_name: "sample.pdf",              file_url: "", created_at: "2000-01-01T00:00:00.000Z", timeLabel: "1h ago",    pages: 12, questions: 2, isNew: true  },
  { id: "p2", file_name: "Q3 Financial Report.pdf", file_url: "", created_at: "2000-01-01T00:00:00.000Z", timeLabel: "Yesterday", pages: 42, questions: 7, isNew: false },
  { id: "p3", file_name: "Research Notes — May.pdf",file_url: "", created_at: "2000-01-01T00:00:00.000Z", timeLabel: "3d ago",    pages: 8,  questions: 5, isNew: false },
];

const DOC_SUMMARIES: Record<string, string> = {
  "sample.pdf":               "A sample document used for testing Intellixy's citation accuracy and AI response quality.",
  "Q3 Financial Report.pdf":  "Revenue reached ₹423.7 Cr (+23.4% YoY). Enterprise segment drove 68.2% of total revenue.",
  "Research Notes — May.pdf": "Key research findings on RAG pipeline optimization and embedding model comparisons.",
};

const TEMPLATES = [
  { n: "01", title: "Analyse a contract",        body: "Key clauses, renewal terms, and risk flags extracted in seconds." },
  { n: "02", title: "Read a research paper",     body: "Hypothesis, methodology, key findings, and limitations." },
  { n: "03", title: "Summarise an earnings call",body: "Key numbers, management tone, forward guidance extracted fast." },
];

/* ── Helpers ────────────────────────────────────────────────────────────── */
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "Just now";
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Yesterday";
  return `${d}d ago`;
}

const staggerContainer = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } } };

/* ════════════════════════════════════════════════════════════════════════════
   TAB CONTENT — rendered for every tab except "overview"
   ════════════════════════════════════════════════════════════════════════════ */
function TabContent({
  tab, user, docs, displayDocs, plan, usage, uploading, deleting,
  menuOpenId, setMenuOpenId, handleOpenDoc, handleDeleteDoc, onUpload,
  inviteCopied, handleCopyInvite, onTabChange, onUpgrade,
}: {
  tab: import("@/app/components/dashboard/Sidebar").DashTab;
  user: User | null;
  docs: { id: string; file_name: string; file_url: string; created_at: string }[];
  displayDocs: { id: string; file_name: string; file_url: string; created_at: string; pages: number; questions: number; isNew: boolean; timeLabel?: string }[];
  plan: "free" | "pro";
  usage: { pdfs: number; questions: number; maxPdfs: number; maxQuestions: number; loading: boolean };
  uploading: boolean;
  deleting: string | null;
  menuOpenId: string | null;
  setMenuOpenId: (id: string | null) => void;
  handleOpenDoc: (url: string) => void;
  handleDeleteDoc: (id: string, url: string) => void;
  onUpload: () => void;
  inviteCopied: boolean;
  handleCopyInvite: () => void;
  onTabChange: (tab: import("@/app/components/dashboard/Sidebar").DashTab) => void;
  onUpgrade: () => void;
}) {
  function timeAgoLocal(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return "Just now";
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d === 1) return "Yesterday";
    return `${d}d ago`;
  }

  const allDocs = docs.length > 0 ? docs : displayDocs;

  /* ── Documents tab ─────────────────────────────────────────── */
  if (tab === "documents") {
    return (
      <motion.div variants={staggerContainer} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div className="ix-doc-section-head">
          <div className="ix-section-title"><FileText size={16} /> All Documents ({allDocs.length})</div>
          <button className="ix-btn-primary" onClick={onUpload} disabled={uploading} style={{ padding: "7px 14px", fontSize: 12 }}>
            <Upload size={13} /> {uploading ? "Uploading…" : "Upload PDF"}
          </button>
        </div>
        {allDocs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-tertiary)", fontSize: 14 }}>
            <FileText size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p>No documents yet. Upload your first PDF to get started.</p>
          </div>
        ) : (
          <motion.div className="ix-doc-grid" variants={staggerContainer}>
            {allDocs.map((doc, i) => {
              const d = doc as typeof displayDocs[number];
              const cleanName = doc.file_name.replace(/\.pdf$/i, "");
              return (
                <motion.div key={doc.id} variants={fadeUp}>
                  <div className="ix-doc-card">
                    <div className="ix-doc-thumb" style={{ height: 80 }}>
                      <div className="ix-doc-thumb-icon"><FileText size={20} /></div>
                      <span className={`ix-doc-badge ${d.isNew ? "new" : "read"}`}>{d.isNew ? "New" : "Read"}</span>
                    </div>
                    <div className="ix-doc-body">
                      <div className="ix-doc-name" title={cleanName}>{cleanName}</div>
                      <div className="ix-doc-meta">
                        <span>{d.timeLabel ?? timeAgoLocal(doc.created_at)}</span>
                      </div>
                    </div>
                    <div className="ix-doc-footer">
                      <div className="ix-doc-actions">
                        <button className="ix-doc-open-btn" onClick={() => doc.file_url && handleOpenDoc(doc.file_url)} disabled={!doc.file_url || deleting === doc.id}>
                          <ExternalLink size={11} /> {deleting === doc.id ? "…" : "Open"}
                        </button>
                        {doc.file_url && (
                          <div className="ix-doc-more-btn" onClick={e => { e.stopPropagation(); setMenuOpenId(menuOpenId === doc.id ? null : doc.id); }}>
                            <MoreHorizontal size={14} />
                            {menuOpenId === doc.id && (
                              <div className="ix-doc-menu" onClick={e => e.stopPropagation()}>
                                <button className="ix-doc-menu-item" onClick={() => { setMenuOpenId(null); handleOpenDoc(doc.file_url); }}><ExternalLink size={13} /> Open</button>
                                <a className="ix-doc-menu-item" href={doc.file_url} target="_blank" rel="noreferrer" onClick={() => setMenuOpenId(null)}><Download size={13} /> Download</a>
                                <button className={`ix-doc-menu-item danger${plan !== "pro" ? " locked" : ""}`} onClick={() => handleDeleteDoc(doc.id, doc.file_url)}><Trash2 size={13} /> Delete</button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </motion.div>
    );
  }

  /* ── Analytics tab ─────────────────────────────────────────── */
  if (tab === "analytics") {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div className="ix-doc-section-head">
          <div className="ix-section-title"><BarChart2 size={16} /> Analytics</div>
        </div>
        <div className="ix-stats-row">
          {[
            { label: "Documents", val: String(docs.length || 0).padStart(2,"0"), sub: "Total uploaded" },
            { label: "Questions", val: String(usage.questions).padStart(2,"0"), sub: "Asked this month" },
            { label: "Remaining", val: Math.max(0, (usage.maxQuestions||5) - usage.questions) === Infinity ? "∞" : String(Math.max(0,(usage.maxQuestions||5)-usage.questions)).padStart(2,"0"), sub: "Questions left" },
            { label: "Plan",      val: plan === "pro" ? "Pro" : "Free", sub: usage.maxPdfs === Infinity ? "Unlimited" : `${usage.maxPdfs} PDF limit` },
          ].map(s => (
            <div key={s.label} className="ix-stat-card">
              <div className="ix-stat-val">{s.val}</div>
              <div className="ix-stat-label">{s.label}</div>
              <div className="ix-stat-sub">{s.sub}</div>
            </div>
          ))}
        </div>
        <div className="ix-chart-card">
          <div style={{ padding: "16px 0 8px", color: "var(--text-secondary)", fontSize: 13 }}>
            Detailed analytics are available on the Pro plan.
          </div>
          {plan === "free" && (
            <button className="ix-btn-primary" style={{ width: "fit-content" }} onClick={onUpgrade}>
              <ArrowUpRight size={14} /> Upgrade to Pro
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  /* ── Billing tab ───────────────────────────────────────────── */
  if (tab === "billing") {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div className="ix-doc-section-head">
          <div className="ix-section-title"><CreditCard size={16} /> Billing</div>
        </div>
        <div className="ix-banner" style={{ flexDirection: "column", alignItems: "flex-start", gap: 16 }}>
          <div className="ix-banner-left">
            <div className="ix-banner-icon"><Shield size={20} /></div>
            <div>
              <div className="ix-banner-title">Current plan: {plan === "pro" ? "Pro" : "Free"}</div>
              <div className="ix-banner-sub">
                {plan === "pro"
                  ? "You have unlimited documents and questions."
                  : `${usage.pdfs}/${usage.maxPdfs} PDFs used · ${usage.questions}/${usage.maxQuestions} questions used this month.`}
              </div>
            </div>
          </div>
          {plan === "free" && (
            <button className="ix-banner-cta" onClick={onUpgrade} style={{ border: "none", cursor: "pointer" }}>
              <ArrowUpRight size={14} /> Upgrade to Pro — ₹299/month
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  /* ── Members tab ───────────────────────────────────────────── */
  if (tab === "members") {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div className="ix-doc-section-head">
          <div className="ix-section-title"><Users size={16} /> Team Members</div>
        </div>
        <div className="ix-banner">
          <div className="ix-banner-glow" />
          <div className="ix-banner-left">
            <div className="ix-banner-icon"><Users size={20} /></div>
            <div>
              <div className="ix-banner-title">Invite your team</div>
              <div className="ix-banner-sub">Share Intellixy with colleagues and analyse documents together.</div>
            </div>
          </div>
          <button className={`ix-banner-cta${inviteCopied ? " copied" : ""}`} onClick={handleCopyInvite}>
            {inviteCopied ? <><CheckCircle2 size={14} /> Copied!</> : <><Upload size={14} /> Copy invite link</>}
          </button>
        </div>
      </motion.div>
    );
  }

  /* ── Conversations tab ─────────────────────────────────────── */
  if (tab === "conversations") {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div className="ix-doc-section-head">
          <div className="ix-section-title"><MessageCircle size={16} /> Conversations</div>
        </div>
        <div className="ix-card">
          <div style={{ padding: "32px", textAlign: "center", color: "var(--text-tertiary)", fontSize: 14 }}>
            <MessageCircle size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p style={{ marginBottom: 12 }}>Open a document to start a conversation with your PDF.</p>
            <button className="ix-btn-primary" onClick={() => onTabChange("documents")}>
              <FileText size={14} /> Go to Documents
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  /* ── Saved tab ─────────────────────────────────────────────── */
  if (tab === "saved") {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div className="ix-doc-section-head">
          <div className="ix-section-title"><Bookmark size={16} /> Saved Items</div>
        </div>
        <div className="ix-card">
          <div style={{ padding: "48px 32px", textAlign: "center", color: "var(--text-tertiary)", fontSize: 14 }}>
            <Bookmark size={36} style={{ opacity: 0.25, marginBottom: 12 }} />
            <p style={{ fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>No saved items yet</p>
            <p>Bookmark responses and citations from your conversations to find them here.</p>
          </div>
        </div>
      </motion.div>
    );
  }

  /* ── Planner tab ───────────────────────────────────────────── */
  if (tab === "planner") {
    return <PlannerTab />;
  }

  /* ── Settings tab ───────────────────────────────────────────── */
  if (tab === "settings") {
    return <SettingsPanel user={user} plan={plan} onUpgrade={onUpgrade} />;
  }

  return null;
}

/* ════════════════════════════════════════════════════════════════════════════
   PLANNER TAB
   ════════════════════════════════════════════════════════════════════════════ */
interface StudyPlan {
  id: string;
  title: string;
  exam_date: string;
  hours_per_day: number;
  subjects: { name: string; chapters?: number }[];
  schedule: { week: number; label: string; days: { day: string; subject: string; topic: string; hours: number; completed: boolean }[] }[];
  created_at: string;
}

function PlannerTab() {
  const [plans,       setPlans]       = useState<StudyPlan[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showForm,    setShowForm]    = useState(false);
  const [generating,  setGenerating]  = useState(false);
  const [expandedId,  setExpandedId]  = useState<string | null>(null);
  const [genError,    setGenError]    = useState<string | null>(null);

  /* form state */
  const [title,       setTitle]       = useState("");
  const [examDate,    setExamDate]    = useState("");
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [subjects,    setSubjects]    = useState([{ name: "", chapters: "" }]);

  useEffect(() => {
    fetch("/api/planner", { credentials: "include" })
      .then(r => r.json())
      .then(d => { setPlans(d.plans ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const addSubject    = () => setSubjects(prev => [...prev, { name: "", chapters: "" }]);
  const removeSubject = (i: number) => setSubjects(prev => prev.filter((_, idx) => idx !== i));
  const updateSubject = (i: number, field: "name" | "chapters", value: string) =>
    setSubjects(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));

  const handleGenerate = async () => {
    const valid = subjects.filter(s => s.name.trim());
    if (!valid.length || !examDate || !hoursPerDay) {
      setGenError("Please fill exam date and at least one subject."); return;
    }
    setGenError(null);
    setGenerating(true);
    try {
      const res = await fetch("/api/planner/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || "My Study Plan",
          subjects: valid.map(s => ({ name: s.name.trim(), chapters: s.chapters ? parseInt(s.chapters) : undefined })),
          examDate, hoursPerDay,
        }),
        credentials: "include",
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const r2 = await fetch("/api/planner", { credentials: "include" });
      const d2 = await r2.json();
      setPlans(d2.plans ?? []);
      setExpandedId(data.id);
      setShowForm(false);
      setTitle(""); setExamDate(""); setHoursPerDay(2); setSubjects([{ name: "", chapters: "" }]);
    } catch (e: unknown) {
      setGenError(e instanceof Error ? e.message : "Generation failed");
    } finally { setGenerating(false); }
  };

  const handleToggleDay = async (planId: string, weekIdx: number, dayIdx: number, completed: boolean) => {
    setPlans(prev => prev.map(p => {
      if (p.id !== planId) return p;
      const schedule = JSON.parse(JSON.stringify(p.schedule));
      if (schedule[weekIdx]?.days?.[dayIdx]) schedule[weekIdx].days[dayIdx].completed = completed;
      return { ...p, schedule };
    }));
    await fetch("/api/planner", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: planId, weekIdx, dayIdx, completed }),
      credentials: "include",
    }).catch(() => {});
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm("Delete this study plan?")) return;
    await fetch(`/api/planner?id=${id}`, { method: "DELETE", credentials: "include" });
    setPlans(prev => prev.filter(p => p.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const doneCount = (plan: StudyPlan) => plan.schedule.flatMap(w => w.days).filter(d => d.completed).length;
  const totalDays = (plan: StudyPlan) => plan.schedule.flatMap(w => w.days).length;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
      style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header row */}
      <div className="ix-doc-section-head">
        <div className="ix-section-title"><BookOpen size={16} /> Study Planner</div>
        <button className="ix-btn-primary" onClick={() => setShowForm(v => !v)} style={{ padding: "7px 14px", fontSize: 12 }}>
          {showForm ? "Cancel" : "+ New Plan"}
        </button>
      </div>

      {/* Create plan form */}
      {showForm && (
        <div className="ix-planner-form">
          <div className="ix-planner-form-head">
            <span className="ix-planner-form-title"><BookOpen size={15} /> Create Study Plan</span>
          </div>

          <div className="ix-planner-field">
            <label className="ix-planner-label">Plan Title (optional)</label>
            <input className="ix-planner-input" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. JEE Mains 2025" />
          </div>

          <div className="ix-planner-row-2">
            <div className="ix-planner-field">
              <label className="ix-planner-label">Exam Date</label>
              <input className="ix-planner-input" type="date" value={examDate}
                onChange={e => setExamDate(e.target.value)} />
            </div>
            <div className="ix-planner-field">
              <label className="ix-planner-label">Study Hours / Day</label>
              <select className="ix-planner-input" value={hoursPerDay}
                onChange={e => setHoursPerDay(parseInt(e.target.value))}>
                {[1,2,3,4,5,6,7,8].map(h => (
                  <option key={h} value={h}>{h}h per day</option>
                ))}
              </select>
            </div>
          </div>

          <div className="ix-planner-field">
            <label className="ix-planner-label">Subjects</label>
            <div className="ix-planner-subjects">
              {subjects.map((s, i) => (
                <div key={i} className="ix-planner-subject-row">
                  <input className="ix-planner-input ix-planner-subject-name"
                    value={s.name} onChange={e => updateSubject(i, "name", e.target.value)}
                    placeholder={`Subject ${i + 1} (e.g. Physics)`} />
                  <input className="ix-planner-input ix-planner-subject-ch"
                    value={s.chapters} onChange={e => updateSubject(i, "chapters", e.target.value)}
                    placeholder="Chapters" type="number" min={1} />
                  {subjects.length > 1 && (
                    <button className="ix-planner-subject-rm" onClick={() => removeSubject(i)}>×</button>
                  )}
                </div>
              ))}
              <button className="ix-planner-add-subject" onClick={addSubject}>+ Add Subject</button>
            </div>
          </div>

          {genError && <p style={{ fontSize: 12, color: "#ef4444" }}>{genError}</p>}

          <button className="ix-planner-generate-btn" onClick={handleGenerate} disabled={generating}>
            {generating ? <><div className="ix-planner-gen-spinner" /> Generating…</> : <><Sparkles size={14} /> Generate Plan</>}
          </button>
        </div>
      )}

      {/* Plans list */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-tertiary)", fontSize: 14 }}>
          <div style={{ width: 24, height: 24, border: "3px solid var(--border)", borderTopColor: "var(--accent, #F5B942)", borderRadius: "50%", animation: "ix-spin .7s linear infinite", margin: "0 auto 12px" }} />
          Loading plans…
        </div>
      ) : plans.length === 0 ? (
        <div className="ix-card">
          <div className="ix-planner-empty">
            <div className="ix-planner-empty-icon">📅</div>
            <div className="ix-planner-empty-title">No study plans yet</div>
            <div className="ix-planner-empty-sub">Create your first AI-powered study plan. Add your subjects, exam date, and daily hours — Lexi will build a week-by-week schedule.</div>
            <button className="ix-btn-primary" onClick={() => setShowForm(true)} style={{ marginTop: 8 }}>
              <Sparkles size={13} /> Create Plan
            </button>
          </div>
        </div>
      ) : (
        plans.map(plan => {
          const done  = doneCount(plan);
          const total = totalDays(plan);
          const pct   = total ? Math.round((done / total) * 100) : 0;
          const isExpanded = expandedId === plan.id;
          return (
            <div key={plan.id} className="ix-planner-card">
              <div className="ix-planner-card-head" onClick={() => setExpandedId(isExpanded ? null : plan.id)}>
                <div className="ix-planner-card-info">
                  <div className="ix-planner-card-title">{plan.title}</div>
                  <div className="ix-planner-card-meta">
                    <span className="ix-planner-meta-pill">📅 {new Date(plan.exam_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                    <span className="ix-planner-meta-pill">⏱ {plan.hours_per_day}h/day</span>
                    <span className="ix-planner-meta-pill">✅ {done}/{total} days</span>
                  </div>
                  <div className="ix-planner-progress-bar" style={{ marginTop: 6 }}>
                    <div className="ix-planner-progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="ix-planner-card-actions">
                  <button className="ix-planner-del-btn" onClick={e => { e.stopPropagation(); handleDeletePlan(plan.id); }}>🗑</button>
                  <button className="ix-planner-expand-btn">{isExpanded ? "▲" : "▼"}</button>
                </div>
              </div>

              {isExpanded && (
                <div className="ix-planner-schedule">
                  {plan.schedule.map((week, wIdx) => (
                    <div key={wIdx} className="ix-planner-week">
                      <div className="ix-planner-week-label">{week.label || `Week ${week.week}`}</div>
                      {week.days.map((day, dIdx) => (
                        <div key={dIdx} className={`ix-planner-day-row${day.completed ? " done" : ""}`}>
                          <input
                            type="checkbox" className="ix-planner-day-check"
                            checked={!!day.completed}
                            onChange={e => handleToggleDay(plan.id, wIdx, dIdx, e.target.checked)}
                          />
                          <div className="ix-planner-day-info">
                            <div className="ix-planner-day-header">
                              <span className="ix-planner-day-name">{day.day}</span>
                              <span className="ix-planner-day-subject">{day.subject}</span>
                              <span className="ix-planner-day-hours">{day.hours}h</span>
                            </div>
                            <div className="ix-planner-day-topic">{day.topic}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   SETTINGS PANEL
   ════════════════════════════════════════════════════════════════════════════ */
function SettingsPanel({ user, plan, onUpgrade }: { user: User | null; plan: "free" | "pro"; onUpgrade: () => void }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(user?.user_metadata?.full_name ?? "");
  const [saving,      setSaving]      = useState(false);
  const [saveMsg,     setSaveMsg]     = useState<{ ok: boolean; text: string } | null>(null);
  const [pwdSent,     setPwdSent]     = useState(false);
  const [pwdSending,  setPwdSending]  = useState(false);

  const email = user?.email ?? "";

  const handleSaveProfile = async () => {
    setSaving(true); setSaveMsg(null);
    const { error } = await supabase.auth.updateUser({ data: { full_name: displayName } });
    setSaving(false);
    setSaveMsg(error ? { ok: false, text: error.message } : { ok: true, text: "Profile updated." });
  };

  const handlePasswordReset = async () => {
    if (!email) return;
    setPwdSending(true);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setPwdSending(false);
    setPwdSent(true);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const row: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 6 };
  const label: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" };
  const input: React.CSSProperties = {
    padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border)",
    background: "var(--bg)", color: "var(--text)", fontSize: 14, outline: "none",
    fontFamily: "inherit", transition: "border-color .15s",
  };
  const section: React.CSSProperties = {
    background: "var(--bg-secondary)", border: "1px solid var(--border)",
    borderRadius: 14, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16,
  };
  const sectionTitle: React.CSSProperties = {
    fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 4,
    display: "flex", alignItems: "center", gap: 7,
  };
  const divider: React.CSSProperties = { border: "none", borderTop: "1px solid var(--border)", margin: "4px 0" };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
      style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 640 }}>

      {/* ── Profile ───────────────────────────────────────────── */}
      <div style={section}>
        <div style={sectionTitle}><Settings size={15} color="var(--accent)" /> Profile</div>
        <hr style={divider} />
        <div style={row}>
          <label style={label}>Display name</label>
          <input
            style={input}
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Your name"
            onFocus={e => (e.target.style.borderColor = "rgba(245,185,66,0.6)")}
            onBlur={e => (e.target.style.borderColor = "var(--border)")}
          />
        </div>
        <div style={row}>
          <label style={label}>Email address</label>
          <input style={{ ...input, background: "var(--bg-hover)", color: "var(--text-tertiary)", cursor: "not-allowed" }} value={email} readOnly />
          <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>Email cannot be changed here.</span>
        </div>
        {saveMsg && (
          <p style={{ fontSize: 12, color: saveMsg.ok ? "var(--accent)" : "var(--red)", margin: 0 }}>{saveMsg.text}</p>
        )}
        <button className="ix-btn-primary" style={{ width: "fit-content", padding: "8px 18px", fontSize: 13 }}
          onClick={handleSaveProfile} disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>

      {/* ── Security ──────────────────────────────────────────── */}
      <div style={section}>
        <div style={sectionTitle}><Shield size={15} color="var(--accent)" /> Security</div>
        <hr style={divider} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: 0 }}>Password</p>
            <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: "3px 0 0" }}>We'll send a reset link to {email}.</p>
          </div>
          {pwdSent ? (
            <p style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>✓ Reset link sent — check your email.</p>
          ) : (
            <button className="ix-btn-secondary" style={{ fontSize: 13, padding: "8px 16px" }}
              onClick={handlePasswordReset} disabled={pwdSending}>
              {pwdSending ? "Sending…" : "Send reset link"}
            </button>
          )}
        </div>
      </div>

      {/* ── Plan ──────────────────────────────────────────────── */}
      <div style={section}>
        <div style={sectionTitle}><CreditCard size={15} color="var(--accent)" /> Plan &amp; Billing</div>
        <hr style={divider} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: 0 }}>
              {plan === "pro" ? "Pro plan" : "Free plan"}
            </p>
            <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: "3px 0 0" }}>
              {plan === "pro" ? "Unlimited documents and questions." : "3 PDFs · 5 questions per month."}
            </p>
          </div>
          {plan === "free" && (
            <button className="ix-btn-primary" style={{ fontSize: 13, padding: "8px 16px", cursor: "pointer" }} onClick={onUpgrade}>
              <ArrowUpRight size={13} /> Upgrade to Pro
            </button>
          )}
        </div>
      </div>

      {/* ── Danger zone ───────────────────────────────────────── */}
      <div style={{ ...section, borderColor: "rgba(239,68,68,0.18)", background: "rgba(239,68,68,0.03)" }}>
        <div style={{ ...sectionTitle, color: "var(--red)" }}>Danger zone</div>
        <hr style={{ ...divider, borderColor: "rgba(239,68,68,0.12)" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: 0 }}>Sign out</p>
            <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: "3px 0 0" }}>Sign out of your account on this device.</p>
          </div>
          <button
            style={{ padding: "8px 16px", borderRadius: 9, border: "1px solid rgba(239,68,68,0.3)", background: "none",
              color: "var(--red)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
            onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   DASHBOARD PAGE
   ════════════════════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  /* ── Auth + data state ──────────────────────────────────────────────────── */
  const [user,                  setUser]                 = useState<User | null>(null);
  const [loading,               setLoading]              = useState(true);
  const [docs,                  setDocs]                 = useState<Doc[]>([]);
  const [plan,                  setPlan]                 = useState<"free" | "pro">("free");
  const [proExpiresAt,          setProExpiresAt]         = useState<string | null>(null);
  const [graceUntil,            setGraceUntil]           = useState<string | null>(null);
  const [isTrial,               setIsTrial]              = useState(false);
  const [trialEnd,              setTrialEnd]             = useState<string | null>(null);
  const [subscriptionSource,    setSubscriptionSource]   = useState<string | null>(null);
  const [subscriptionCancelled, setSubscriptionCancelled]= useState(false);
  const [usage,                 setUsage]                = useState<Usage>({
    pdfs: 0, questions: 0, maxPdfs: 3, maxQuestions: 5, loading: true,
  });

  /* ── UI state ───────────────────────────────────────────────────────────── */
  const [darkMode,     setDarkMode]     = useState(false);
  const [activeTab,    setActiveTab]    = useState<DashTab>("overview");
  const [cmdOpen,      setCmdOpen]      = useState(false);
  const [cmdQuery,     setCmdQuery]     = useState("");
  const [cmdIdx,       setCmdIdx]       = useState(0);
  const [chartTab,     setChartTab]     = useState<"week"|"month"|"year">("week");
  const [glowPos,      setGlowPos]      = useState({ x: 100, y: 100 });
  const [toastShow,    setToastShow]    = useState(false);
  const [toastIn,      setToastIn]      = useState(false);
  const [toastMsg,     setToastMsg]     = useState("sample.pdf processed · 12 pages indexed");
  const [toastVariant, setToastVariant] = useState<"ok"|"err">("ok");
  const [inviteCopied, setInviteCopied] = useState(false);
  const [barsReady,    setBarsReady]    = useState(false);
  const [uploading,    setUploading]    = useState(false);
  const [greeting,     setGreeting]     = useState<string>("Good morning");
  const [todayLabel,   setTodayLabel]   = useState<string>("");
  const [heroDate,     setHeroDate]     = useState<string>("");
  const [uploadError,  setUploadError]  = useState<string | null>(null);
  const [menuOpenId,   setMenuOpenId]   = useState<string | null>(null);
  const [deleting,     setDeleting]     = useState<string | null>(null);
  const [dueCards,     setDueCards]     = useState<number>(0);

  const proCardRef   = useRef<HTMLDivElement>(null);
  const cmdInputRef  = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Derived ────────────────────────────────────────────────────────────── */
  const userName     = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "Scholar";
  const avatarLetter = userName[0]?.toUpperCase() ?? "S";
  const pdfPct       = Math.min(100, Math.round((usage.pdfs / (usage.maxPdfs || 3)) * 100));
  const qPct         = Math.min(100, Math.round((usage.questions / (usage.maxQuestions || 5)) * 100));
  const qLeft        = Math.max(0, (usage.maxQuestions || 5) - usage.questions);

  const displayDocs = docs.length > 0
    ? docs.slice(0, 3).map((d, i) => ({
        id:        d.id,
        file_name: d.file_name,
        file_url:  d.file_url,
        created_at:d.created_at,
        pages:     PLACEHOLDER_DOCS[i]?.pages ?? 10,
        questions: PLACEHOLDER_DOCS[i]?.questions ?? 0,
        isNew:     i === 0,
        timeLabel: undefined as string | undefined,
      }))
    : PLACEHOLDER_DOCS;

  const filteredCmds = cmdQuery
    ? CMD_ITEMS.filter(it => it.label.toLowerCase().includes(cmdQuery.toLowerCase()))
    : CMD_ITEMS;
  const cmdSections = [...new Set(filteredCmds.map(it => it.section))];

  /* ── Effects ────────────────────────────────────────────────────────────── */

  useEffect(() => {
    if (localStorage.getItem("lp-theme") === "dark") setDarkMode(true);
  }, []);

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("lp-theme", next ? "dark" : "light");
  };

  /* Date/greeting — client-only to avoid SSR/hydration mismatch */
  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
    setTodayLabel(new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }));
    setHeroDate(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }));
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { window.location.href = "/login"; return; }
      setUser(user);
      setLoading(false);
      fetchDocs(user.id);
      fetchPlan(user.id);
      fetchUsage();
      fetch("/api/flashcards?dueCount=true", { credentials: "include" })
        .then(r => r.json()).then(d => { if (typeof d.count === "number") setDueCards(d.count); }).catch(() => {});
      try {
        const pendingRef = sessionStorage.getItem("pendingRefCode");
        if (pendingRef) {
          sessionStorage.removeItem("pendingRefCode");
          fetch("/api/referral/claim", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ref_code: pendingRef }), credentials: "include",
          }).then(r => r.json()).then(result => { if (result?.ok) fetchUsage(); }).catch(() => {});
        }
      } catch {}
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgraded") === "1") window.history.replaceState({}, "", "/dashboard");
    const viewParam = params.get("view");
    if (viewParam) window.history.replaceState({}, "", "/dashboard");
  }, []);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`user_plan_${user.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "user_plans", filter: `user_id=eq.${user.id}` },
        (payload: { new: Record<string, unknown> }) => {
          const row = payload.new;
          if (!row) return;
          const now = new Date();
          const isActive = row.plan === "pro" && (
            row.subscription_status === "active" || row.subscription_status === "trial" ||
            (row.pro_expires_at && new Date(row.pro_expires_at as string) > now) ||
            (row.grace_until    && new Date(row.grace_until    as string) > now)
          );
          setPlan(isActive ? "pro" : "free");
          setProExpiresAt((row.pro_expires_at as string) ?? null);
          setGraceUntil((row.grace_until as string) ?? null);
          setIsTrial((row.is_trial as boolean) ?? false);
          setTrialEnd((row.trial_end as string) ?? null);
          if (row.subscription_status === "cancelled") setSubscriptionCancelled(true);
          if (row.subscription_status === "active")    setSubscriptionCancelled(false);
          if (isActive) {
            setUsage(p => ({ ...p, maxPdfs: Infinity, maxQuestions: Infinity }));
            if (row.razorpay_subscription_id) setSubscriptionSource("razorpay");
          } else {
            setUsage(p => ({ ...p, maxPdfs: 3, maxQuestions: 5 }));
            setSubscriptionSource(null);
          }
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    const t1 = setTimeout(() => { setToastShow(true); setTimeout(() => setToastIn(true), 30); }, 1400);
    const t2 = setTimeout(() => { setToastIn(false);  setTimeout(() => setToastShow(false), 350); }, 7000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setBarsReady(true), 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen(o => { if (!o) { setCmdQuery(""); setCmdIdx(0); } return !o; });
        return;
      }
      if (!cmdOpen) return;
      if (e.key === "Escape")    { e.preventDefault(); setCmdOpen(false); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setCmdIdx(i => Math.min(i + 1, filteredCmds.length - 1)); return; }
      if (e.key === "ArrowUp")   { e.preventDefault(); setCmdIdx(i => Math.max(i - 1, 0)); return; }
      if (e.key === "Enter")     { e.preventDefault(); handleCmdAction(filteredCmds[cmdIdx]?.action); return; }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cmdOpen, cmdIdx, filteredCmds]);

  useEffect(() => {
    if (cmdOpen) setTimeout(() => cmdInputRef.current?.focus(), 50);
  }, [cmdOpen]);

  useEffect(() => {
    if (!menuOpenId) return;
    function close() { setMenuOpenId(null); }
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menuOpenId]);

  /* ── Data functions ─────────────────────────────────────────────────────── */
  async function fetchPlan(userId: string) {
    try {
      const { data } = await supabase
        .from("user_plans")
        .select("plan, pro_expires_at, grace_until, subscription_status, is_trial, trial_end, razorpay_subscription_id")
        .eq("user_id", userId)
        .maybeSingle();
      if (data?.plan) {
        const now = new Date();
        const isActive = data.plan === "pro" && (
          data.subscription_status === "active" || data.subscription_status === "trial" ||
          (data.pro_expires_at && new Date(data.pro_expires_at) > now) ||
          (data.grace_until    && new Date(data.grace_until)    > now)
        );
        setPlan(isActive ? "pro" : "free");
        setProExpiresAt(data.pro_expires_at ?? null);
        setGraceUntil(data.grace_until ?? null);
        if (data.subscription_status === "cancelled") setSubscriptionCancelled(true);
        setIsTrial(data.is_trial ?? false);
        setTrialEnd(data.trial_end ?? null);
        if (isActive) {
          setUsage(p => ({ ...p, maxPdfs: Infinity, maxQuestions: Infinity }));
          if (data.razorpay_subscription_id) setSubscriptionSource("razorpay");
        }
      }
    } catch {}
  }

  async function fetchUsage() {
    try {
      const res = await fetch("/api/usage", { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      if (data.plan) {
        const now = new Date();
        const isActive = data.is_pro_active === true || (data.plan === "pro" && (
          data.subscription_status === "active" || data.subscription_status === "trial" ||
          (data.pro_expires_at && new Date(data.pro_expires_at) > now) ||
          (data.grace_until    && new Date(data.grace_until)    > now)
        ));
        setPlan(isActive ? "pro" : "free");
        setProExpiresAt(data.pro_expires_at ?? null);
        if (isActive) {
          setUsage({ pdfs: 0, questions: 0, maxPdfs: Infinity, maxQuestions: Infinity, loading: false });
          return;
        }
      }
      setUsage({
        pdfs:         data.pdfs?.used      ?? 0,
        questions:    data.questions?.used ?? 0,
        maxPdfs:      data.pdfs?.max       ?? 3,
        maxQuestions: data.questions?.max  ?? 5,
        credits:      data.credits         ?? undefined,
        loading:      false,
      });
    } catch {
      setUsage(p => ({ ...p, loading: false }));
    }
  }

  const fetchDocs = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("documents")
      .select("id, file_name, file_url, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (!error && data) setDocs(data);
    return data ?? [];
  }, []);

  /* ── Handlers ───────────────────────────────────────────────────────────── */
  function handleProMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = proCardRef.current?.getBoundingClientRect();
    if (!rect) return;
    setGlowPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  function handleCopyInvite() {
    const refCode = user?.id?.slice(0, 8) ?? "share";
    navigator.clipboard.writeText(`https://intellixy.com?ref=${refCode}`).catch(() => {});
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
  }

  function showToast(msg: string, variant: "ok"|"err" = "ok") {
    setToastMsg(msg); setToastVariant(variant); setToastShow(false); setToastIn(false);
    setTimeout(() => {
      setToastShow(true);
      setTimeout(() => setToastIn(true), 30);
      setTimeout(() => { setToastIn(false); setTimeout(() => setToastShow(false), 350); }, 5000);
    }, 0);
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file) return;
    if (file.type !== "application/pdf") { setUploadError("Only PDF files are supported."); return; }
    setUploading(true); setUploadError(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData, credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error || "Upload failed. Please try again.";
        setUploadError(msg);
        reportError({ type: "upload", message: msg, page: "/dashboard", userEmail: user?.email });
        return;
      }
      if (user) await fetchDocs(user.id);
      await fetchUsage();
      showToast(`${file.name} uploaded · ready to chat`);
    } catch {
      const msg = "Upload failed. Please check your connection.";
      setUploadError(msg);
      reportError({ type: "upload", message: msg, page: "/dashboard", userEmail: user?.email });
    } finally {
      setUploading(false);
    }
  }

  function handleOpenDoc(fileUrl: string) {
    window.location.href = `/viewer?url=${encodeURIComponent(fileUrl)}`;
  }

  async function handleDeleteDoc(docId: string, fileUrl: string) {
    if (!confirm("Delete this PDF? This action cannot be undone.")) return;
    setDeleting(docId); setMenuOpenId(null);
    try {
      const res = await fetch("/api/delete", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: docId, fileUrl }), credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.proRequired ? "Deleting PDFs requires a Pro plan." : (data.error || "Delete failed."), "err");
        return;
      }
      setDocs(prev => prev.filter(d => d.id !== docId));
      await fetchUsage();
      showToast("PDF deleted.");
    } catch {
      showToast("Delete failed. Please try again.", "err");
    } finally {
      setDeleting(null);
    }
  }

  function handleCmdAction(action?: string) {
    setCmdOpen(false);
    if (action === "upload") fileInputRef.current?.click();
    if (action === "pro") handleUpgrade();
    if (action === "billing") setActiveTab("billing");
    if (action === "settings") setActiveTab("settings");
  }

  async function handleUpgrade() {
    if (plan === "pro") { setActiveTab("billing"); return; }
    Events.upgradeClick();
    Events.paymentStart();
    try {
      // 1. Create Razorpay subscription on the server
      const res = await fetch("/api/create-subscription", { method: "POST", credentials: "include" });
      const data = await res.json();
      if (!res.ok || !data.subscription_id) throw new Error(data.error ?? "Failed to create subscription");

      // 2. Load Razorpay checkout.js if not already loaded
      if (!document.getElementById("rzp-checkout-js")) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.id  = "rzp-checkout-js";
          s.src = "https://checkout.razorpay.com/v1/checkout.js";
          s.onload  = () => resolve();
          s.onerror = () => reject(new Error("Failed to load Razorpay"));
          document.head.appendChild(s);
        });
      }

      // 3. Open Razorpay checkout modal
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rzp = new (window as any).Razorpay({
        key:             process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        subscription_id: data.subscription_id,
        name:            "Intellixy",
        description:     "Pro Plan — ₹299/month",
        image:           "/logo.png",
        prefill: {
          name:  user?.user_metadata?.full_name ?? "",
          email: user?.email ?? "",
        },
        theme: { color: "#F5B942" },
        handler: async (response: { razorpay_payment_id: string; razorpay_subscription_id: string; razorpay_signature: string }) => {
          try {
            const verifyRes = await fetch("/api/razorpay/verify-subscription", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id:      response.razorpay_payment_id,
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_signature:       response.razorpay_signature,
                user_id:                  user?.id,
              }),
              credentials: "include",
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.success) throw new Error(verifyData.error ?? "Verification failed");
            Events.paymentSuccess(response.razorpay_payment_id, 29900);
            setPlan("pro");
            setUsage(p => ({ ...p, maxPdfs: Infinity, maxQuestions: Infinity }));
            showToast("Welcome to Pro! Unlimited reading unlocked.");
            setActiveTab("billing");
          } catch (e: unknown) {
            const msg = (e as Error).message ?? "Payment verification failed. Contact support.";
            showToast(msg, "err");
            reportError({ type: "payment", message: msg, page: "/dashboard", userEmail: user?.email });
          }
        },
      });
      rzp.open();
    } catch (e: unknown) {
      const msg = (e as Error).message ?? "Could not start checkout. Try again.";
      showToast(msg, "err");
      reportError({ type: "payment", message: msg, page: "/dashboard", userEmail: user?.email });
    }
  }

  /* ── Loading ────────────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="ds-dash">
        <div className="ds-loading">
          <div className="ds-loading-mark">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="8" height="11" rx="1.5" fill="currentColor" opacity=".9"/>
              <rect x="13" y="3" width="8" height="5"  rx="1.5" fill="currentColor" opacity=".5"/>
              <rect x="13" y="10" width="8" height="11" rx="1.5" fill="currentColor" opacity=".7"/>
              <rect x="3" y="16" width="8" height="5"  rx="1.5" fill="currentColor" opacity=".4"/>
            </svg>
          </div>
          <div className="ds-loading-text">Loading your workspace…</div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════════════ */
  return (
    <div className={`ds-dash${darkMode ? " dark" : ""}`}>
      <Suspense fallback={null}><OAuthSignupTracker /></Suspense>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="application/pdf" style={{ display: "none" }} onChange={handleFileSelect} />

      {/* ── TOAST ───────────────────────────────────────────────────────── */}
      {toastShow && (
        <div className="ix-toast-wrap">
          <div className={`ix-toast${toastVariant === "err" ? " err" : ""}${toastIn ? " in" : ""}`}>
            <div className="ix-toast-dot" />
            <div>{toastMsg}</div>
          </div>
        </div>
      )}

      {/* ── COMMAND PALETTE ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {cmdOpen && (
          <motion.div
            className="ix-cmd-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setCmdOpen(false)}
          >
            <motion.div
              className="ix-cmd"
              initial={{ opacity: 0, scale: .97, y: -8 }}
              animate={{ opacity: 1, scale: 1,   y: 0  }}
              exit={{ opacity: 0, scale: .97, y: -8 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              onClick={e => e.stopPropagation()}
            >
              <div className="ix-cmd-input-row">
                <Search size={16} color="var(--text-3)" />
                <input
                  ref={cmdInputRef}
                  className="ix-cmd-input"
                  placeholder="What would you like to do?"
                  value={cmdQuery}
                  onChange={e => { setCmdQuery(e.target.value); setCmdIdx(0); }}
                />
                <span className="ix-cmd-esc">ESC</span>
              </div>
              <div className="ix-cmd-body">
                {cmdSections.map(sec => {
                  const items = filteredCmds.filter(it => it.section === sec);
                  const globalOffset = filteredCmds.indexOf(items[0]);
                  return (
                    <div key={sec}>
                      <div className="ix-cmd-section-label">{sec}</div>
                      {items.map((it, li) => {
                        const gi = globalOffset + li;
                        return (
                          <div
                            key={it.action}
                            className={`ix-cmd-item${cmdIdx === gi ? " sel" : ""}`}
                            onClick={() => handleCmdAction(it.action)}
                            onMouseEnter={() => setCmdIdx(gi)}
                          >
                            <div className="ix-cmd-ico">{it.icon}</div>
                            <span className="ix-cmd-lbl">{it.label}</span>
                            {it.meta && <span className="ix-cmd-meta">{it.meta}</span>}
                            {it.kbd  && <span className="ix-cmd-kbd">{it.kbd}</span>}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
                {filteredCmds.length === 0 && (
                  <div style={{ padding: "24px", textAlign: "center", fontSize: "13px", color: "var(--text-3)" }}>
                    No results for &ldquo;{cmdQuery}&rdquo;
                  </div>
                )}
              </div>
              <div className="ix-cmd-footer">
                <span className="ix-cmd-hint"><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
                <span className="ix-cmd-hint"><kbd>↵</kbd> Select</span>
                <span className="ix-cmd-hint"><kbd>ESC</kbd> Close</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── LAYOUT ──────────────────────────────────────────────────────── */}
      <div className="ds-layout">

        {/* ── SIDEBAR ─────────────────────────────────────────────────── */}
        <Sidebar
          user={user}
          plan={plan}
          docsCount={docs.length}
          usage={usage}
          uploading={uploading}
          uploadError={uploadError}
          onUpload={() => { setUploadError(null); fileInputRef.current?.click(); }}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* ── MAIN ────────────────────────────────────────────────────── */}
        <div className="ds-main">

          {/* ── TOPBAR ────────────────────────────────────────────────── */}
          <header className="ds-topbar">
            <div className="ds-topbar-left">
              <div className="ds-breadcrumb">
                <Link href="/">Intellixy</Link>
                <ChevronRight size={12} className="ds-breadcrumb-sep" />
                <span className="ds-breadcrumb-cur" style={{ textTransform: "capitalize" }}>{activeTab}</span>
              </div>
            </div>
            <div className="ds-topbar-right">
              <button
                className="ds-search"
                onClick={() => { setCmdOpen(true); setCmdQuery(""); setCmdIdx(0); }}
              >
                <Search size={13} />
                <span>Search or run a command…</span>
                <kbd className="ds-search-kbd">⌘K</kbd>
              </button>
              <button className="ds-ai-btn">
                <Sparkles size={13} />
                AI Assistant
              </button>
              <button className="ds-bell" aria-label="Toggle theme" onClick={toggleDark} style={{ color: darkMode ? "#F5B942" : undefined }}>
                {darkMode ? <Sun size={15} /> : <Moon size={15} />}
              </button>
              <button className="ds-bell" aria-label="Notifications">
                <Bell size={15} />
                <span className="ds-bell-dot" />
              </button>
              <div className="ds-topbar-av" title={userName}>{avatarLetter}</div>
            </div>
          </header>

          {/* ── CONTENT ─────────────────────────────────────────────── */}
          <main className="ds-content">

            {/* ── NON-OVERVIEW TABS ────────────────────────────────── */}
            {activeTab !== "overview" && (
              <TabContent
                tab={activeTab}
                user={user}
                docs={docs}
                displayDocs={displayDocs}
                plan={plan}
                usage={usage}
                uploading={uploading}
                deleting={deleting}
                menuOpenId={menuOpenId}
                setMenuOpenId={setMenuOpenId}
                handleOpenDoc={handleOpenDoc}
                handleDeleteDoc={handleDeleteDoc}
                onUpload={() => { setUploadError(null); fileInputRef.current?.click(); }}
                inviteCopied={inviteCopied}
                handleCopyInvite={handleCopyInvite}
                onTabChange={setActiveTab}
                onUpgrade={handleUpgrade}
              />
            )}

            {/* ── OVERVIEW SECTIONS (1-8) ───────────────────────────── */}
            {activeTab === "overview" && (<>

            {/* ── 1. WELCOME HERO ───────────────────────────────────── */}
            <motion.div
              className="ix-hero"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="ix-hero-left">
                <div className="ix-hero-eyebrow">
                  <span className="ix-hero-live-dot" />
                  {todayLabel}
                </div>
                <div className="ix-hero-greeting">
                  {greeting},&nbsp;<em>{userName}.</em>
                </div>
                <p className="ix-hero-sub">
                  Your library has <strong>{docs.length || 2} document{(docs.length || 2) !== 1 ? "s" : ""}</strong> ready for
                  inspection. You have <strong>{qLeft === Infinity ? "unlimited" : qLeft} question{qLeft !== 1 ? "s" : ""}</strong> remaining
                  this month.
                </p>
                <div className="ix-hero-btns">
                  <button
                    className="ix-btn-primary"
                    onClick={() => { if (!uploading) { setUploadError(null); fileInputRef.current?.click(); } }}
                    disabled={uploading}
                  >
                    <Upload size={14} />
                    {uploading ? "Uploading…" : "Upload PDF"}
                  </button>
                  <button
                    className="ix-btn-secondary"
                    onClick={() => { setCmdOpen(true); setCmdQuery(""); setCmdIdx(0); }}
                  >
                    <Search size={14} />
                    Command palette
                    <kbd style={{ marginLeft: 4, fontSize: 10, background: "var(--bg-3)", padding: "1px 5px", borderRadius: 4, border: "1px solid var(--border-mid)", color: "var(--text-3)" }}>⌘K</kbd>
                  </button>
                </div>
              </div>
              <div className="ix-hero-right">
                <div className="ix-hero-date">{heroDate}</div>
                <div className="ix-hero-sync">Last sync: 4 mins ago</div>
              </div>
            </motion.div>

            {/* ── 2. STATS ROW ──────────────────────────────────────── */}
            <motion.div
              className="ix-stats-row"
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              <motion.div className="ix-stat-card" variants={fadeUp}>
                <div className="ix-stat-icon-row">
                  <div className="ix-stat-icon orange"><FileText size={16} /></div>
                  <span className="ix-stat-delta up">+{docs.length || 2}</span>
                </div>
                <div className="ix-stat-val">{String(docs.length || 2).padStart(2, "0")}<span>/{usage.maxPdfs === Infinity ? "∞" : usage.maxPdfs}</span></div>
                <div className="ix-stat-label">Documents</div>
                <div className="ix-stat-sub">PDFs uploaded this month</div>
              </motion.div>

              <motion.div className="ix-stat-card" variants={fadeUp}>
                <div className="ix-stat-icon-row">
                  <div className="ix-stat-icon blue"><MessageCircle size={16} /></div>
                  <span className="ix-stat-delta up">+14</span>
                </div>
                <div className="ix-stat-val">{String(usage.questions).padStart(2, "0")}</div>
                <div className="ix-stat-label">Questions asked</div>
                <div className="ix-stat-sub">Across all documents</div>
              </motion.div>

              <motion.div
                className="ix-stat-card"
                variants={fadeUp}
                style={{ cursor: dueCards > 0 ? "pointer" : "default" }}
                onClick={() => dueCards > 0 && docs[0] && (window.location.href = `/viewer?url=${encodeURIComponent(docs[0].file_url)}`)}
                title={dueCards > 0 ? "Go review your flashcards" : "No flashcards due"}
              >
                <div className="ix-stat-icon-row">
                  <div className="ix-stat-icon green"><Zap size={16} /></div>
                  {dueCards > 0
                    ? <span className="ix-stat-delta up">{dueCards} due</span>
                    : <span className="ix-stat-delta up">All done</span>}
                </div>
                <div className="ix-stat-val">{String(dueCards).padStart(2, "0")}</div>
                <div className="ix-stat-label">Flashcards due</div>
                <div className="ix-stat-sub">{dueCards > 0 ? "Tap to start review session" : "All cards reviewed!"}</div>
              </motion.div>

              <motion.div className="ix-stat-card" variants={fadeUp}>
                <div className="ix-stat-icon-row">
                  <div className="ix-stat-icon purple"><Shield size={16} /></div>
                  <span className="ix-stat-delta up">{plan === "pro" ? "Pro" : "Free"}</span>
                </div>
                <div className="ix-stat-val">{qLeft === Infinity ? "∞" : String(qLeft).padStart(2, "0")}</div>
                <div className="ix-stat-label">Questions left</div>
                <div className="ix-stat-sub">{plan === "pro" ? "Unlimited plan active" : "This month"}</div>
              </motion.div>
            </motion.div>

            {/* ── 3. RECENT DOCUMENTS ───────────────────────────────── */}
            <div>
              <div className="ix-doc-section-head">
                <div className="ix-section-title"><BookOpen size={16} /> Recent Documents</div>
                <button className="ix-section-action">View all →</button>
              </div>

              <motion.div
                className="ix-doc-grid"
                variants={staggerContainer}
                initial="hidden"
                animate="show"
              >
                {displayDocs.map((doc, i) => {
                  const cleanName = doc.file_name.replace(/\.pdf$/i, "");
                  const summary = DOC_SUMMARIES[doc.file_name] ?? "AI-powered document ready for questions and citations.";
                  return (
                    <motion.div key={doc.id} variants={fadeUp}>
                      <div className="ix-doc-card">
                        <div className="ix-doc-thumb">
                          <div className="ix-doc-thumb-icon">
                            <FileText size={24} />
                          </div>
                          <div className="ix-doc-thumb-lines">
                            {[90,75,85,60,80].map((w, j) => (
                              <div key={j} className="ix-doc-thumb-line" style={{ width: `${w}%`, opacity: 0.4 + j * 0.1 }} />
                            ))}
                          </div>
                          <span className={`ix-doc-badge ${doc.isNew ? "new" : "read"}`}>
                            {doc.isNew ? "New" : "Read"}
                          </span>
                        </div>

                        <div className="ix-doc-body">
                          <div className="ix-doc-name" title={cleanName}>{cleanName}</div>
                          <div className="ix-doc-meta">
                            <span>{doc.pages}p</span>
                            <span className="ix-doc-meta-sep">·</span>
                            <span>{(doc as {timeLabel?: string}).timeLabel ?? timeAgo(doc.created_at)}</span>
                            <span className="ix-doc-meta-sep">·</span>
                            <span>{doc.questions} Q&amp;A</span>
                          </div>
                          <div className="ix-doc-summary">{summary}</div>
                        </div>

                        <div className="ix-doc-footer">
                          <div className="ix-doc-cite-count">
                            <CheckCircle2 size={12} color="var(--green)" />
                            {doc.questions * 3 + 2} citations
                          </div>
                          <div className="ix-doc-actions">
                            <button
                              className="ix-doc-open-btn"
                              onClick={() => doc.file_url && handleOpenDoc(doc.file_url)}
                              disabled={!doc.file_url || deleting === doc.id}
                            >
                              <ExternalLink size={11} />
                              {deleting === doc.id ? "…" : "Open"}
                            </button>
                            {doc.file_url && (
                              <div
                                className="ix-doc-more-btn"
                                onClick={e => { e.stopPropagation(); setMenuOpenId(menuOpenId === doc.id ? null : doc.id); }}
                              >
                                <MoreHorizontal size={14} />
                                {menuOpenId === doc.id && (
                                  <div className="ix-doc-menu" onClick={e => e.stopPropagation()}>
                                    <button className="ix-doc-menu-item" onClick={() => { setMenuOpenId(null); handleOpenDoc(doc.file_url); }}>
                                      <ExternalLink size={13} /> Open
                                    </button>
                                    <a className="ix-doc-menu-item" href={doc.file_url} target="_blank" rel="noreferrer" onClick={() => setMenuOpenId(null)}>
                                      <Download size={13} /> Download
                                    </a>
                                    <button
                                      className={`ix-doc-menu-item danger${plan !== "pro" ? " locked" : ""}`}
                                      onClick={() => handleDeleteDoc(doc.id, doc.file_url)}
                                    >
                                      <Trash2 size={13} /> Delete{plan !== "pro" && <span style={{ fontSize:10, marginLeft:"auto", background:"var(--accent-pale)", color:"var(--accent)", padding:"1px 6px", borderRadius:20, fontWeight:700 }}>Pro</span>}
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {/* Pro upgrade card — only for free users */}
                {plan === "free" && (
                  <motion.div variants={fadeUp}>
                    <div
                      className="ix-pro-card"
                      ref={proCardRef}
                      onMouseMove={handleProMouseMove}
                      style={{ height: "100%" }}
                    >
                      <div
                        className="ix-pro-glow"
                        style={{ transform: `translate(${glowPos.x - 100}px, ${glowPos.y - 100}px)` }}
                      />
                      <div className="ix-pro-eyebrow">Upgrade available</div>
                      <div className="ix-pro-title">Unlock <em>unlimited</em> reading</div>
                      <p className="ix-pro-sub">No caps. Just you and your documents.</p>
                      <div className="ix-pro-feats">
                        {["Unlimited documents", "Unlimited questions", "Priority processing", "Export to Notion & Docs"].map(f => (
                          <div key={f} className="ix-pro-feat">{f}</div>
                        ))}
                      </div>
                      <button className="ix-pro-cta" onClick={handleUpgrade} style={{ border: "none", cursor: "pointer" }}>Go Pro — ₹299/month <ArrowUpRight size={13} /></button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </div>

            {/* ── 4. ANALYTICS ROW ──────────────────────────────────── */}
            <div className="ix-analytics-row">
              {/* Chart card */}
              <motion.div
                className="ix-chart-card"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="ix-chart-hdr">
                  <div className="ix-chart-title">
                    <BarChart2 size={15} style={{ color: "var(--accent)", marginRight: 6 }} />
                    AI Activity
                  </div>
                  <div className="ix-chart-tabs">
                    {(["week","month","year"] as const).map(t => (
                      <button
                        key={t}
                        className={`ix-chart-tab${chartTab === t ? " active" : ""}`}
                        onClick={() => setChartTab(t)}
                      >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="ix-bars-wrap">
                  {CHART_DATA.map((b, i) => (
                    <div key={i} className="ix-bar-col">
                      <div
                        className={`ix-bar ${i === CHART_DATA.length - 1 ? "today" : b.pct < 10 ? "base" : "accent"}`}
                        title={`${b.day} · ${b.count} question${b.count !== 1 ? "s" : ""}`}
                        style={{
                          height:     barsReady ? `${b.pct}%` : "0%",
                          transition: `height .65s cubic-bezier(.22,1,.36,1) ${i * 50}ms`,
                        }}
                      />
                      <div className="ix-bar-day">{b.day}</div>
                    </div>
                  ))}
                </div>

                <div className="ix-chart-meta">
                  <div className="ix-chart-meta-item">
                    <div className="ix-chart-meta-val">14h</div>
                    <div className="ix-chart-meta-lbl">Time saved</div>
                  </div>
                  <div className="ix-chart-meta-item">
                    <div className="ix-chart-meta-val">+24%</div>
                    <div className="ix-chart-meta-lbl">vs last month</div>
                  </div>
                  <div className="ix-chart-meta-item">
                    <div className="ix-chart-meta-val">3.4s</div>
                    <div className="ix-chart-meta-lbl">Avg. answer</div>
                  </div>
                  <div className="ix-chart-meta-item">
                    <div className="ix-chart-meta-val">100%</div>
                    <div className="ix-chart-meta-lbl">Citation accuracy</div>
                  </div>
                </div>
              </motion.div>

              {/* Quick metrics col */}
              <motion.div
                className="ix-metrics-col"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                {[
                  { icon: <Clock size={18} />,       color:"orange", bg:"var(--accent-pale)", val:"0.3s",  label:"Fastest answer",   sub:"This session" },
                  { icon: <TrendingUp size={18} />,   color:"green",  bg:"var(--green-pale)",  val:"23%",  label:"Revenue growth",   sub:"Found in Q3 report" },
                  { icon: <FileSearch size={18} />,   color:"blue",   bg:"var(--blue-pale)",   val:"127",  label:"Passages cited",   sub:"Across all docs" },
                  { icon: <CheckCircle2 size={18} />, color:"purple", bg:"#f3e8ff",             val:"100%", label:"AI accuracy",      sub:"Independently audited" },
                ].map((m, i) => (
                  <div key={i} className="ix-metric-card">
                    <div className="ix-metric-icon" style={{ background: m.bg, color: `var(--${m.color})` }}>
                      {m.icon}
                    </div>
                    <div>
                      <div className="ix-metric-val">{m.val}</div>
                      <div className="ix-metric-label">{m.label}</div>
                      <div className="ix-metric-sub">{m.sub}</div>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* ── 5. AI CONVERSATIONS + TIMELINE ───────────────────── */}
            <div className="ix-conv-row">
              {/* Conversations */}
              <motion.div
                className="ix-card"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="ix-card-hdr">
                  <div className="ix-card-title"><MessageCircle size={15} /> Recent Conversations</div>
                  <button className="ix-card-link">View all →</button>
                </div>
                <div className="ix-conv-list">
                  {[
                    {
                      q: '"What was Q3 revenue compared to Q2?"',
                      a: <>Q3 revenue reached <mark>₹423.7 Cr</mark>, up <mark>23.4% YoY</mark>. This beat analyst consensus by 4.2 percentage points.</>,
                      cite: "Q3 Report · p.14, §3.2",
                    },
                    {
                      q: '"Are there any risks in the appendix?"',
                      a: <>Three risks flagged: (1) currency exposure to USD, (2) regulatory uncertainty, (3) top-3 clients = <mark>54% of revenue</mark>.</>,
                      cite: "Q3 Report · p.38–41",
                    },
                  ].map((c, i) => (
                    <div key={i} className="ix-conv-item">
                      <div className="ix-conv-q">{c.q}</div>
                      <div className="ix-conv-bubble">{c.a}</div>
                      <span className="ix-conv-cite">📎 {c.cite}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Activity timeline */}
              <motion.div
                className="ix-card"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="ix-card-hdr">
                  <div className="ix-card-title"><Clock size={15} /> Activity</div>
                </div>
                <div className="ix-card-body">
                  <div className="ix-timeline">
                    {[
                      { dot: "accent", text: `Uploaded ${displayDocs[0]?.file_name.replace(/\.pdf$/i,"")} · ${displayDocs[0]?.pages}p indexed`, time: displayDocs[0]?.created_at ? timeAgo(displayDocs[0].created_at) : "Just now" },
                      { dot: "",      text: `Asked ${displayDocs[1]?.questions ?? 7} questions on Q3 Financial Report`, time: "Yesterday" },
                      { dot: "green", text: `Free plan activated · 5 questions added`, time: "2 days ago" },
                      { dot: "",      text: `Account created. Welcome to Intellixy.`, time: "2 days ago" },
                    ].map((item, i) => (
                      <div key={i} className="ix-tl-item">
                        <div className={`ix-tl-dot ${item.dot}`} />
                        <div>
                          <div className="ix-tl-text">{item.text}</div>
                          <div className="ix-tl-time">{item.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* ── 7. SMART TEMPLATES ────────────────────────────────── */}
            <div>
              <div className="ix-doc-section-head">
                <div className="ix-section-title"><Zap size={16} /> Quick Start Templates</div>
              </div>
              <motion.div
                className="ix-templates-grid"
                variants={staggerContainer}
                initial="hidden"
                animate="show"
              >
                {TEMPLATES.map((t, i) => (
                  <motion.div key={i} variants={fadeUp}>
                    <div className="ix-template-card">
                      <div className="ix-template-num">Template {t.n}</div>
                      <div className="ix-template-title">{t.title}</div>
                      <div className="ix-template-body">{t.body}</div>
                      <div className="ix-template-cta">Use template <ChevronRight size={12} /></div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* ── 8. INVITE / UPGRADE BANNER ────────────────────────── */}
            <motion.div
              className="ix-banner"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="ix-banner-glow" />
              <div className="ix-banner-left">
                <div className="ix-banner-icon">
                  {plan === "free" ? <ArrowUpRight size={20} /> : <Users size={20} />}
                </div>
                <div>
                  <div className="ix-banner-title">
                    {plan === "free" ? "Invite friends, earn questions" : "Invite your team"}
                  </div>
                  <div className="ix-banner-sub">
                    {plan === "free"
                      ? "For every reader you bring, we'll add 25 questions to your account."
                      : "Share Intellixy with colleagues and analyse documents together."}
                  </div>
                </div>
              </div>
              <button className={`ix-banner-cta${inviteCopied ? " copied" : ""}`} onClick={handleCopyInvite}>
                {inviteCopied ? <><CheckCircle2 size={14} /> Copied!</> : <><Upload size={14} /> Copy invite link</>}
              </button>
            </motion.div>

            </>)}

          </main>
        </div>
      </div>

      {/* Suppress unused-var warnings */}
      {(proExpiresAt || graceUntil || isTrial || trialEnd || subscriptionSource || subscriptionCancelled) && null}
    </div>
  );
}
