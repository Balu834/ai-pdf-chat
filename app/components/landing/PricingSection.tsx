"use client";
import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

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
    desc:     "For teams and compliance-heavy workflows",
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
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

  return (
    <section className="lp-pricing" id="pricing">
      <div className="lp-section-head">
        <p className="lp-section-eyebrow">Pricing</p>
        <h2 className="lp-section-title">Simple, transparent pricing</h2>
        <p className="lp-section-sub">Start free. Upgrade when you need more.</p>
      </div>

      {/* Billing toggle */}
      <div className="lp-billing-toggle" role="group" aria-label="Billing period">
        <button
          className={`lp-billing-opt${billing === "monthly" ? " active" : ""}`}
          onClick={() => setBilling("monthly")}
        >
          Monthly
        </button>
        <button
          className={`lp-billing-opt${billing === "annual" ? " active" : ""}`}
          onClick={() => setBilling("annual")}
        >
          Annual
          <span className="lp-billing-save">Save 20%</span>
        </button>
      </div>

      {/* Plans */}
      <div className="lp-price-grid">
        {PLANS.map(plan => (
          <div
            key={plan.name}
            className={`lp-price-card${plan.featured ? " featured" : ""}`}
          >
            <div className="lp-price-head">
              <p className="lp-price-name">{plan.name}</p>
              <p className="lp-price-desc">{plan.desc}</p>

              {plan.monthly !== null ? (
                <div className="lp-price-amount">
                  <span className="lp-price-num">
                    ₹{billing === "monthly" ? plan.monthly : plan.annual}
                  </span>
                  <span className="lp-price-per">/mo</span>
                </div>
              ) : (
                <div className="lp-price-amount">
                  <span className="lp-price-num">Custom</span>
                </div>
              )}
            </div>

            <Link href={plan.href} className={`lp-price-cta${plan.featured ? " featured" : ""}`}>
              {plan.cta}
            </Link>

            <ul className="lp-price-feats">
              {plan.features.map(f => (
                <li key={f} className="lp-price-feat">
                  <Check size={15} strokeWidth={2.5} aria-hidden />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
