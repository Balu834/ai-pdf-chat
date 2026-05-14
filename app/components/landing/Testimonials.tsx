"use client";
import { motion } from "framer-motion";

const TESTIMONIALS = [
  {
    quote: "I read 40-page contracts in 3 minutes now. Intellixy finds the renewal traps and liability clauses my paralegal would take hours to locate.",
    name: "Priya Venkataraman",
    role: "M&A Associate, Mumbai",
    init: "PV",
    bg:   "#d1fae5",
    color:"#059669",
  },
  {
    quote: "Our equity research team dropped average report-reading time by 70%. The citation accuracy is the only reason our compliance team approved it.",
    name: "Rohan Mehta",
    role: "VP Research, NBFC",
    init: "RM",
    bg:   "#dbeafe",
    color:"#2563eb",
  },
  {
    quote: "I used to spend Sunday nights reading board packs. Now I ask questions. Cited answers mean I can push back in meetings with exact page numbers.",
    name: "Anika Singh",
    role: "CFO, Series B SaaS",
    init: "AS",
    bg:   "#fce7f3",
    color:"#db2777",
  },
];

const card = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function Testimonials() {
  return (
    <section className="lp-testimonials-section">
      <div className="lp-testimonials-inner">
        <motion.div
          className="lp-section-head"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="lp-section-eyebrow">Testimonials</p>
          <h2 className="lp-section-title">Trusted by professionals who read for a living</h2>
        </motion.div>

        <motion.div
          className="lp-testimonials-grid"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09 } } }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
        >
          {TESTIMONIALS.map(t => (
            <motion.div key={t.name} className="lp-tcard" variants={card}>
              <div className="lp-tcard-stars" aria-label="5 out of 5 stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className="lp-tcard-star" aria-hidden>★</span>
                ))}
              </div>
              <blockquote className="lp-tcard-quote">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="lp-tcard-author">
                <div className="lp-tcard-av" style={{ background: t.bg, color: t.color }} aria-hidden>
                  {t.init}
                </div>
                <div>
                  <div className="lp-tcard-name">{t.name}</div>
                  <div className="lp-tcard-role">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
