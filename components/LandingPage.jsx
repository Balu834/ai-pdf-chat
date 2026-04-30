"use client";

import { useEffect } from "react";
import { T } from "@/components/ui/tokens";
import { Events, initScrollDepthTracking } from "@/lib/analytics";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import Demo from "@/components/landing/Demo";
import UseCases from "@/components/landing/UseCases";
import ValueSection from "@/components/landing/ValueSection";
import Features from "@/components/landing/Features";
import Testimonials from "@/components/landing/Testimonials";
import Pricing from "@/components/landing/Pricing";
import StatsBar from "@/components/landing/StatsBar";
import FAQ from "@/components/landing/FAQ";
import FinalCTA from "@/components/landing/FinalCTA";
import AppInstall from "@/components/landing/AppInstall";
import Footer from "@/components/landing/Footer";
import ConversionBoosts from "@/components/ConversionBoosts";

export default function LandingPage() {
  useEffect(() => {
    Events.landingView();
    return initScrollDepthTracking();
  }, []);

  return (
    <div style={{
      background: T.bg,
      color: T.text,
      fontFamily: "var(--font-inter, Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
      overflowX: "hidden",
    }}>
      <Navbar />
      <Hero />
      <HowItWorks />
      <Demo />
      <UseCases />
      <ValueSection />
      <Features />
      <Testimonials />
      <Pricing />
      <StatsBar />
      <FAQ />
      <FinalCTA />
      <AppInstall />
      <Footer />
      <ConversionBoosts />
    </div>
  );
}
