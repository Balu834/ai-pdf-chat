"use client";

import { T } from "@/components/ui/tokens";
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
import Footer from "@/components/landing/Footer";
import ConversionBoosts from "@/components/ConversionBoosts";

export default function LandingPage() {
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
      <FinalCTA />
      <Footer />
      <ConversionBoosts />
    </div>
  );
}
