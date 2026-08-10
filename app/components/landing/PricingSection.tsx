"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";

const PLANS = [
  {
    name: "Free",
    price: "0",
    priceNote: "forever free",
    desc: "Try Intellixy on your own documents. No credit card required.",
    feats: [
      "3 PDFs per month",
      "Up to 100 pages per PDF",
      "Basic AI chat",
      "Basic citation links",
    ],
    cta: { label: "Get started free", href: "/login", style: "outline" },
  },
  {
    name: "Pro",
    price: "299",
    priceNote: "per month",
    desc: "For professionals who read and analyze documents daily.",
    badge: "Most Popular",
    featured: true,
    feats: [
      "Unlimited PDFs",
      "Up to 500 pages per PDF",
      "Unlimited AI questions",
      "Citations + exact page references",
      "Faster AI responses",
      "Priority support",
    ],
    cta: { label: "Start with Pro", href: "/login", style: "filled" },
  },
  {
    name: "Team",
    price: "999",
    priceNote: "per month",
    desc: "For teams that read, research, and collaborate on documents together.",
    feats: [
      "Everything in Pro",
      "Team workspaces — coming soon",
      "Shared chats & history — coming soon",
      "Admin controls — coming soon",
      "Audit logs — coming soon",
      "Priority support",
    ],
    cta: { label: "Start with Team", href: "/login?plan=team", style: "outline" },
  },
];

const card = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function PricingSection() {
  return (
    <section className="lp-pricing-section" id="pricing">
      <div className="lp-pricing-inner">
        <motion.div
          className="lp-section-head"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="lp-section-eyebrow">Pricing</p>
          <h2 className="lp-section-title">Simple, transparent pricing</h2>
          <p className="lp-section-sub">
            Start free. Upgrade when you&apos;re ready. Cancel any time. No hidden fees.
          </p>
        </motion.div>

        <motion.div
          className="lp-pricing-grid"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-40px" }}
        >
          {PLANS.map(p => (
            <motion.div
              key={p.name}
              className={`lp-plan${p.featured ? " featured" : ""}`}
              variants={card}
            >
              <div className="lp-plan-top">
                {p.badge
                  ? <div className="lp-plan-badge">{p.badge}</div>
                  : <div className="lp-plan-badge-spacer" />
                }
                <div className="lp-plan-name">{p.name}</div>
                <div className="lp-plan-price-row">
                  <span className="lp-plan-currency">₹</span>
                  <span className="lp-plan-amount">{p.price}</span>
                </div>
                <div className="lp-plan-per">{p.priceNote}</div>
                <p className="lp-plan-desc">{p.desc}</p>
              </div>

              <hr className="lp-plan-divider" />

              <ul className="lp-plan-feats">
                {p.feats.map(f => (
                  <li key={f} className="lp-plan-feat">
                    <Check size={13} strokeWidth={2.5} className="lp-plan-check" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="lp-plan-cta-wrap">
                <Link
                  href={p.cta.href}
                  className={`lp-plan-cta ${p.cta.style}`}
                >
                  {p.cta.label}
                  {p.featured && <ArrowRight size={14} strokeWidth={2} />}
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="lp-pricing-trust"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <p className="lp-pricing-security">
            🔒 Your documents are encrypted end-to-end and <strong>never used to train AI models.</strong> We process your files in isolated environments and do not retain them after your session.
          </p>
          <p className="lp-pricing-footnote-inline">
            All plans include SSL encryption · No setup fees · Cancel any time
          </p>
        </motion.div>
      </div>
    </section>
  );
}
