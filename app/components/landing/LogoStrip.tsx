"use client";
import { motion } from "framer-motion";
import { FileText, Zap, Users, Shield } from "lucide-react";

const METRICS = [
  { icon: FileText, val: "2.4M+", label: "Documents analyzed" },
  { icon: Zap,      val: "3.4s",  label: "Avg. response time"  },
  { icon: Users,    val: "500+",  label: "Enterprise teams"    },
  { icon: Shield,   val: "99.9%", label: "Uptime SLA"          },
];

const COMPANIES = [
  "Deloitte", "HDFC Bank", "Razorpay", "Goldman Sachs", "McKinsey", "Accenture",
];

const metricItem = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function LogoStrip() {
  return (
    <section className="lp-trust-section">
      <div className="lp-trust-inner">
        <motion.p
          className="lp-trust-eyebrow"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Intelligence deployed at scale
        </motion.p>

        <motion.div
          className="lp-trust-metrics"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-40px" }}
        >
          {METRICS.map(m => {
            const Icon = m.icon;
            return (
              <motion.div key={m.label} className="lp-trust-metric" variants={metricItem}>
                <div className="lp-trust-metric-icon">
                  <Icon size={14} strokeWidth={1.75} />
                </div>
                <div className="lp-trust-metric-val">{m.val}</div>
                <div className="lp-trust-metric-label">{m.label}</div>
              </motion.div>
            );
          })}
        </motion.div>

        <div className="lp-trust-div" />

        <motion.div
          className="lp-trust-companies"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <span className="lp-trust-companies-label">Trusted by</span>
          {COMPANIES.map(name => (
            <div key={name} className="lp-trust-company">{name}</div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
