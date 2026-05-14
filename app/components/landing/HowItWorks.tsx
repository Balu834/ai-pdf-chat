"use client";
import { motion } from "framer-motion";

const STEPS = [
  {
    n: "1",
    title: "Upload your PDF",
    body: "Drop any PDF — research papers, contracts, financial reports, lecture notes. Indexed in seconds, no size limit on Pro.",
    tag: "⚡ Ready in under 10 seconds",
  },
  {
    n: "2",
    title: "Ask in plain English",
    body: "Type any question naturally. No need to scroll through 100 pages — just ask what you want to know.",
    tag: "💬 Conversational AI",
  },
  {
    n: "3",
    title: "Get cited answers",
    body: "Every answer includes exact page and section references. Click to jump to the source. No hallucinations.",
    tag: "📎 Verified citations every time",
  },
];

export default function HowItWorks() {
  return (
    <section className="lp-workflow-section" id="how-it-works">
      <div className="lp-workflow-inner">
        <motion.div
          className="lp-section-head"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="lp-section-eyebrow">How it works</p>
          <h2 className="lp-section-title">Three steps to instant insight</h2>
          <p className="lp-section-sub">
            From upload to cited answer in under 30 seconds.
          </p>
        </motion.div>

        <div className="lp-workflow-steps">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              className="lp-workflow-step"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="lp-workflow-num">{s.n}</div>
              <div>
                <div className="lp-workflow-title">{s.title}</div>
                <div className="lp-workflow-body">{s.body}</div>
                <div className="lp-workflow-tag">{s.tag}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
