"use client";
import { motion } from "framer-motion";
import {
  FileSearch, Zap, FileText, Globe, Shield, ScanLine
} from "lucide-react";

const CARDS = [
  {
    icon: FileSearch,
    title: "Cited answers, every time",
    desc: "Every response links to the exact page and section. Every claim is verifiable — no black-box outputs.",
    featured: true,
    demo: {
      text: "Q3 revenue was",
      highlight: "₹423.7 crore",
      rest: ", up 23.4% YoY.",
      cites: ["p.14", "§3.2"],
    },
  },
  {
    icon: Zap,
    title: "Answer in 3.4 seconds",
    desc: "Streaming output so you see answers as they form. Average full response in under 3.4 seconds.",
  },
  {
    icon: FileText,
    title: "PDF, DOCX, scans + OCR",
    desc: "Handles scanned documents, handwritten notes, and academic LaTeX. If it's a document, we read it.",
  },
  {
    icon: Globe,
    title: "Cross-lingual retrieval",
    desc: "Ask in English, get answers from a French contract. No manual translation needed.",
  },
  {
    icon: Shield,
    title: "End-to-end encrypted",
    desc: "Encrypted at rest and in transit. SOC 2 Type II. We never train on your data.",
  },
  {
    icon: ScanLine,
    title: "Automatic risk extraction",
    desc: "Flags legal exposure, client concentration, and compliance gaps in contracts and reports.",
  },
];

const card = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function Features() {
  return (
    <section className="lp-features-section" id="features">
      <div className="lp-features-inner">
        <motion.div
          className="lp-section-head"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="lp-section-eyebrow">Features</p>
          <h2 className="lp-section-title">Everything you need to read smarter</h2>
          <p className="lp-section-sub">
            Built for professionals who can&apos;t afford to miss a detail.
          </p>
        </motion.div>

        <motion.div
          className="lp-feat-grid"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
        >
          {CARDS.map((c, i) => {
            const Icon = c.icon;
            return (
              <motion.div
                key={i}
                className={`lp-feat-card${c.featured ? " featured" : ""}`}
                variants={card}
              >
                <div className="lp-feat-icon">
                  <Icon size={16} strokeWidth={1.75} />
                </div>
                <div className="lp-feat-title">{c.title}</div>
                <div className="lp-feat-desc">{c.desc}</div>
                {c.demo && (
                  <div className="lp-feat-demo">
                    {c.demo.text}{" "}
                    <strong>{c.demo.highlight}</strong>
                    {c.demo.rest}
                    {c.demo.cites.map(cite => (
                      <span key={cite} className="lp-feat-demo-pill">{cite}</span>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
