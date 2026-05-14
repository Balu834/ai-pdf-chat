"use client";
import { useState } from "react";
import Link from "next/link";

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
      "Standard processing speed",
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

export default function PricingSection() {
  const [annual, setAnnual] = useState(false);

  return (
    <section className="lp-pricing-section" id="pricing">
      <div className="lp-pricing-inner">
        <div className="lp-section-head">
          <p className="lp-section-eyebrow">Pricing</p>
          <h2 className="lp-section-title">Simple, transparent pricing</h2>
          <p className="lp-section-sub">Start free. Upgrade when you need more.</p>
        </div>

        <div className="lp-pricing-toggle">
          <span className={`lp-pricing-label${!annual ? " active" : ""}`}>Monthly</span>
          <button
            className={`lp-pricing-toggle-track${annual ? " on" : ""}`}
            onClick={() => setAnnual(a => !a)}
            aria-label={annual ? "Switch to monthly billing" : "Switch to annual billing"}
          >
            <span className="lp-pricing-toggle-thumb" />
          </button>
          <span className={`lp-pricing-label${annual ? " active" : ""}`}>
            Annual
            <span className="lp-pricing-save">Save 20%</span>
          </span>
        </div>

        <div className="lp-pricing-grid">
          {PLANS.map(plan => (
            <div key={plan.name} className={`lp-price-card${plan.featured ? " featured" : ""}`}>
              {plan.featured && <div className="lp-price-popular">Most popular</div>}

              <div className="lp-price-name">{plan.name}</div>

              <div className="lp-price-amount">
                {plan.monthly !== null ? (
                  <>
                    <sup>₹</sup>
                    {annual ? plan.annual : plan.monthly}
                  </>
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
                    <span className="lp-price-check">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <Link href={plan.href} className="lp-price-btn">
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
