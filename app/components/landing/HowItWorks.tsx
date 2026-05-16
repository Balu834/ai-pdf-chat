"use client";
import { motion } from "framer-motion";
import { Upload, MessageSquare, BookOpen } from "lucide-react";

const STEPS = [
  {
    num: "01",
    icon: Upload,
    title: "Upload any document",
    desc: "Drop in a PDF, DOCX, scanned image, or academic paper. Intellixy processes it in seconds — including OCR for scanned and handwritten pages.",
    detail: "PDF · DOCX · PNG · Scans · LaTeX",
  },
  {
    num: "02",
    icon: MessageSquare,
    title: "Ask in plain English",
    desc: "Type your question naturally. \"What are the key risks in clause 7?\" or \"Summarise the financials.\" No special syntax, no training required.",
    detail: "Works in 40+ languages",
  },
  {
    num: "03",
    icon: BookOpen,
    title: "Get cited, verified answers",
    desc: "Every response includes exact page and section references. Click any citation to jump directly to the source and verify every claim in seconds.",
    detail: "100% accuracy · avg. 3.4s response",
  },
];

const item = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function HowItWorks() {
  return (
    <section className="lp-how-section" id="how">
      <div className="lp-how-inner">
        <motion.div
          className="lp-section-head"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="lp-section-eyebrow">How it works</p>
          <h2 className="lp-section-title">From document to answer in three steps</h2>
          <p className="lp-section-sub">No training. No setup. No manual reading.</p>
        </motion.div>

        <motion.div
          className="lp-how-steps"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
        >
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div key={i} className="lp-how-step" variants={item}>
                <div className="lp-how-step-top">
                  <div className="lp-how-num">{s.num}</div>
                  {i < STEPS.length - 1 && <div className="lp-how-line" aria-hidden />}
                </div>
                <div className="lp-how-icon-wrap">
                  <Icon size={18} strokeWidth={1.75} />
                </div>
                <h3 className="lp-how-title">{s.title}</h3>
                <p className="lp-how-desc">{s.desc}</p>
                <div className="lp-how-detail">{s.detail}</div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
