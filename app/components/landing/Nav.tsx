"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown, Sun, Moon } from "lucide-react";

// Raw string so dangerouslySetInnerHTML + suppressHydrationWarning can shield it
// from browser extensions (e.g. PDF viewers) that replace SVGs before hydration.
const NAV_BRAIN_HTML = `<svg width="26" height="22" viewBox="0 0 56 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="nav-ilx-g" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox"><stop offset="0%" stop-color="#F59E0B"/><stop offset="25%" stop-color="#F97316"/><stop offset="52%" stop-color="#EC4899"/><stop offset="78%" stop-color="#8B5CF6"/><stop offset="100%" stop-color="#3B82F6"/></linearGradient></defs><path d="M27 7 C22 7 15 8 11 13 C7 18 6 25 8 31 C10 37 15 41 20 43 C23 44 27 43 27 43" stroke="url(#nav-ilx-g)" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M27 7 C32 7 38 9 41 14 C44 20 43 28 40 33 C38 37 34 41 27 43" stroke="url(#nav-ilx-g)" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 43 C18 46 19 48 22 48 C25 48 28 46 27 43" stroke="url(#nav-ilx-g)" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 17 L27 11 L39 18" stroke="url(#nav-ilx-g)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 17 L23 27 L39 18" stroke="url(#nav-ilx-g)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 17 L17 32" stroke="url(#nav-ilx-g)" stroke-width="2.4" stroke-linecap="round"/><path d="M17 32 L23 27" stroke="url(#nav-ilx-g)" stroke-width="2.4" stroke-linecap="round"/><circle cx="27" cy="11" r="3.2" stroke="url(#nav-ilx-g)" stroke-width="2.2" fill="white"/><circle cx="15" cy="17" r="3.2" stroke="url(#nav-ilx-g)" stroke-width="2.2" fill="white"/><circle cx="39" cy="18" r="3.2" stroke="url(#nav-ilx-g)" stroke-width="2.2" fill="white"/><circle cx="23" cy="27" r="3.2" stroke="url(#nav-ilx-g)" stroke-width="2.2" fill="white"/><circle cx="17" cy="32" r="2.8" stroke="url(#nav-ilx-g)" stroke-width="2.2" fill="white"/></svg>`;

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
            <span
              className="lp-nav-mark"
              suppressHydrationWarning
              style={{ width: 26, height: 22, display: "inline-flex" }}
              dangerouslySetInnerHTML={{ __html: NAV_BRAIN_HTML }}
            />
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
