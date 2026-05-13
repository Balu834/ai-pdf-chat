"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Suspense } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";
import OAuthSignupTracker from "@/app/components/OAuthSignupTracker";
import "../dashboard.css";

/* ── Types ──────────────────────────────────────────────────────────────── */
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

/* ── Static data ─────────────────────────────────────────────────────────── */
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
  { section: "Actions", icon: "↑",  label: "Upload a new PDF",            kbd: "⌘U", action: "upload"   },
  { section: "Actions", icon: "+",  label: "Start a new conversation",    kbd: "⌘N", action: "new-conv" },
  { section: "Actions", icon: "★",  label: "Go Pro — unlimited everything", kbd: "⌘P", action: "pro"    },
  { section: "Recent",  icon: "·",  label: "sample.pdf",                  meta: "1H AGO",    action: "doc-1" },
  { section: "Recent",  icon: "·",  label: "Q3 Financial Report",         meta: "YESTERDAY", action: "doc-2" },
  { section: "Navigate", icon: "₹", label: "Billing & subscription",      kbd: "⌘B", action: "billing"  },
  { section: "Navigate", icon: "⚙", label: "Settings",                    kbd: "⌘,", action: "settings" },
];

const PLACEHOLDER_DOCS = [
  { id: "p1", file_name: "sample.pdf",               created_at: new Date(Date.now() - 3600000).toISOString(),    pages: 12, questions: 2, isNew: true  },
  { id: "p2", file_name: "Q3 Financial Report",       created_at: new Date(Date.now() - 86400000).toISOString(),   pages: 42, questions: 7, isNew: false },
  { id: "p3", file_name: "Research Notes — May",      created_at: new Date(Date.now() - 259200000).toISOString(),  pages: 8,  questions: 5, isNew: false },
];

/* ── Helpers ────────────────────────────────────────────────────────────── */
function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diffMs / 3600000);
  if (h < 1) return "Just now";
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Yesterday";
  return `${d} days ago`;
}

