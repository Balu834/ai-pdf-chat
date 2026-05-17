"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, MessageCircle, BarChart2,
  Search, Bell, Sparkles,
  ChevronRight, MoreHorizontal, ExternalLink, Trash2, Download,
  ArrowUpRight, Zap, Shield, Clock, TrendingUp, BookOpen,
  FileSearch, Lightbulb, AlertCircle, CheckCircle2, Upload, Users,
  CreditCard, Bookmark, Settings,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";
import OAuthSignupTracker from "@/app/components/OAuthSignupTracker";
import Sidebar, { type DashTab } from "@/app/components/dashboard/Sidebar";

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

const INSIGHTS = [
  { icon: <TrendingUp size={16} />, color: "orange", label: "Trend", title: "Revenue up 23%",     body: "Q3 revenue consistently outpacing analyst consensus across all your finance docs." },
  { icon: <AlertCircle size={16}/>, color: "blue",   label: "Risk",  title: "3 risks flagged",    body: "Currency exposure, client concentration, and DPDPA compliance found in Q3 Report." },
  { icon: <Lightbulb size={16} />,  color: "purple", label: "Tip",   title: "Try multi-doc chat", body: "Compare Q3 and Q2 reports simultaneously to surface quarter-over-quarter changes." },
];

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
  tab, docs, displayDocs, plan, usage, uploading, deleting,
  menuOpenId, setMenuOpenId, handleOpenDoc, handleDeleteDoc, onUpload,
  inviteCopied, handleCopyInvite, onTabChange,
}: {
  tab: import("@/app/components/dashboard/Sidebar").DashTab;
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
            <button className="ix-btn-primary" style={{ width: "fit-content" }} onClick={() => onTabChange("billing")}>
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
            <a href="#" className="ix-banner-cta" style={{ textDecoration: "none" }}>
              <ArrowUpRight size={14} /> Upgrade to Pro — ₹299/month
            </a>
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

  /* ── Saved / Settings tabs ─────────────────────────────────── */
  const tabMeta: Record<string, { icon: React.ReactNode; title: string; body: string }> = {
    saved:    { icon: <Bookmark size={36} style={{ opacity: 0.3, marginBottom: 12 }} />, title: "No saved items yet", body: "Bookmark responses and citations from your conversations to find them here." },
    settings: { icon: <Settings size={36} style={{ opacity: 0.3, marginBottom: 12 }} />, title: "Settings", body: "Account settings and preferences will appear here." },
  };
  const meta = tabMeta[tab] ?? tabMeta.settings;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="ix-card">
        <div style={{ padding: "48px 32px", textAlign: "center", color: "var(--text-tertiary)", fontSize: 14 }}>
          {meta.icon}
          <p style={{ fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>{meta.title}</p>
          <p>{meta.body}</p>
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
      if (!res.ok) { setUploadError(data.error || "Upload failed. Please try again."); return; }
      if (user) await fetchDocs(user.id);
      await fetchUsage();
      showToast(`${file.name} uploaded · ready to chat`);
    } catch {
      setUploadError("Upload failed. Please check your connection.");
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
    <div className="ds-dash">
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

              <motion.div className="ix-stat-card" variants={fadeUp}>
                <div className="ix-stat-icon-row">
                  <div className="ix-stat-icon green"><Zap size={16} /></div>
                  <span className="ix-stat-delta up">Fast</span>
                </div>
                <div className="ix-stat-val">3.4<span>s</span></div>
                <div className="ix-stat-label">Avg. answer time</div>
                <div className="ix-stat-sub">98% citation accuracy</div>
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
                      <a href="#" className="ix-pro-cta">Go Pro — ₹299/month <ArrowUpRight size={13} /></a>
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
                    <div className="ix-chart-meta-val">98%</div>
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
                  { icon: <CheckCircle2 size={18} />, color:"purple", bg:"#f3e8ff",             val:"98%",  label:"AI accuracy",      sub:"Independently audited" },
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

            {/* ── 6. AI INSIGHTS ────────────────────────────────────── */}
            <div>
              <div className="ix-doc-section-head">
                <div className="ix-section-title"><Lightbulb size={16} /> AI Insights</div>
                <button className="ix-section-action">Refresh →</button>
              </div>
              <motion.div
                className="ix-insights-grid"
                variants={staggerContainer}
                initial="hidden"
                animate="show"
              >
                {INSIGHTS.map((ins, i) => (
                  <motion.div key={i} variants={fadeUp}>
                    <div className="ix-insight-card">
                      <div className={`ix-insight-icon`} style={{ background: `var(--${ins.color === "orange" ? "accent-pale" : ins.color + "-pale"})`, color: `var(--${ins.color === "orange" ? "accent" : ins.color})` }}>
                        {ins.icon}
                      </div>
                      <div className="ix-insight-label">{ins.label}</div>
                      <div className="ix-insight-title">{ins.title}</div>
                      <div className="ix-insight-body">{ins.body}</div>
                    </div>
                  </motion.div>
                ))}
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
