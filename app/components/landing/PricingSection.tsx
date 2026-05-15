"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

const PLANS = [
  {
    name: "Free",
    price: "0",
    per: "forever",
    desc: "Perfect for trying Intellixy on personal documents.",
    feats: [
      "3 PDFs / month",
      "Up to 50 pages per PDF",
      "5 questions per document",
      "Basic citation links",
      "1 workspace",
    ],
    cta: { label: "Get started free", href: "/login", style: "outline" },
  },
  {
    name: "Pro",
    price: "12",
    per: "/ month",
    desc: "For professionals who work with documents daily.",
    badge: "Most popular",
    featured: true,
    feats: [
      "Unlimited PDFs",
      "Up to 500 pages per PDF",
      "Unlimited questions",
      "Cited answers + page jump",
      "3 workspaces",
      "OCR for scanned docs",
      "Priority support",
    ],
    cta: { label: "Start Pro free", href: "/login", style: "filled" },
  },
  {
    name: "Team",
    price: "49",
    per: "/ month",
    desc: "For teams that need collaboration and advanced controls.",
    feats: [
      "Everything in Pro",
      "5 team members",
      "Shared workspaces",
      "Admin controls",
      "Audit logs",
      "SSO / SAML",
      "Dedicated support",
    ],
    cta: { label: "Contact sales", href: "mailto:hello@intellixy.com", style: "outline" },
  },
];

const card = {
  hidden: { opacity: 0, y: 16 },
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
            Start free. Upgrade when you&apos;re ready. No hidden fees.
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
              {p.badge && <div className="lp-plan-badge">{p.badge}</div>}
              <div className="lp-plan-name">{p.name}</div>
              <div className="lp-plan-price">
                <span className="lp-plan-price-sup">$</span>
                {p.price}
              </div>
              <div className="lp-plan-per">{p.per}</div>
              <div className="lp-plan-desc">{p.desc}</div>
              <hr className="lp-plan-divider" />
              <ul className="lp-plan-feats">
                {p.feats.map(f => (
                  <li key={f} className="lp-plan-feat">
                    <Check size={12} strokeWidth={2.5} className="lp-plan-check" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={p.cta.href} className={`lp-plan-cta ${p.cta.style}`}>
                {p.cta.label}
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
