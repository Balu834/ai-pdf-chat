"use client";
import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const LINKS = [
  { label: "Features",     href: "#features"    },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing",      href: "#pricing"      },
  { label: "FAQ",          href: "#faq"          },
];

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <Link href="/" className="lp-nav-brand">
            <span className="lp-nav-mark">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                <rect x="3"  y="3"  width="8" height="11" rx="1.5" fill="currentColor" opacity=".9"/>
                <rect x="13" y="3"  width="8" height="5"  rx="1.5" fill="currentColor" opacity=".5"/>
                <rect x="13" y="10" width="8" height="11" rx="1.5" fill="currentColor" opacity=".7"/>
                <rect x="3"  y="16" width="8" height="5"  rx="1.5" fill="currentColor" opacity=".4"/>
              </svg>
            </span>
            Intellixy
          </Link>

          <ul className="lp-nav-links" role="list">
            {LINKS.map(l => (
              <li key={l.href}>
                <a href={l.href}>{l.label}</a>
              </li>
            ))}
          </ul>

          <div className="lp-nav-actions">
            <Link href="/login" className="lp-btn-ghost">Sign in</Link>
            <Link href="/login" className="lp-btn-green">Get started →</Link>
          </div>

          <button
            className="lp-nav-burger"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen(o => !o)}
          >
            {open ? <X size={20} strokeWidth={2} /> : <Menu size={20} strokeWidth={2} />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="lp-mobile-nav open" role="dialog" aria-label="Mobile navigation">
          <button className="lp-mobile-close" aria-label="Close menu" onClick={() => setOpen(false)}>
            <X size={22} />
          </button>
          {LINKS.map(l => (
            <a key={l.href} href={l.href} className="lp-mobile-link" onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
          <div className="lp-mobile-foot">
            <Link href="/login" className="lp-btn-ghost" style={{ textAlign: "center" }}>Sign in</Link>
            <Link href="/login" className="lp-btn-green lp-btn-lg" style={{ justifyContent: "center" }}>
              Get started free
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
