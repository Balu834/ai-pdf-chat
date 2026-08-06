"use client";
import { motion } from "framer-motion";
import { ShieldCheck, FileText, Users, Globe2 } from "lucide-react";

/* ── Data ─────────────────────────────────────────────────────────────────── */
const STATS = [
  { icon: ShieldCheck, val: "100%",    label: "Citation Accuracy",      desc: "Reliable AI citations, every time"         },
  { icon: FileText,    val: "2.4M+",   label: "Documents Analyzed",     desc: "Millions of documents processed"           },
  { icon: Users,       val: "12,000+", label: "Teams Trust Intellixy",  desc: "Trusted by startups & enterprises"         },
  { icon: Globe2,      val: "50+",     label: "Countries Worldwide",    desc: "Available across the globe"                },
];

const LOGOS: { name: string; nameColor: string; icon: React.ReactNode }[] = [
  {
    name: "Google",
    nameColor: "#5F6368",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
  },
  {
    name: "Microsoft",
    nameColor: "#737373",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="1"    y="1"    width="10.5" height="10.5" fill="#F25022"/>
        <rect x="12.5" y="1"    width="10.5" height="10.5" fill="#7FBA00"/>
        <rect x="1"    y="12.5" width="10.5" height="10.5" fill="#00A4EF"/>
        <rect x="12.5" y="12.5" width="10.5" height="10.5" fill="#FFB900"/>
      </svg>
    ),
  },
  {
    name: "AWS",
    nameColor: "#FF9900",
    icon: (
      <svg width="36" height="22" viewBox="0 0 60 36" fill="none" aria-hidden>
        {/* A */}
        <path d="M4 28 L10 6 L16 28 M6.5 20 H13.5" stroke="#FF9900" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
        {/* W */}
        <path d="M20 6 L25 24 L30 12 L35 24 L40 6" stroke="#FF9900" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
        {/* S */}
        <path d="M56 12 Q56 6 49 6 Q42 6 42 13 Q42 18 49 18 Q56 18 56 25 Q56 32 49 32 Q42 32 42 27" stroke="#FF9900" strokeWidth="2.8" strokeLinecap="round"/>
        {/* Smile */}
        <path d="M2 35 Q30 42 58 35" stroke="#FF9900" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
      </svg>
    ),
  },
  {
    name: "Stripe",
    nameColor: "#635BFF",
    icon: (
      <svg width="20" height="22" viewBox="0 0 22 26" fill="none" aria-hidden>
        <path d="M10 7c0-1.7 1.4-2.5 3.5-2.5 2.3 0 4.8.7 6.5 1.8V1.5C18.3.6 16 0 13.5 0 7.8 0 4 3 4 8c0 7.5 10.5 6.3 10.5 9.5 0 2-1.7 2.7-4 2.7-2.5 0-5.3-.9-7.5-2.2V23c2 .9 4.3 1.5 7.5 1.5 5.8 0 9.5-2.8 9.5-8 0-8-10.5-6.5-10.5-9.5z" fill="#635BFF"/>
      </svg>
    ),
  },
  {
    name: "HubSpot",
    nameColor: "#FF7A59",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="17.5" cy="6.5" r="3.2" fill="#FF7A59"/>
        <path d="M17.5 9.7v3.5a5.5 5.5 0 1 1-3.5-5.1V6.5" stroke="#FF7A59" strokeWidth="2.2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    name: "Vercel",
    nameColor: "#000000",
    icon: (
      <svg width="20" height="18" viewBox="0 0 24 22" fill="none" aria-hidden>
        <path d="M12 2 L23 21 H1 Z" fill="#000000"/>
      </svg>
    ),
  },
];

/* ── Animations ───────────────────────────────────────────────────────────── */
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.10 } } };
const cardVariant = {
  hidden: { opacity: 0, y: 30 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.70, ease: [0.22, 1, 0.36, 1] as const } },
};
const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.60, ease: [0.22, 1, 0.36, 1] as const } },
};

/* ── Stat card ────────────────────────────────────────────────────────────── */
function StatCard({ icon: Icon, val, label, desc }: typeof STATS[number]) {
  return (
    <motion.div className="lp-stat-card" variants={cardVariant}>
      <div className="lp-stat-card-icon">
        <Icon size={24} strokeWidth={1.75} />
      </div>
      <div className="lp-stat-card-val">{val}</div>
      <div className="lp-stat-card-label">{label}</div>
      <p className="lp-stat-card-desc">{desc}</p>
    </motion.div>
  );
}

/* ── Main export ──────────────────────────────────────────────────────────── */
export default function LogoStrip() {
  return (
    <section className="lp-strip-section">
      <div className="lp-strip-inner">

        {/* ── 4-stat grid ──────────────────────────────────────────────── */}
        <motion.div
          className="lp-stats-grid"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
        >
          {STATS.map(s => <StatCard key={s.label} {...s} />)}
        </motion.div>

        {/* ── Trust headline ────────────────────────────────────────────── */}
        <motion.h2
          className="lp-trust-headline"
          variants={fadeIn}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-40px" }}
        >
          Trusted by <em>10,000+</em> professionals and teams worldwide
        </motion.h2>

        {/* ── Company logos ─────────────────────────────────────────────── */}
        <motion.div
          className="lp-logos-row"
          variants={fadeIn}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-40px" }}
          transition={{ delay: 0.1 }}
        >
          <div className="lp-logos-eyebrow">
            <span>TRUSTED BY</span>
            <span>INNOVATIVE TEAMS</span>
          </div>
          <div className="lp-logos-divider" aria-hidden />
          <div className="lp-logos-list">
            {LOGOS.map(l => (
              <div key={l.name} className="lp-logo-item" style={{ color: l.nameColor }}>
                <span className="lp-logo-icon">{l.icon}</span>
                <span className="lp-logo-name">{l.name}</span>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  );
}
