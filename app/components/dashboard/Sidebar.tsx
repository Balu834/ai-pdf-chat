"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IntellixyBrainIcon } from "@/app/components/IntellixyBrainIcon";
import {
  LayoutDashboard, FileText, MessageCircle, BarChart2,
  Users, Bookmark, Settings, CreditCard, Upload, LogOut, BookOpen,
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

export type DashTab =
  | "overview" | "documents" | "conversations" | "analytics"
  | "saved" | "planner" | "members" | "billing" | "settings";

export interface SidebarProps {
  user: User | null;
  plan: "free" | "pro";
  docsCount: number;
  usage: Usage;
  uploading: boolean;
  uploadError: string | null;
  onUpload: () => void;
  activeTab: DashTab;
  onTabChange: (tab: DashTab) => void;
}

/* ── Nav data ────────────────────────────────────────────────────────────── */
const NAV: { label: string; items: { icon: React.ElementType; text: string; tab: DashTab; badge: string | null }[] }[] = [
  {
    label: "Workspace",
    items: [
      { icon: LayoutDashboard, text: "Overview",      tab: "overview",       badge: null    },
      { icon: FileText,        text: "Documents",     tab: "documents",      badge: "count" },
      { icon: MessageCircle,   text: "Conversations", tab: "conversations",  badge: null    },
      { icon: BarChart2,       text: "Analytics",     tab: "analytics",      badge: null    },
      { icon: Bookmark,        text: "Saved",         tab: "saved",          badge: null    },
      { icon: BookOpen,        text: "Study Planner", tab: "planner",        badge: null    },
    ],
  },
  {
    label: "Team",
    items: [
      { icon: Users, text: "Members", tab: "members", badge: null },
    ],
  },
  {
    label: "Account",
    items: [
      { icon: CreditCard, text: "Billing",  tab: "billing",  badge: null },
      { icon: Settings,   text: "Settings", tab: "settings", badge: null },
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
  activeTab,
  onTabChange,
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
          <IntellixyBrainIcon size={28} />
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
              const isActive = activeTab === item.tab;
              return (
                <button
                  key={item.text}
                  className={`ds-nav-item${isActive ? " is-active" : ""}`}
                  type="button"
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => onTabChange(item.tab)}
                >
                  <Icon size={15} aria-hidden />
                  <span>{item.text}</span>
                  {item.badge === "count" && (
                    <span className="ds-nav-badge">{docsCount || 0}</span>
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
