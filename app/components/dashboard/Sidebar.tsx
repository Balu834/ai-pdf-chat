"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, FileText, MessageCircle, BarChart2,
  Users, Bookmark, Settings, CreditCard, Upload, LogOut,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

/* ── Types ──────────────────────────────────────────────────────────────── */
interface Usage {
  pdfs: number;
  questions: number;
  maxPdfs: number;
  maxQuestions: number;
  loading: boolean;
}

export interface SidebarProps {
  user: User | null;
  plan: "free" | "pro";
  docsCount: number;
  usage: Usage;
  uploading: boolean;
  uploadError: string | null;
  onUpload: () => void;
}

/* ── Nav data ────────────────────────────────────────────────────────────── */
const NAV = [
  {
    label: "Workspace",
    items: [
      { icon: LayoutDashboard, text: "Overview",      badge: null,     active: true  },
      { icon: FileText,        text: "Documents",     badge: "count",  active: false },
      { icon: MessageCircle,   text: "Conversations", badge: null,     active: false },
      { icon: BarChart2,       text: "Analytics",     badge: null,     active: false },
      { icon: Bookmark,        text: "Saved",         badge: null,     active: false },
    ],
  },
  {
    label: "Team",
    items: [
      { icon: Users,     text: "Members", badge: null, active: false },
    ],
  },
  {
    label: "Account",
    items: [
      { icon: CreditCard, text: "Billing",  badge: null, active: false },
      { icon: Settings,   text: "Settings", badge: null, active: false },
    ],
  },
];

/* ══════════════════════════════════════════════════════════════════════════
   SIDEBAR
   ══════════════════════════════════════════════════════════════════════════ */
export default function Sidebar({
  user,
  plan,
  docsCount,
  usage,
  uploading,
  uploadError,
  onUpload,
}: SidebarProps) {
  const router       = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef      = useRef<HTMLDivElement>(null);

  const userName     = user?.user_metadata?.full_name?.split(" ")[0]
                    || user?.email?.split("@")[0]
                    || "Scholar";
  const avatarLetter = userName[0]?.toUpperCase() ?? "S";
  const pdfPct       = usage.maxPdfs === Infinity ? 0 : Math.min(100, Math.round((usage.pdfs / (usage.maxPdfs || 3)) * 100));
  const qPct         = usage.maxQuestions === Infinity ? 0 : Math.min(100, Math.round((usage.questions / (usage.maxQuestions || 5)) * 100));

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const handleLogout = async () => {
    setMenuOpen(false);
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <aside className="ds-sidebar">

      {/* ── Logo ──────────────────────────────────────────────────────── */}
      <div className="ds-logo">
        <Link href="/" className="ds-logo-mark" aria-label="Intellixy home">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <rect x="3"  y="3"  width="8" height="11" rx="1.5" fill="currentColor" opacity=".9"/>
            <rect x="13" y="3"  width="8" height="5"  rx="1.5" fill="currentColor" opacity=".5"/>
            <rect x="13" y="10" width="8" height="11" rx="1.5" fill="currentColor" opacity=".7"/>
            <rect x="3"  y="16" width="8" height="5"  rx="1.5" fill="currentColor" opacity=".4"/>
          </svg>
        </Link>
        <span className="ds-logo-name">Intellixy</span>
        <span className={`ds-plan-badge ${plan}`}>{plan === "pro" ? "Pro" : "Free"}</span>
      </div>

      {/* ── Nav ───────────────────────────────────────────────────────── */}
      <nav className="ds-nav" aria-label="Dashboard navigation">
        {NAV.map((section) => (
          <div key={section.label} className="ds-nav-section">
            <p className="ds-nav-label">{section.label}</p>
            {section.items.map((item) => {
              const Icon = item.icon;
              const showBadge = item.badge === "count";
              return (
                <button
                  key={item.text}
                  className={`ds-nav-item${item.active ? " is-active" : ""}`}
                  type="button"
                  aria-current={item.active ? "page" : undefined}
                >
                  <Icon size={15} aria-hidden />
                  <span>{item.text}</span>
                  {showBadge && (
                    <span className="ds-nav-badge">{docsCount || 2}</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Sidebar footer ────────────────────────────────────────────── */}
      <div className="ds-sidebar-foot">

        {/* Upload button */}
        <button
          className={`ds-upload-btn${uploading ? " is-busy" : ""}`}
          onClick={onUpload}
          disabled={uploading}
          type="button"
        >
          <Upload size={13} aria-hidden />
          {uploading ? "Uploading…" : "Upload PDF"}
        </button>

        {uploadError && (
          <p className="ds-upload-error" role="alert">{uploadError}</p>
        )}

        {/* Usage meters */}
        <div className="ds-usage">
          <div className="ds-usage-head">
            <span>{plan === "pro" ? "Pro plan" : "Free plan"}</span>
            {plan === "free" && (
              <button className="ds-usage-upgrade" type="button">Upgrade ↑</button>
            )}
          </div>

          <div className="ds-usage-row">
            <div className="ds-usage-meta">
              <span>PDFs</span>
              <span>{usage.pdfs}/{usage.maxPdfs === Infinity ? "∞" : usage.maxPdfs}</span>
            </div>
            <div className="ds-usage-track" role="progressbar" aria-valuenow={pdfPct} aria-valuemin={0} aria-valuemax={100}>
              <div className="ds-usage-fill" style={{ width: `${pdfPct}%` }} />
            </div>
          </div>

          <div className="ds-usage-row">
            <div className="ds-usage-meta">
              <span>Questions</span>
              <span>{usage.questions}/{usage.maxQuestions === Infinity ? "∞" : usage.maxQuestions}</span>
            </div>
            <div className="ds-usage-track" role="progressbar" aria-valuenow={qPct} aria-valuemin={0} aria-valuemax={100}>
              <div className="ds-usage-fill" style={{ width: `${qPct}%` }} />
            </div>
          </div>
        </div>

        {/* Profile + logout menu */}
        <div className="ds-profile-wrap" ref={menuRef}>
          {menuOpen && (
            <div className="ds-profile-menu">
              <button className="ds-profile-menu-item ds-profile-menu-logout" onClick={handleLogout} type="button">
                <LogOut size={13} aria-hidden />
                Sign out
              </button>
            </div>
          )}
          <div
            className="ds-profile"
            role="button"
            tabIndex={0}
            onClick={() => setMenuOpen(o => !o)}
            onKeyDown={(e) => e.key === "Enter" && setMenuOpen(o => !o)}
          >
            <div className="ds-avatar">{avatarLetter}</div>
            <div className="ds-profile-info">
              <div className="ds-profile-name">{userName}</div>
              <div className="ds-profile-email">{user?.email}</div>
            </div>
            <Settings size={13} aria-hidden className="ds-profile-gear" />
          </div>
        </div>

      </div>
    </aside>
  );
}