/* ════════════════════════════════════════════════════════════════════════════
   DASHBOARD PAGE
   ════════════════════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  /* ── Auth + data state ──────────────────────────────────────────────────── */
  const [user,                 setUser]                 = useState<User | null>(null);
  const [loading,              setLoading]              = useState(true);
  const [docs,                 setDocs]                 = useState<Doc[]>([]);
  const [plan,                 setPlan]                 = useState<"free" | "pro">("free");
  const [proExpiresAt,         setProExpiresAt]         = useState<string | null>(null);
  const [graceUntil,           setGraceUntil]           = useState<string | null>(null);
  const [isTrial,              setIsTrial]              = useState(false);
  const [trialEnd,             setTrialEnd]             = useState<string | null>(null);
  const [subscriptionSource,   setSubscriptionSource]   = useState<string | null>(null);
  const [subscriptionCancelled,setSubscriptionCancelled]= useState(false);
  const [usage,                setUsage]                = useState<Usage>({
    pdfs: 0, questions: 0, maxPdfs: 3, maxQuestions: 5, loading: true,
  });

  /* ── UI state ───────────────────────────────────────────────────────────── */
  const [cmdOpen,       setCmdOpen]       = useState(false);
  const [cmdQuery,      setCmdQuery]      = useState("");
  const [cmdIdx,        setCmdIdx]        = useState(0);
  const [chartTab,      setChartTab]      = useState<"week"|"month"|"year">("week");
  const [glowPos,       setGlowPos]       = useState({ x: 60, y: 60 });
  const [toastShow,     setToastShow]     = useState(false);
  const [toastIn,       setToastIn]       = useState(false);
  const [inviteCopied,  setInviteCopied]  = useState(false);
  const [barsReady,     setBarsReady]     = useState(false);

  const proCardRef  = useRef<HTMLDivElement>(null);
  const cmdInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef= useRef<HTMLInputElement>(null);

  /* ── Derived ────────────────────────────────────────────────────────────── */
  const userName     = user?.user_metadata?.full_name?.split(" ")[0]
                     || user?.email?.split("@")[0]
                     || "Scholar";
  const avatarLetter = userName[0]?.toUpperCase() ?? "S";
  const hour         = new Date().getHours();
  const greeting     = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const todayLabel   = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const pdfPct  = Math.min(100, Math.round((usage.pdfs / (usage.maxPdfs || 3)) * 100));
  const qPct    = Math.min(100, Math.round((usage.questions / (usage.maxQuestions || 5)) * 100));
  const qLeft   = Math.max(0, (usage.maxQuestions || 5) - usage.questions);

  const displayDocs = docs.length > 0
    ? docs.slice(0, 3).map((d, i) => ({
        id:        d.id,
        file_name: d.file_name,
        created_at:d.created_at,
        pages:     PLACEHOLDER_DOCS[i]?.pages ?? 10,
        questions: PLACEHOLDER_DOCS[i]?.questions ?? 0,
        isNew:     i === 0,
      }))
    : PLACEHOLDER_DOCS;

  /* ── Filtered command items ─────────────────────────────────────────────── */
  const filteredCmds = cmdQuery
    ? CMD_ITEMS.filter(it => it.label.toLowerCase().includes(cmdQuery.toLowerCase()))
    : CMD_ITEMS;
  const sections = [...new Set(filteredCmds.map(it => it.section))];

  /* ─────────────────────────────────────────────────────────────────────────
     AUTH GUARD + DATA FETCH (preserved exactly from original)
     ───────────────────────────────────────────────────────────────────────── */
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
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ref_code: pendingRef }),
            credentials: "include",
          })
            .then(r => r.json())
            .then(result => { if (result?.ok) fetchUsage(); })
            .catch(() => {});
        }
      } catch {}
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Post-payment handling ──────────────────────────────────────────────── */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgraded") === "1") {
      window.history.replaceState({}, "", "/dashboard");
    }
    const viewParam = params.get("view");
    if (viewParam) window.history.replaceState({}, "", "/dashboard");
  }, []);

  /* ── Real-time plan sync ────────────────────────────────────────────────── */
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`user_plan_${user.id}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "user_plans",
        filter: `user_id=eq.${user.id}`,
      }, (payload: { new: Record<string, unknown> }) => {
        const row = payload.new;
        if (!row) return;
        const now = new Date();
        const isActive =
          row.plan === "pro" && (
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

  /* ── Mount toast ────────────────────────────────────────────────────────── */
  useEffect(() => {
    const t1 = setTimeout(() => { setToastShow(true); setTimeout(() => setToastIn(true), 30); }, 1200);
    const t2 = setTimeout(() => { setToastIn(false);  setTimeout(() => setToastShow(false), 350); }, 7200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  /* ── Chart bars animation ───────────────────────────────────────────────── */
  useEffect(() => {
    const t = setTimeout(() => setBarsReady(true), 300);
    return () => clearTimeout(t);
  }, []);

  /* ── Command palette keyboard ───────────────────────────────────────────── */
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

  /* ── Data functions (preserved exactly) ────────────────────────────────── */
  async function fetchPlan(userId: string) {
    try {
      const { data } = await supabase
        .from("user_plans")
        .select("plan, pro_expires_at, grace_until, subscription_status, is_trial, trial_end, razorpay_subscription_id")
        .eq("user_id", userId)
        .maybeSingle();
      if (data?.plan) {
        const now = new Date();
        const isActive =
          data.plan === "pro" && (
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
        const isActive =
          data.is_pro_active === true ||
          (data.plan === "pro" && (
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
    setTimeout(() => setInviteCopied(false), 1800);
  }

  function handleCmdAction(action?: string) {
    setCmdOpen(false);
    if (action === "upload") fileInputRef.current?.click();
  }

  /* ── Loading ────────────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="reading-room" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <span style={{ fontFamily: "var(--ff-display)", fontStyle: "italic", fontSize: "18px", color: "var(--ink-faint)", fontVariationSettings: "'SOFT' 60" }}>
          Opening your reading room…
        </span>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="reading-room">
      <Suspense fallback={null}><OAuthSignupTracker /></Suspense>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="application/pdf" style={{ display: "none" }} onChange={() => {}} />

      {/* ── TOAST ─────────────────────────────────────────────────────────── */}
      {toastShow && (
        <div className="d-toast-wrap">
          <div className={`d-toast${toastIn ? "" : " hidden"}`}>
            <div className="d-toast-dot" />
            <div className="d-toast-text">sample.pdf processed · 12 pages indexed</div>
          </div>
        </div>
      )}

      {/* ── COMMAND PALETTE ───────────────────────────────────────────────── */}
      {cmdOpen && (
        <div className="d-cmd-backdrop" onClick={() => setCmdOpen(false)}>
          <div className="d-cmd-palette" onClick={e => e.stopPropagation()}>
            {/* Input */}
            <div className="d-cmd-input-row">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                ref={cmdInputRef}
                className="d-cmd-input"
                placeholder="What would you like to do?"
                value={cmdQuery}
                onChange={e => { setCmdQuery(e.target.value); setCmdIdx(0); }}
              />
              <span className="d-cmd-esc">ESC</span>
            </div>

            {/* Items */}
            <div className="d-cmd-body">
              {sections.map(sec => {
                const items = filteredCmds.filter(it => it.section === sec);
                const globalOffset = filteredCmds.indexOf(items[0]);
                return (
                  <div key={sec}>
                    <div className="d-cmd-sec-lbl">§ {sec.toUpperCase()}</div>
                    {items.map((it, localIdx) => {
                      const gi = globalOffset + localIdx;
                      return (
                        <div
                          key={it.action}
                          className={`d-cmd-item${cmdIdx === gi ? " sel" : ""}`}
                          onClick={() => handleCmdAction(it.action)}
                          onMouseEnter={() => setCmdIdx(gi)}
                        >
                          <div className="d-cmd-ico">{it.icon}</div>
                          <span className="d-cmd-lbl">{it.label}</span>
                          {it.meta && <span className="d-cmd-meta">{it.meta}</span>}
                          {it.kbd  && <span className="d-cmd-kbd">{it.kbd}</span>}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              {filteredCmds.length === 0 && (
                <div style={{ padding: "20px", textAlign: "center", fontFamily: "var(--ff-mono)", fontSize: "11px", color: "var(--ink-faint)", letterSpacing: ".08em" }}>
                  No results for &ldquo;{cmdQuery}&rdquo;
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="d-cmd-footer">
              <span className="d-cmd-hint"><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
              <span className="d-cmd-hint"><kbd>↵</kbd> Select</span>
              <span className="d-cmd-hint"><kbd>ESC</kbd> Close</span>
            </div>
          </div>
        </div>
      )}

      {/* ── LAYOUT ────────────────────────────────────────────────────────── */}
      <div className="d-layout">

        {/* ── SIDEBAR ───────────────────────────────────────────────────── */}
        <aside className="d-sidebar">
          <div className="d-brand">
            <Link href="/" className="d-brand-link">
              <div className="d-brand-mark"><span>I</span></div>
              <span className="d-brand-name">Intellixy</span>
            </Link>
            <div className="d-brand-tag">Reading Room</div>
          </div>

          <nav className="d-nav">
            <div>
              <div className="d-nav-label">§ Library</div>
              <div className="d-nav-item active">
                <div className="d-nav-icon">⊞</div> Overview
              </div>
              <div className="d-nav-item">
                <div className="d-nav-icon">📄</div>
                My PDFs
                <span className="d-nav-badge">{docs.length || 2}</span>
              </div>
              <div className="d-nav-item">
                <div className="d-nav-icon">💬</div> Conversations
              </div>
              <div className="d-nav-item">
                <div className="d-nav-icon">🔖</div> Bookmarks
              </div>
            </div>
            <div>
              <div className="d-nav-label">§ Tools</div>
              <div className="d-nav-item"><div className="d-nav-icon">✦</div> Agents</div>
              <div className="d-nav-item"><div className="d-nav-icon">⟳</div> Workflows</div>
              <div className="d-nav-item"><div className="d-nav-icon">◈</div> Marketplace</div>
            </div>
            <div>
              <div className="d-nav-label">§ Account</div>
              <div className="d-nav-item"><div className="d-nav-icon">₹</div> Billing</div>
              <div className="d-nav-item"><div className="d-nav-icon">⚙</div> Settings</div>
            </div>
          </nav>

          <div className="d-sidebar-bottom">
            <button className="d-upload-btn" onClick={() => fileInputRef.current?.click()}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Upload PDF
            </button>

            <div className="d-usage-card">
              <div className="d-usage-hdr">
                <span>{plan === "pro" ? "Pro plan" : "Free plan"}</span>
                {plan === "free" && (
                  <button className="d-usage-upgrade">Upgrade ↑</button>
                )}
              </div>
              <div className="d-usage-bar-row">
                <div className="d-usage-bar-label">
                  <span>PDFs</span>
                  <span>{usage.pdfs}/{usage.maxPdfs === Infinity ? "∞" : usage.maxPdfs}</span>
                </div>
                <div className="d-usage-track">
                  <div className="d-usage-fill" style={{ width: `${usage.maxPdfs === Infinity ? 0 : pdfPct}%` }} />
                </div>
              </div>
              <div className="d-usage-bar-row">
                <div className="d-usage-bar-label">
                  <span>Questions</span>
                  <span>{usage.questions}/{usage.maxQuestions === Infinity ? "∞" : usage.maxQuestions}</span>
                </div>
                <div className="d-usage-track">
                  <div className="d-usage-fill" style={{ width: `${usage.maxQuestions === Infinity ? 0 : qPct}%` }} />
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ── MAIN ──────────────────────────────────────────────────────── */}
        <div className="d-main">

          {/* ── TOPBAR ──────────────────────────────────────────────────── */}
          <div className="d-topbar">
            <div className="d-breadcrumb">
              <Link href="/">Intellixy</Link>
              <span className="d-bc-sep">/</span>
              <span>Reading Room</span>
              <span className="d-bc-sep">/</span>
              <span className="d-bc-cur">Overview</span>
            </div>

            <div className="d-topbar-right">
              <div className="d-search-bar" onClick={() => { setCmdOpen(true); setCmdQuery(""); setCmdIdx(0); }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <span>Search or run a command…</span>
                <kbd className="d-search-kbd">⌘K</kbd>
              </div>

              <div className="d-bell">
                <div className="d-bell-dot" />
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--ink-soft)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </div>

              <div className="d-avatar">{avatarLetter}</div>
            </div>
          </div>

          {/* ── CONTENT ─────────────────────────────────────────────────── */}
          <div className="d-content">

            {/* 1 ── ISSUE LINE */}
            <div className="d-issue-line">
              <div className="d-issue-live">
                <div className="d-live-dot" />
                Reading Room · Folio I
              </div>
              <span>{todayLabel}</span>
              <span>Last sync: 4 mins ago</span>
            </div>

            {/* 2 ── WELCOME */}
            <div className="d-welcome">
              <div>
                <div className="d-welcome-eyebrow">
                  <span className="d-eyebrow-text">{greeting} —</span>
                </div>
                <h1 className="d-welcome-h1">
                  Welcome back,<br />
                  <span className="cu">{userName}.</span>
                </h1>
                <p className="d-welcome-sub">
                  Your library has <strong>{docs.length || 2} document{(docs.length || 2) !== 1 ? "s" : ""}</strong> ready for
                  inspection. You have <strong>{qLeft} question{qLeft !== 1 ? "s" : ""}</strong> remaining this
                  month — make them count, or upgrade for the infinite kind.
                </p>
              </div>

              <div className="d-quick-actions">
                <button className="d-qbtn d-qbtn-dark" onClick={() => fileInputRef.current?.click()}>
                  <span>Upload a new PDF</span>
                  <span className="d-qbtn-arrow">→</span>
                </button>
                <button className="d-qbtn d-qbtn-outline">
                  <span>Resume last conversation</span>
                  <span className="d-qbtn-arrow">→</span>
                </button>
                <button
                  className="d-qbtn d-qbtn-outline"
                  onClick={() => { setCmdOpen(true); setCmdQuery(""); setCmdIdx(0); }}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
                >
                  <span>Open command palette</span>
                  <kbd className="d-qbtn-kbd">⌘K</kbd>
                </button>
              </div>
            </div>

            {/* 3 ── STAT ROW */}
            <div className="d-stat-row">
              <div className="d-stat-cell">
                <div className="d-stat-lbl"><div className="d-stat-icon">◫</div> Volumes on shelf</div>
                <div className="d-stat-num">
                  0{docs.length || 2}<span className="muted">/{usage.maxPdfs === Infinity ? "∞" : usage.maxPdfs}</span>
                </div>
                <div className="d-stat-cap">PDFs uploaded this month</div>
                <a href="#" className="d-stat-link">View library →</a>
              </div>
              <div className="d-stat-cell">
                <div className="d-stat-lbl"><div className="d-stat-icon">?</div> Questions posed</div>
                <div className="d-stat-num">0{usage.questions}</div>
                <div className="d-stat-cap">Across all documents</div>
                <a href="#" className="d-stat-link">View history →</a>
              </div>
              <div className="d-stat-cell">
                <div className="d-stat-lbl"><div className="d-stat-icon">◎</div> Remaining</div>
                <div className="d-stat-num">
                  <span className="cu">0{qLeft}</span>
                </div>
                <div className="d-stat-cap">Questions left this month</div>
                <a href="#" className="d-stat-link">Upgrade plan →</a>
              </div>
              <div className="d-stat-cell">
                <div className="d-stat-lbl"><div className="d-stat-icon">✦</div> Plan</div>
                <div className="d-stat-num" style={{ fontSize: "38px" }}>
                  {plan === "pro" ? <span className="cu">Pro</span> : "Free"}
                </div>
                <div className="d-stat-cap">{plan === "pro" ? "Unlimited everything" : "3 PDFs · 5 questions"}</div>
                {plan === "free" && <a href="#" className="d-stat-link">Go Pro →</a>}
              </div>
            </div>

            {/* 4 ── ACTIVITY CHART */}
            <div className="d-chart-card">
              <div className="d-chart-hdr">
                <div className="d-chart-title">Reading <em>activity</em></div>
                <div className="d-chart-tabs">
                  {(["week","month","year"] as const).map(t => (
                    <button key={t} className={`d-chart-tab${chartTab === t ? " active" : ""}`} onClick={() => setChartTab(t)}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="d-chart-body">
                <div className="d-bars-wrap">
                  {CHART_DATA.map((b, i) => (
                    <div key={i} className="d-bar-col">
                      <div
                        className={`d-bar ${i === CHART_DATA.length - 1 ? "today" : b.pct < 15 ? "muted" : "copper"}`}
                        title={`${b.day} · ${b.count} question${b.count !== 1 ? "s" : ""}`}
                        style={{ height: barsReady ? `${b.pct}%` : "0%", transition: `height .6s cubic-bezier(.22,1,.36,1) ${i * 60}ms` }}
                      />
                      <div className="d-bar-day">{b.day}</div>
                    </div>
                  ))}
                </div>
                <div className="d-chart-stats">
                  <div className="d-chart-stat">
                    <div className="d-chart-stat-num">14h</div>
                    <div className="d-chart-stat-lbl">Time saved this month</div>
                  </div>
                  <div className="d-chart-stat">
                    <div className="d-chart-stat-num">+24%</div>
                    <div className="d-chart-stat-lbl">vs. last month</div>
                  </div>
                  <div className="d-chart-stat">
                    <div className="d-chart-stat-num">3.4s</div>
                    <div className="d-chart-stat-lbl">Avg. answer time</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 5 ── LIBRARY + PRO CARD */}
            <div className="d-library-row">
              {/* Library */}
              <div className="d-card">
                <div className="d-card-hdr">
                  <div className="d-card-title">The <em>library</em></div>
                  <a href="#" className="d-card-link">All volumes →</a>
                </div>
                {displayDocs.map((doc, i) => (
                  <div key={doc.id} className="d-pdf-item">
                    <div className="d-pdf-num">№ {String(i + 1).padStart(2, "0")}</div>
                    <div className="d-pdf-info">
                      <div className="d-pdf-name">{doc.file_name.replace(/\.pdf$/i, "")}</div>
                      <div className="d-pdf-meta">{timeAgo(doc.created_at)} · {doc.pages}p · {doc.questions}q</div>
                    </div>
                    <span className={`d-pdf-pill ${doc.isNew ? "new" : "read"}`}>{doc.isNew ? "New" : "Read"}</span>
                    <div className="d-pdf-action">Open →</div>
                  </div>
                ))}
              </div>

              {/* Pro card */}
              {plan === "free" && (
                <div
                  className="d-pro-card"
                  ref={proCardRef}
                  onMouseMove={handleProMouseMove}
                >
                  <div
                    className="d-pro-glow"
                    style={{ transform: `translate(${glowPos.x - 130}px, ${glowPos.y - 130}px)` }}
                  />
                  <div className="d-pro-label">A Modest Proposal</div>
                  <div className="d-pro-title">
                    Upgrade to <em>Pro</em> for<br />unlimited reading
                  </div>
                  <div className="d-pro-sub">
                    No caps. No counting questions.<br />Just you and your documents.
                  </div>
                  <div className="d-pro-feats">
                    {["Unlimited documents","Unlimited questions","Priority processing","Export to Notion / Docs"].map(f => (
                      <div key={f} className="d-pro-feat">{f}</div>
                    ))}
                  </div>
                  <a href="#" className="d-pro-cta">Go Pro — ₹299 / month →</a>
                </div>
              )}

              {plan === "pro" && (
                <div className="d-card" style={{ padding: "26px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", gap: "12px" }}>
                  <div style={{ fontFamily: "var(--ff-display)", fontStyle: "italic", fontSize: "28px", fontVariationSettings: "'SOFT' 80,'WONK' 1", color: "var(--accent)" }}>Pro</div>
                  <div style={{ fontFamily: "var(--ff-display)", fontSize: "16px", fontVariationSettings: "'SOFT' 30", color: "var(--ink)" }}>You&apos;re on the unlimited plan.</div>
                  <div style={{ fontFamily: "var(--ff-mono)", fontSize: "10px", color: "var(--ink-faint)", letterSpacing: ".1em", textTransform: "uppercase" }}>Unlimited PDFs · Unlimited questions</div>
                </div>
              )}
            </div>

            {/* 6 ── CONVERSATIONS + TIMELINE */}
            <div className="d-conv-row">
              {/* Conversations */}
              <div className="d-card">
                <div className="d-card-hdr">
                  <div className="d-card-title">Recent <em>conversations</em></div>
                  <a href="#" className="d-card-link">All conversations →</a>
                </div>
                <div className="d-conv-item">
                  <div className="d-conv-q">&ldquo;What was Q3 revenue compared to Q2?&rdquo;</div>
                  <div className="d-conv-a">
                    Q3 revenue: <strong>₹24.5 Crore</strong> — up <strong>24% year-on-year</strong>.
                    Q2 stood at ₹19.7Cr, giving a quarter-over-quarter growth of <strong>+24.4%</strong>.
                  </div>
                  <div className="d-conv-cite">Q3_Financial_Report.pdf · p.14, §3.2</div>
                </div>
                <div className="d-conv-item">
                  <div className="d-conv-q">&ldquo;Are there any risks mentioned in the appendix?&rdquo;</div>
                  <div className="d-conv-a">
                    Three risks flagged in Appendix C: (1) currency exposure to USD,
                    (2) regulatory uncertainty in two markets, (3) over-dependence on
                    top-3 customers (<strong>54% of revenue</strong>).
                  </div>
                  <div className="d-conv-cite">Q3_Financial_Report.pdf · p.38–41</div>
                </div>
              </div>

              {/* Timeline */}
              <div className="d-timeline-card">
                <div className="d-card-hdr">
                  <div className="d-card-title">Recent <em>activity</em></div>
                </div>
                <div className="d-timeline">
                  <div className="d-tl-item">
                    <div className="d-tl-dot" />
                    <div>
                      <div className="d-tl-text">Uploaded sample.pdf · 12 pages processed</div>
                      <div className="d-tl-time">1h ago</div>
                    </div>
                  </div>
                  <div className="d-tl-item">
                    <div className="d-tl-dot" />
                    <div>
                      <div className="d-tl-text">Asked 2 questions on Q3 Financial Report</div>
                      <div className="d-tl-time">Yesterday</div>
                    </div>
                  </div>
                  <div className="d-tl-item">
                    <div className="d-tl-dot green" />
                    <div>
                      <div className="d-tl-text">Free plan activated · 5 questions added</div>
                      <div className="d-tl-time">2 days ago</div>
                    </div>
                  </div>
                  <div className="d-tl-item">
                    <div className="d-tl-dot muted" />
                    <div>
                      <div className="d-tl-text">Account created. Welcome to the Reading Room.</div>
                      <div className="d-tl-time">2 days ago</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 7 ── TEMPLATES */}
            <div className="d-templates">
              {[
                { n:"01", title:"Analyse a contract",       body:"Pre-built questions for legal review: key clauses, renewal terms, risk flags." },
                { n:"02", title:"Read a research paper",    body:"Hypothesis, methodology, findings, limitations — extracted in 30 seconds." },
                { n:"03", title:"Summarise an earnings call", body:"Key numbers, management tone, analyst pushback, forward guidance." },
              ].map(t => (
                <div key={t.n} className="d-tpl-card">
                  <div className="d-tpl-num">№ {t.n} — Template</div>
                  <div className="d-tpl-title">{t.title}</div>
                  <div className="d-tpl-body">{t.body}</div>
                  <a href="#" className="d-tpl-link">Use template →</a>
                </div>
              ))}
            </div>

            {/* 8 ── INVITE BANNER */}
            <div className="d-invite">
              <div className="d-invite-left">
                <div className="d-invite-icon">✉</div>
                <div>
                  <div className="d-invite-title">Tell a <em>friend</em>, earn credits</div>
                  <div className="d-invite-sub">
                    For every reader you bring along, we&apos;ll add 25 questions to your account.
                  </div>
                </div>
              </div>
              <button className="d-invite-btn" onClick={handleCopyInvite}>
                {inviteCopied ? "Copied! ✓" : "Copy invite link →"}
              </button>
            </div>

          </div>{/* /d-content */}
        </div>{/* /d-main */}
      </div>{/* /d-layout */}

      {/* suppress unused-var warnings for preserved state */}
      {(proExpiresAt || graceUntil || isTrial || trialEnd || subscriptionSource || subscriptionCancelled) && null}
    </div>
  );
}
