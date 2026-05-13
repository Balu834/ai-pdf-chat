"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function NavbarClient() {
  const [scrolled,    setScrolled]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // close mobile menu on resize to desktop
  useEffect(() => {
    if (!mobileOpen) return;
    const onResize = () => { if (window.innerWidth > 768) setMobileOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [mobileOpen]);

  return (
    <header className={`nb-header${scrolled ? " nb-scrolled" : ""}`}>
      <nav className="nb-nav">
        {/* Logo */}
        <Link href="/" className="nb-logo">
          <div className="nb-logo-mark">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="8" height="11" rx="1.5" fill="currentColor" opacity=".9"/>
              <rect x="13" y="3" width="8" height="5" rx="1.5" fill="currentColor" opacity=".5"/>
              <rect x="13" y="10" width="8" height="11" rx="1.5" fill="currentColor" opacity=".7"/>
              <rect x="3" y="16" width="8" height="5" rx="1.5" fill="currentColor" opacity=".4"/>
            </svg>
          </div>
          <span className="nb-logo-name">Intellixy</span>
        </Link>

        {/* Center links */}
        <div className="nb-links">
          <a href="#features"  className="nb-link">Features</a>
          <a href="#workflow"  className="nb-link">How it works</a>
          <a href="#pricing"   className="nb-link">Pricing</a>
          <a href="#faq"       className="nb-link">FAQ</a>
        </div>

        {/* Right actions */}
        <div className="nb-actions">
          <Link href="/login"     className="nb-signin">Sign in</Link>
          <Link href="/dashboard" className="nb-cta">Get Started <span className="nb-cta-arrow">→</span></Link>
        </div>

        {/* Hamburger */}
        <button
          className={`nb-hamburger${mobileOpen ? " nb-hamburger--open" : ""}`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
      </nav>

      {/* Mobile drawer */}
      <div className={`nb-mobile${mobileOpen ? " nb-mobile--open" : ""}`}>
        <a href="#features"  className="nb-mobile-link" onClick={() => setMobileOpen(false)}>Features</a>
        <a href="#workflow"  className="nb-mobile-link" onClick={() => setMobileOpen(false)}>How it works</a>
        <a href="#pricing"   className="nb-mobile-link" onClick={() => setMobileOpen(false)}>Pricing</a>
        <a href="#faq"       className="nb-mobile-link" onClick={() => setMobileOpen(false)}>FAQ</a>
        <Link href="/login"     className="nb-mobile-link" onClick={() => setMobileOpen(false)}>Sign in</Link>
        <Link href="/dashboard" className="nb-mobile-cta" onClick={() => setMobileOpen(false)}>Get Started →</Link>
      </div>
    </header>
  );
}
