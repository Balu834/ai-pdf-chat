"use client";
import { motion } from "framer-motion";
import { ShieldCheck, FileText, Users, Globe2 } from "lucide-react";

const STATS = [
  { icon: ShieldCheck, val: "98.7%",   label: "Citation accuracy"     },
  { icon: FileText,    val: "2.4M+",   label: "Documents analyzed"    },
  { icon: Users,       val: "12,000+", label: "Teams trust Intellixy" },
  { icon: Globe2,      val: "50+",     label: "Countries worldwide"   },
];

const LOGOS = [
  {
    name: "ACME",
    icon: (
      <svg width="15" height="14" viewBox="0 0 24 22" fill="none">
        <path d="M12 2 L23 21 H1 Z" fill="currentColor" />
      </svg>
    ),
  },
  {
    name: "matrix",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="3.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    name: "CloudSync",
    icon: (
      <svg width="18" height="14" viewBox="0 0 26 21" fill="none">
        <path d="M19.5 8.5A6.5 6.5 0 0 0 7 9v.5A5 5 0 1 0 7 19h12a4.5 4.5 0 0 0 .5-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: "Vertex",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <path d="M3 5 L12 20 L21 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 12 L17 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: "Novus",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <path d="M4 20 V4 L12 16 L20 4 V20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    name: "DataHive",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <circle cx="5"  cy="5"  r="2" fill="currentColor" />
        <circle cx="12" cy="5"  r="2" fill="currentColor" />
        <circle cx="19" cy="5"  r="2" fill="currentColor" />
        <circle cx="5"  cy="12" r="2" fill="currentColor" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
        <circle cx="19" cy="12" r="2" fill="currentColor" />
        <circle cx="5"  cy="19" r="2" fill="currentColor" />
        <circle cx="12" cy="19" r="2" fill="currentColor" />
        <circle cx="19" cy="19" r="2" fill="currentColor" />
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
