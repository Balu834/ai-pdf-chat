"use client";
import { motion } from "framer-motion";
import { ShieldCheck, FileText, Lock, CreditCard } from "lucide-react";

/* ── Honest stats — product facts only, no fabricated user counts ──────── */
const STATS = [
  { icon: ShieldCheck, val: "100%",  label: "Citation Accuracy",        desc: "Every answer sourced directly from your document"  },
  { icon: FileText,    val: "120+",  label: "File Formats",              desc: "PDF, DOCX, XLSX, PPTX, HTML and more"             },
  { icon: Lock,        val: "Zero",  label: "AI Training on Your Data",  desc: "Your documents are never used to train models"     },
  { icon: CreditCard,  val: "Free",  label: "To Start — No Card",        desc: "Try on real documents with no commitment"          },
];

/* ── Animations ───────────────────────────────────────────────────────────── */
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.10 } } };
const cardVariant = {
  hidden: { opacity: 0, y: 30 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.70, ease: [0.22, 1, 0.36, 1] as const } },
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
        <motion.div
          className="lp-stats-grid"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
        >
          {STATS.map(s => <StatCard key={s.label} {...s} />)}
        </motion.div>
      </div>
    </section>
  );
}
