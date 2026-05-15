"use client";
import { motion } from "framer-motion";
import { Upload, MessageSquare, BookMarked } from "lucide-react";

const STEPS = [
  {
    n: "01",
    icon: Upload,
    title: "Upload",
    body: "Drop any PDF — contracts, research, financial reports, lecture notes. Indexed in seconds, no size limit on Pro.",
    tag: "⚡ Ready in under 10s",
  },
  {
    n: "02",
    icon: MessageSquare,
    title: "Ask",
    body: "Type any question in plain English. No need to scroll through 100 pages — just ask what you want to know.",
    tag: "💬 Conversational AI",
  },
  {
    n: "03",
    icon: BookMarked,
    title: "Get cited answers",
    body: "Every answer includes exact page and section references. Click to jump to the source. No hallucinations.",
    tag: "📎 Verified citations",
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

        <div className="lp-how-grid">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.n}
                className="lp-how-step"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="lp-how-step-num">{s.n}</div>
                <div className="lp-how-step-icon">
                  <Icon size={20} strokeWidth={1.75} />
                </div>
                <div className="lp-how-step-title">{s.title}</div>
                <div className="lp-how-step-body">{s.body}</div>
                <div className="lp-how-step-tag">{s.tag}</div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
