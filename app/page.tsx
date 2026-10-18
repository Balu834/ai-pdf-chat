import type { Metadata } from "next";
import "./landing.css";
import Nav             from "@/app/components/landing/Nav";
import Hero            from "@/app/components/landing/Hero";
import LogoStrip       from "@/app/components/landing/LogoStrip";
import HowItWorks      from "@/app/components/landing/HowItWorks";
import Features        from "@/app/components/landing/Features";
import Testimonials    from "@/app/components/landing/Testimonials";
import InteractiveDemo from "@/app/components/landing/InteractiveDemo";
import PricingSection  from "@/app/components/landing/PricingSection";
import FinalCTA        from "@/app/components/landing/FinalCTA";
import Footer          from "@/app/components/landing/Footer";

export const metadata: Metadata = {
  title: { absolute: "Intellixy – Chat with your PDFs, get cited answers instantly" },
  description:
    "Upload a PDF and ask questions in plain English. Every answer includes exact page citations you can verify. For legal and finance work, and for students revising from their notes. Free to start.",
};

export default function Page() {
  return (
    <div className="lp-page">
      <Nav />
      <main>
        {/* 1. Hero — copy + preview */}
        <Hero />

        {/* 2. Social proof — logo strip */}
        <LogoStrip />

        {/* 3. How it works — 3-step process */}
        <HowItWorks />

        {/* 4. Features — conversation card demos */}
        <Features />

        {/* 5. Testimonials — user quotes */}
        <Testimonials />

        {/* 6. Live interactive demo */}
        <section className="lp-demo-section" id="demo">
          <div className="lp-demo-inner">
            <div className="lp-section-head">
              <p className="lp-section-eyebrow">Sample demo</p>
              <h2 className="lp-section-title">See how answers look</h2>
              <p className="lp-section-sub">
                A made-up sample report with pre-written answers, so you can see the format. Sign up free to ask anything about your own PDF.
              </p>
            </div>
            <InteractiveDemo />
          </div>
        </section>

        {/* 7. Pricing */}
        <PricingSection />

        {/* 9. Final CTA */}
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
