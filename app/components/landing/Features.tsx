"use client";
import { motion } from "framer-motion";
import { FileSearch, Zap, FileText, Globe, Shield, AlertTriangle } from "lucide-react";

const CARDS = [
  {
    icon: <FileSearch size={20} />,
    eyebrow: "Core feature",
    title: "Cited answers, every time",
    body: "Every AI response links back to the exact page, section, and sentence. Every claim is verifiable — no black-box outputs.",
    featured: true,
    demo: true,
  },
  {
    icon: <Zap size={20} />,
    eyebrow: "Performance",
    title: "Answer in 3.4 seconds",
    body: "Streaming output so you see answers as they form. Average full response under 3.4s.",
  },
  {
    icon: <FileText size={20} />,
    eyebrow: "Formats",
    title: "PDF, DOCX, scans + OCR",
    body: "Handles scanned documents, handwritten notes, academic LaTeX. If it's a document, we read it.",
  },
  {
    icon: <Globe size={20} />,
    eyebrow: "Multi-language",
    title: "Cross-lingual retrieval",
    body: "Ask in English, get answers from a French contract. No manual translation needed.",
    dark: true,
  },
  {
    icon: <Shield size={20} />,
    eyebrow: "Privacy",
    title: "End-to-end encrypted",
    body: "Encrypted at rest and in transit. We never train on your data.",
    dark: true,
  },
  {
    icon: <AlertTriangle size={20} />,
    eyebrow: "Intelligence",
    title: "Automatic risk extraction",
    body: "Flags legal exposure, client concentration, and compliance gaps in contracts and reports.",
  },
];

const card = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function Features() {
  return (
    <section className="lp-features-section" id="features">
      <div className="lp-features-inner">
        <motion.div
          className="lp-section-head"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="lp-section-eyebrow">Features</p>
          <h2 className="lp-section-title">Everything you need to read smarter</h2>
          <p className="lp-section-sub">
            Built for professionals who can&apos;t afford to miss a detail.
          </p>
        </motion.div>

        <motion.div
          className="lp-bento"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
        >
          {CARDS.map((c, i) => (
            <motion.div
              key={i}
              className={`lp-bento-card${c.featured ? " featured" : ""}${c.dark ? " dark" : ""}`}
              variants={card}
            >
              <div className="lp-bento-icon">{c.icon}</div>
              <div className="lp-bento-eyebrow">{c.eyebrow}</div>
              <div className="lp-bento-title">{c.title}</div>
              <div className="lp-bento-body">{c.body}</div>
              {c.demo && (
                <div className="lp-bento-cite-demo">
                  Q3 revenue was <strong>₹423.7 crore</strong>, up 23.4% YoY,
                  beating analyst consensus by 4.2 pp.
                  <span className="lp-bento-cite-pill">p.14</span>
                  <span className="lp-bento-cite-pill">§3.2</span>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
