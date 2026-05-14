"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const PLANS = [
  {
    name:     "Free",
    monthly:  0,
    annual:   0,
    desc:     "For individuals getting started",
    cta:      "Get started free",
    href:     "/dashboard",
    featured: false,
    features: [
      "3 PDF uploads (lifetime)",
      "5 questions per month",
      "Cited answers",
      "Standard processing",
      "Community support",
    ],
  },
  {
    name:     "Pro",
    monthly:  249,
    annual:   199,
    desc:     "For professionals who read daily",
    cta:      "Start free trial",
    href:     "/login",
    featured: true,
    features: [
      "Unlimited PDF uploads",
      "Unlimited questions",
      "Priority processing",
      "Multi-document chat",
      "Export to Notion & Docs",
      "API access",
    ],
  },
  {
    name:     "Enterprise",
    monthly:  null,
    annual:   null,
    desc:     "For teams and compliance workflows",
    cta:      "Contact sales",
    href:     "mailto:sales@intellixy.com",
    featured: false,
    features: [
      "Everything in Pro",
      "On-premise deployment",
      "SSO / SAML",
      "Audit logs",
      "SLA guarantee",
      "Dedicated support",
    ],
  },
];

const card = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function PricingSection() {
  const [annual, setAnnual] = useState(false);

  return (
    <section className="lp-pricing-section" id="pricing">
      <div className="lp-pricing-inner">
        <motion.div
          className="lp-section-head"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="lp-section-eyebrow">Pricing</p>
          <h2 className="lp-section-title">Simple, transparent pricing</h2>
          <p className="lp-section-sub">Start free. Upgrade when you need more.</p>
        </motion.div>

        {/* Toggle */}
        <div className="lp-pricing-toggle">
          <span className={`lp-pricing-label${!annual ? " active" : ""}`}>Monthly</span>
          <button
            className={`lp-pricing-toggle-track${annual ? " on" : ""}`}
            onClick={() => setAnnual(a => !a)}
            aria-label={annual ? "Switch to monthly" : "Switch to annual billing"}
          >
            <span className="lp-pricing-toggle-thumb" />
          </button>
          <span className={`lp-pricing-label${annual ? " active" : ""}`}>
            Annual <span className="lp-pricing-save">Save 20%</span>
          </span>
        </div>

        {/* Cards */}
        <motion.div
          className="lp-pricing-grid"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09 } } }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
        >
          {PLANS.map(plan => (
            <motion.div
              key={plan.name}
              className={`lp-price-card${plan.featured ? " featured" : ""}`}
              variants={card}
            >
              {plan.featured && <div className="lp-price-popular">Most popular</div>}

              <div className="lp-price-name">{plan.name}</div>
              <div className="lp-price-amount">
                {plan.monthly !== null ? (
                  <><sup>₹</sup>{annual ? plan.annual : plan.monthly}</>
                ) : (
                  "Custom"
                )}
              </div>
              <div className="lp-price-period">
                {plan.monthly !== null ? "per month" : "talk to us"}
              </div>

              <ul className="lp-price-features">
                {plan.features.map(f => (
                  <li key={f} className="lp-price-feat">
                    <span className="lp-price-check" aria-hidden>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <Link href={plan.href} className="lp-price-btn">{plan.cta}</Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
