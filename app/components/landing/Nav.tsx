"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown, Sun, Moon } from "lucide-react";
import { IntellixyBrainIcon } from "@/app/components/IntellixyBrainIcon";

const LINKS = [
  { label: "Features",  href: "#features", dropdown: true  },
  { label: "Demo",      href: "#demo",     dropdown: false },
  { label: "Pricing",   href: "#pricing",  dropdown: false },
  { label: "Resources", href: "#",         dropdown: true  },
  { label: "Company",   href: "#",         dropdown: true  },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("lp-theme");
    if (saved === "dark") {
      setDark(true);
      document.querySelector(".lp-page")?.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.querySelector(".lp-page")?.classList.toggle("dark", next);
    localStorage.setItem("lp-theme", next ? "dark" : "light");
  };

  return (
    <>
      <nav className="lp-nav" role="navigation">
        <div className="lp-nav-inner">
          <Link href="/" className="lp-nav-brand">
            <span className="lp-nav-mark" aria-hidden>
              <IntellixyBrainIcon size={26} />
            </span>
            Intellixy
          </Link>

          <ul className="lp-nav-links" role="list">
            {LINKS.map(l => (
              <li key={l.label}>
                <a href={l.href} className="lp-nav-link">
                  {l.label}
                  {l.dropdown && (
                    <ChevronDown size={12} strokeWidth={2.5} className="lp-nav-chevron" />
                  )}
                </a>
              </li>
            ))}
          </ul>

          <div className="lp-nav-actions">
            <button className="lp-nav-icon-btn" aria-label="Toggle theme" onClick={toggleTheme}>
              {dark ? <Sun size={15} strokeWidth={1.75} /> : <Moon size={15} strokeWidth={1.75} />}
            </button>
            <Link href="/login" className="lp-btn-ghost">Sign in</Link>
            <Link href="/login" className="lp-btn-green">Start free →</Link>
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
            <a key={l.label} href={l.href} className="lp-mobile-link" onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
          <div className="lp-mobile-foot">
            <Link href="/login" className="lp-btn-ghost" style={{ textAlign: "center" }}>Sign in</Link>
            <Link href="/login" className="lp-btn-green lp-btn-lg" style={{ justifyContent: "center" }}>
              Start free
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
