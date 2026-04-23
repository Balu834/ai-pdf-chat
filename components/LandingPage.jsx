"use client";

import { useEffect } from "react";
import { T } from "@/components/ui/tokens";
import { Events, initScrollDepthTracking } from "@/lib/analytics";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import StatsBar from "@/components/landing/StatsBar";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import Testimonials from "@/components/landing/Testimonials";
import Pricing from "@/components/landing/Pricing";
import Demo from "@/components/landing/Demo";
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
      <StatsBar />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <Demo />
      <FAQ />
      <AppInstall />
      <FinalCTA />
      <Footer />
      <ConversionBoosts />
    </div>
  );
}
