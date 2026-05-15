"use client";
import { motion } from "framer-motion";

const METRICS = [
  { val: "98%",   label: "Citation accuracy"   },
  { val: "3.4s",  label: "Avg. answer time"    },
  { val: "50K+",  label: "Documents processed" },
  { val: "4.9★",  label: "User rating"         },
];

const item = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function Stats() {
  return (
    <section className="lp-metrics-section">
      <motion.div
        className="lp-metrics-inner"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
      >
        {METRICS.map(m => (
          <motion.div key={m.label} className="lp-metric-item" variants={item}>
            <div className="lp-metric-val">{m.val}</div>
            <div className="lp-metric-label">{m.label}</div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
