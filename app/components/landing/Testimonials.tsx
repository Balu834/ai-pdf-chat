"use client";
import { motion } from "framer-motion";

const QUOTES = [
  {
    text: "I reviewed a 90-page investment memo in 20 minutes. The citations let me verify every claim instantly. This is the tool I didn't know I needed.",
    name: "Arjun Mehta",
    role: "Investment Analyst",
    company: "Sequoia Capital India",
    initials: "AM",
    color: "#2563eb",
  },
  {
    text: "Contract review used to take my team two days. Now we flag risks in under an hour. The citation accuracy is what makes it production-ready.",
    name: "Priya Sharma",
    role: "Legal Counsel",
    company: "Cyril Amarchand Mangaldas",
    initials: "PS",
    color: "#7c3aed",
  },
  {
    text: "We process 50+ quarterly reports every earnings season. Intellixy cut our analysis time by 70%. I can't imagine going back to manual reading.",
    name: "Rahul Verma",
    role: "Head of Research",
    company: "IIFL Securities",
    initials: "RV",
    color: "#059669",
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
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="lp-section-eyebrow">Testimonials</p>
          <h2 className="lp-section-title">Professionals who read smarter</h2>
        </motion.div>

        <motion.div
          className="lp-testimonials-grid"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
        >
          {QUOTES.map((q, i) => (
            <motion.div key={i} className="lp-testimonial-card" variants={card}>
              <div className="lp-testimonial-stars" aria-label="5 stars">
                {"★★★★★"}
              </div>
              <p className="lp-testimonial-text">&ldquo;{q.text}&rdquo;</p>
              <div className="lp-testimonial-author">
                <div
                  className="lp-testimonial-avatar"
                  style={{ background: q.color }}
                  aria-hidden
                >
                  {q.initials}
                </div>
                <div>
                  <div className="lp-testimonial-name">{q.name}</div>
                  <div className="lp-testimonial-role">{q.role} · {q.company}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
