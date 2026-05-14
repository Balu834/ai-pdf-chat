import type { Metadata } from "next";
import "./landing.css";
import Nav             from "@/app/components/landing/Nav";
import Hero            from "@/app/components/landing/Hero";
import Stats           from "@/app/components/landing/Stats";
import Showcase        from "@/app/components/landing/Showcase";
import Features        from "@/app/components/landing/Features";
import HowItWorks      from "@/app/components/landing/HowItWorks";
import InteractiveDemo from "@/app/components/landing/InteractiveDemo";
import Testimonials    from "@/app/components/landing/Testimonials";
import PricingSection  from "@/app/components/landing/PricingSection";
import FaqAccordion    from "@/app/components/landing/FaqAccordion";
import FinalCTA        from "@/app/components/landing/FinalCTA";
import Footer          from "@/app/components/landing/Footer";

export const metadata: Metadata = {
  title: "Intellixy — Chat with any PDF instantly",
  description:
    "Upload any PDF and get instant answers, summaries, and insights using AI. Free plan available — no credit card needed.",
};

const LOGOS = ["McKinsey", "Deloitte", "KPMG", "IISc", "NLU Delhi", "Razorpay", "Sequoia", "Y Combinator"];

export default function Page() {
  return (
    <>
      <Nav />

      <main>
        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <Hero />

        {/* ── Logo cloud ────────────────────────────────────────────────── */}
        <div className="lp-logos">
          <p className="lp-logos-label">Trusted by teams at</p>
          <div className="lp-logos-list">
            {LOGOS.map(l => (
              <span key={l} className="lp-logos-item">{l}</span>
            ))}
          </div>
        </div>

        {/* ── Stats / AI accuracy ───────────────────────────────────────── */}
        <Stats />

        {/* ── Product showcase ──────────────────────────────────────────── */}
        <Showcase />

        {/* ── Features grid ─────────────────────────────────────────────── */}
        <Features />

        {/* ── How it works ──────────────────────────────────────────────── */}
        <HowItWorks />

        {/* ── Interactive demo ──────────────────────────────────────────── */}
        <section className="lp-demo-section" id="demo">
          <div className="lp-demo-inner">
            <div className="lp-section-head">
              <p className="lp-section-eyebrow">Interactive demo</p>
              <h2 className="lp-section-title">Try it — right now</h2>
              <p className="lp-section-sub">
                No sign-up required. Ask anything about a real financial report.
              </p>
            </div>
            <InteractiveDemo />
          </div>
        </section>

        {/* ── Testimonials ──────────────────────────────────────────────── */}
        <Testimonials />

        {/* ── Pricing ───────────────────────────────────────────────────── */}
        <PricingSection />

        {/* ── FAQ ───────────────────────────────────────────────────────── */}
        <section className="lp-faq-section" id="faq">
          <div className="lp-faq-inner">
            <div className="lp-section-head">
              <p className="lp-section-eyebrow">FAQ</p>
              <h2 className="lp-section-title">Questions worth asking</h2>
              <p className="lp-section-sub">
                Can&apos;t find what you&apos;re looking for?{" "}
                <a href="mailto:hello@intellixy.com">Email us</a> — we reply fast.
              </p>
            </div>
            <FaqAccordion />
          </div>
        </section>

        {/* ── Final CTA ─────────────────────────────────────────────────── */}
        <FinalCTA />
      </main>

      <Footer />
    </>
  );
}
