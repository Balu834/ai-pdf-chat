"use client";
import { motion } from "framer-motion";

const STATS = [
  { val: "98%",   label: "Citation accuracy"     },
  { val: "3.4s",  label: "Average answer time"   },
  { val: "50K+",  label: "Documents processed"   },
  { val: "4.9★",  label: "Average user rating"   },
];

const item = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function Stats() {
  return (
    <section className="lp-stats-section">
      <motion.div
        className="lp-stats-inner"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
      >
        {STATS.map(s => (
          <motion.div key={s.label} className="lp-stat-item" variants={item}>
            <div className="lp-stat-val">{s.val}</div>
            <div className="lp-stat-label">{s.label}</div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
