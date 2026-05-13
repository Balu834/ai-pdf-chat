"use client";
import { useState } from "react";
import Link from "next/link";
import FadeUp, { StaggerParent, StaggerChild } from "./FadeUp";

const PLANS = [
  {
    name: "Free",
    monthly: 0,
    annual: 0,
    desc: "For individuals getting started",
    cta: "Get started free",
    href: "/dashboard",
    featured: false,
    features: [
      "3 PDF uploads lifetime",
      "5 questions per month",
      "AI answers with citations",
      "Standard processing speed",
      "Community support",
    ],
  },
  {
    name: "Pro",
    monthly: 299,
    annual: 249,
    desc: "For professionals who read seriously",
    cta: "Start free trial",
    href: "/dashboard",
    featured: true,
    badge: "Most popular",
    features: [
      "Unlimited PDF uploads",
      "Unlimited questions",
      "Priority AI processing",
      "Export to Notion & Docs",
      "Multi-document chat",
      "Email support",
    ],
  },
  {
    name: "Enterprise",
    monthly: null,
    annual: null,
    desc: "For teams with serious document needs",
    cta: "Contact sales",
    href: "/dashboard",
    featured: false,
    features: [
      "Everything in Pro",
      "Team workspaces & SSO",
      "Custom AI fine-tuning",
      "On-premise deployment",
      "API access",
      "Dedicated support",
    ],
  },
];

export default function PricingSection() {
  const [annual, setAnnual] = useState(true);

  return (
    <section id="pricing" className="pr-section">
      <div className="pr-inner">
        <FadeUp>
          <div className="pr-eyebrow">Pricing</div>
          <h2 className="pr-title">Simple, honest pricing</h2>
          <p className="pr-sub">Start free. Upgrade when you&apos;re ready. Cancel anytime.</p>

          <div className="pr-toggle">
            <button
              className={`pr-toggle-opt${!annual ? " pr-toggle-active" : ""}`}
              onClick={() => setAnnual(false)}
            >
              Monthly
            </button>
            <button
              className={`pr-toggle-opt${annual ? " pr-toggle-active" : ""}`}
              onClick={() => setAnnual(true)}
            >
              Annual
              <span className="pr-save">Save 17%</span>
            </button>
          </div>
        </FadeUp>

        <StaggerParent className="pr-cards">
          {PLANS.map((plan) => (
            <StaggerChild key={plan.name}>
              <div className={`pr-card${plan.featured ? " pr-card--featured" : ""}`}>
                {plan.badge && <div className="pr-badge">{plan.badge}</div>}

                <div className="pr-plan-name">{plan.name}</div>

                <div className="pr-price">
                  {plan.monthly === null ? (
                    <span className="pr-custom">Custom</span>
                  ) : plan.monthly === 0 ? (
                    <span className="pr-free">Free forever</span>
                  ) : (
                    <>
                      <span className="pr-currency">₹</span>
                      <span className="pr-amount">{annual ? plan.annual : plan.monthly}</span>
                      <span className="pr-period">/mo</span>
                    </>
                  )}
                </div>
                {annual && plan.monthly !== null && plan.monthly !== 0 && (
                  <div className="pr-billed">Billed annually · saves ₹{((plan.monthly! - plan.annual!) * 12).toLocaleString()}/yr</div>
                )}

                <p className="pr-plan-desc">{plan.desc}</p>

                <Link
                  href={plan.href}
                  className={`pr-cta${plan.featured ? " pr-cta--filled" : " pr-cta--outline"}`}
                >
                  {plan.cta}
                </Link>

                <ul className="pr-features">
                  {plan.features.map((f) => (
                    <li key={f} className="pr-feat">
                      <span className="pr-check">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </StaggerChild>
          ))}
        </StaggerParent>

        <FadeUp delay={0.3}>
          <p className="pr-note">
            All plans include a 14-day money-back guarantee. No questions asked.
          </p>
        </FadeUp>
      </div>
    </section>
  );
}
