"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

const PROMISES = [
  "Your feedback directly shapes the product",
  "Direct line to the founding team",
  "Priority access to every new feature",
];

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
          <p className="lp-section-eyebrow">Early access</p>
          <h2 className="lp-section-title">New — and built honestly</h2>
        </motion.div>

        <motion.div
          className="lp-early-card"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="lp-early-lead">
            We don&apos;t have a wall of reviews yet — and that&apos;s intentional. We&apos;d rather earn your trust on your own documents than borrow it from fabricated quotes attributed to people at firms you know.
          </p>
          <p className="lp-early-sub">
            Be among the first legal and finance teams in India to use Intellixy on real documents — full-length MSAs, investment memos, regulatory filings.
          </p>
          <ul className="lp-early-promises">
            {PROMISES.map(p => (
              <li key={p} className="lp-early-promise">
                <CheckCircle2 size={16} strokeWidth={2} className="lp-early-check" aria-hidden />
                <span>{p}</span>
              </li>
            ))}
          </ul>
          <Link href="/login" className="lp-btn-green lp-early-cta">
            Get early access — it&apos;s free
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
