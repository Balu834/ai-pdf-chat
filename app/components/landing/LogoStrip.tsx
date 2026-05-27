"use client";
import { motion } from "framer-motion";
import { ShieldCheck, FileText, Users, Globe2 } from "lucide-react";

const STATS = [
  { icon: ShieldCheck, val: "100%",    label: "Citation accuracy"     },
  { icon: FileText,    val: "2.4M+",   label: "Documents analyzed"    },
  { icon: Users,       val: "12,000+", label: "Teams trust Intellixy" },
  { icon: Globe2,      val: "50+",     label: "Countries worldwide"   },
];

const LOGOS = [
  {
    name: "Google",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor" opacity=".9"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor" opacity=".7"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="currentColor" opacity=".5"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor" opacity=".8"/>
      </svg>
    ),
  },
  {
    name: "Microsoft",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <rect x="1"  y="1"  width="10.5" height="10.5" fill="currentColor" opacity=".9"/>
        <rect x="12.5" y="1"  width="10.5" height="10.5" fill="currentColor" opacity=".7"/>
        <rect x="1"  y="12.5" width="10.5" height="10.5" fill="currentColor" opacity=".7"/>
        <rect x="12.5" y="12.5" width="10.5" height="10.5" fill="currentColor" opacity=".5"/>
      </svg>
    ),
  },
  {
    name: "AWS",
    icon: (
      <svg width="20" height="12" viewBox="0 0 32 20" fill="none">
        <path d="M9 14c-3.5.9-6 .4-7.5-1.5C0 10.5.5 7.5 3 5.5 5 4 8 3.5 11 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M7 10h4M9 8v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M16 4l2 12M14 10h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M23 4l-2.5 8L23 16l2.5-8L23 4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    name: "Stripe",
    icon: (
      <svg width="14" height="16" viewBox="0 0 22 26" fill="none">
        <path d="M10 7c0-1.7 1.4-2.5 3.5-2.5 2.3 0 4.8.7 6.5 1.8V1.5C18.3.6 16 0 13.5 0 7.8 0 4 3 4 8c0 7.5 10.5 6.3 10.5 9.5 0 2-1.7 2.7-4 2.7-2.5 0-5.3-.9-7.5-2.2V23c2 .9 4.3 1.5 7.5 1.5 5.8 0 9.5-2.8 9.5-8 0-8-10.5-6.5-10.5-9.5z" fill="currentColor"/>
      </svg>
    ),
  },
  {
    name: "HubSpot",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="17.5" cy="6.5" r="3" fill="currentColor" opacity=".9"/>
        <path d="M17.5 9.5v3.5a5.5 5.5 0 1 1-3.5-5.1V6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    name: "Vercel",
    icon: (
      <svg width="15" height="14" viewBox="0 0 24 22" fill="none">
        <path d="M12 2 L23 21 H1 Z" fill="currentColor"/>
      </svg>
    ),
  },
];

const cardVariant = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.44, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function LogoStrip() {
  return (
    <section className="lp-strip-section">

      {/* ── 4-stat grid ──────────────────────────────────────────────── */}
      <div className="lp-strip-inner">
        <motion.div
          className="lp-stats-grid"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-40px" }}
        >
          {STATS.map(s => {
            const Icon = s.icon;
            return (
              <motion.div key={s.label} className="lp-stat-card" variants={cardVariant}>
                <div className="lp-stat-card-icon">
                  <Icon size={20} strokeWidth={1.6} />
                </div>
                <div className="lp-stat-card-body">
                  <div className="lp-stat-card-val">{s.val}</div>
                  <div className="lp-stat-card-label">{s.label}</div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* ── Company logos ─────────────────────────────────────────────── */}
      <motion.div
        className="lp-logos-row"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.18 }}
      >
        <span className="lp-logos-eyebrow">TRUSTED BY INNOVATIVE TEAMS</span>
        <div className="lp-logos-list">
          {LOGOS.map(l => (
            <div key={l.name} className="lp-logo-item">
              <span className="lp-logo-icon">{l.icon}</span>
              <span className="lp-logo-name">{l.name}</span>
            </div>
          ))}
        </div>
      </motion.div>

    </section>
  );
}
