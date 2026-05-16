"use client";
import { motion } from "framer-motion";
import { BookOpen, Zap, FileText, ShieldCheck } from "lucide-react";

const METRICS = [
  {
    icon: BookOpen,
    val: "100%",
    label: "Citation accuracy",
    sub: "Every answer sourced",
  },
  {
    icon: Zap,
    val: "3.4s",
    label: "Avg. response time",
    sub: "Even on 500-page docs",
  },
  {
    icon: FileText,
    val: "PDF · DOCX · OCR",
    label: "All major formats",
    sub: "Including scanned pages",
    wide: true,
  },
  {
    icon: ShieldCheck,
    val: "100%",
    label: "End-to-end encrypted",
    sub: "Your data stays private",
  },
];

const item = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function Stats() {
  return (
    <section className="lp-metrics-section">
      <motion.div
        className="lp-metrics-inner"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
      >
        {METRICS.map(m => {
          const Icon = m.icon;
          return (
            <motion.div key={m.label} className="lp-metric-item" variants={item}>
              <div className="lp-metric-icon">
                <Icon size={15} strokeWidth={1.75} />
              </div>
              <div className={`lp-metric-val${m.wide ? " lp-metric-val-sm" : ""}`}>
                {m.val}
              </div>
              <div className="lp-metric-label">{m.label}</div>
              <div className="lp-metric-sub">{m.sub}</div>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
