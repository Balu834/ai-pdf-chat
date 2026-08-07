import type { Metadata } from "next";
import "./landing.css";
import Nav             from "@/app/components/landing/Nav";
import Hero            from "@/app/components/landing/Hero";
import LogoStrip       from "@/app/components/landing/LogoStrip";
import HowItWorks      from "@/app/components/landing/HowItWorks";
import Features        from "@/app/components/landing/Features";
import Testimonials    from "@/app/components/landing/Testimonials";
import InteractiveDemo from "@/app/components/landing/InteractiveDemo";
import Stats           from "@/app/components/landing/Stats";
import PricingSection  from "@/app/components/landing/PricingSection";
import FinalCTA        from "@/app/components/landing/FinalCTA";
import Footer          from "@/app/components/landing/Footer";

export const metadata: Metadata = {
  title: { absolute: "Intellixy – Chat with your PDFs, get cited answers instantly" },
  description:
    "Upload a PDF and ask questions in plain English. Every answer includes exact page citations you can verify. Built for legal and finance teams. Free to start.",
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
              <p className="lp-section-eyebrow">Live demo</p>
              <h2 className="lp-section-title">Try it — right now</h2>
              <p className="lp-section-sub">
                No sign-up required. Ask anything about a real financial report.
              </p>
            </div>
            <InteractiveDemo />
          </div>
        </section>

        {/* 7. Stats / metrics bar */}
        <Stats />

        {/* 8. Pricing */}
        <PricingSection />

        {/* 9. Final CTA */}
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
