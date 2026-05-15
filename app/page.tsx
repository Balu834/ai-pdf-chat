import type { Metadata } from "next";
import "./landing.css";
import Nav             from "@/app/components/landing/Nav";
import Hero            from "@/app/components/landing/Hero";
import Features        from "@/app/components/landing/Features";
import InteractiveDemo from "@/app/components/landing/InteractiveDemo";
import Stats           from "@/app/components/landing/Stats";
import PricingSection  from "@/app/components/landing/PricingSection";
import FinalCTA        from "@/app/components/landing/FinalCTA";
import Footer          from "@/app/components/landing/Footer";

export const metadata: Metadata = {
  title: "Intellixy — Chat with any PDF instantly",
  description:
    "Upload any PDF and get instant answers, summaries, and insights using AI. Free plan available — no credit card needed.",
};

export default function Page() {
  return (
    <div className="lp-page">
      <Nav />
      <main>
        <Hero />
        <Features />
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
        <Stats />
        <PricingSection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
