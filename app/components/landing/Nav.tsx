"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const LINKS = [
  { label: "Features",     href: "#features"  },
  { label: "How it works", href: "#workflow"  },
  { label: "Pricing",      href: "#pricing"   },
  { label: "FAQ",          href: "#faq"       },
];

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="lp-nav">
      <div className="lp-nav-inner">

        {/* Logo */}
        <Link href="/" className="lp-nav-brand">
          <div className="lp-nav-mark">I</div>
          <span className="lp-nav-name">Intellixy</span>
        </Link>

        {/* Center links */}
        <nav className="lp-nav-links" aria-label="Site navigation">
          {LINKS.map(l => (
            <a key={l.href} href={l.href} className="lp-nav-link">
              {l.label}
            </a>
          ))}
        </nav>

        {/* Right actions */}
        <div className="lp-nav-actions">
          <Link href="/login" className="lp-btn-ghost">Sign in</Link>
          <Link href="/login" className="lp-btn-black">Get started →</Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="lp-nav-burger"
          onClick={() => setOpen(o => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X size={20} strokeWidth={2} /> : <Menu size={20} strokeWidth={2} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lp-nav-mobile" role="dialog" aria-label="Mobile navigation">
          {LINKS.map(l => (
            <a
              key={l.href}
              href={l.href}
              className="lp-nav-mobile-link"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </a>
          ))}
          <div className="lp-nav-mobile-foot">
            <Link href="/login" className="lp-btn-ghost">Sign in</Link>
            <Link href="/login" className="lp-btn-black">Get started →</Link>
          </div>
        </div>
      )}
    </header>
  );
}
