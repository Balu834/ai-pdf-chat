"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { T } from "@/components/ui/tokens";
import { PdfIcon } from "@/components/ui/atoms";
import { usePWAInstall } from "@/hooks/usePWAInstall";

const NAV_LINKS = [
  ["#features",     "Features"],
  ["#how-it-works", "How it works"],
  ["#pricing",      "Pricing"],
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { isInstallable, installApp } = usePWAInstall();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background:          scrolled ? "rgba(7,7,14,0.88)"  : "transparent",
        backdropFilter:      scrolled ? "blur(32px) saturate(180%)" : "none",
        WebkitBackdropFilter:scrolled ? "blur(32px) saturate(180%)" : "none",
        // box-shadow gives a glowing bottom edge — gradient borders can't be done
        // with border-image on elements that also have border-radius, so we fake it
        // with a layered box-shadow: inner glow line + outer depth shadow
        boxShadow: scrolled
          ? "0 1px 0 0 rgba(124,58,237,0.22), 0 4px 0 0 rgba(6,182,212,0.06), 0 12px 48px rgba(0,0,0,0.55)"
          : "none",
        transition: "all 0.35s ease",
      }}
    >
      <div
        className="flex items-center justify-between mx-auto px-5 md:px-8"
        style={{ maxWidth: 1160, height: 62 }}
      >
        {/* ── Logo ── */}
        <motion.a
          href="/"
          className="flex items-center gap-2.5 no-underline"
          whileHover={{ opacity: 0.9 }}
        >
          <motion.div
            whileHover={{ boxShadow: "0 0 22px rgba(124,58,237,0.65)" }}
            className="flex items-center justify-center rounded-xl flex-shrink-0"
            style={{
              width: 34, height: 34,
              background:  "linear-gradient(135deg,#7c3aed,#06b6d4)",
              boxShadow:   "0 4px 14px rgba(124,58,237,0.38)",
              transition:  "box-shadow 0.25s",
            }}
          >
            <PdfIcon size={15} />
          </motion.div>
          <span
            className="font-extrabold text-[15px] tracking-tight"
            style={{ color: T.text }}
          >
            Intellixy
          </span>
        </motion.a>

        {/* ── Nav links (desktop) ── */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(([href, lbl]) => (
            <motion.a
              key={lbl}
              href={href}
              className="relative text-[13px] font-medium px-3 py-2 rounded-lg"
              style={{ color: T.muted, textDecoration: "none" }}
              whileHover={{
                color:      "#f2f2f7",
                background: "rgba(255,255,255,0.055)",
                transition: { duration: 0.18 },
              }}
            >
              {lbl}
            </motion.a>
          ))}
        </div>

        {/* ── Right controls ── */}
        <div className="flex items-center gap-2">
          {isInstallable && (
            <motion.button
              onClick={installApp}
              whileHover={{ opacity: 0.88 }}
              whileTap={{ scale: 0.97 }}
              className="hidden sm:flex items-center gap-1.5 text-[12px] font-bold px-3 py-[8px] rounded-full"
              style={{
                background: "rgba(124,58,237,0.15)",
                border:     "1px solid rgba(124,58,237,0.35)",
                color:      "#a78bfa",
                cursor:     "pointer",
              }}
            >
              <span style={{ fontSize: 13 }}>⬇</span> Install App
            </motion.button>
          )}

          <a
            href="/login"
            className="hidden sm:block text-[13px] font-semibold px-3 py-2 rounded-lg"
            style={{ color: T.muted, textDecoration: "none" }}
          >
            Log in
          </a>

          {/* CTA with pulsing glow ring behind it */}
          <div className="relative">
            {/* Pulse ring — scale+fade loop */}
            <motion.span
              animate={{ scale: [1, 1.65, 1], opacity: [0.45, 0, 0.45] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ background: "linear-gradient(135deg,#7c3aed,#06b6d4)" }}
            />
            <motion.a
              href="/login"
              whileHover={{
                y:         -1,
                boxShadow: "0 14px 44px rgba(124,58,237,0.58)",
                transition: { duration: 0.2 },
              }}
              whileTap={{ scale: 0.96 }}
              className="relative text-[13px] font-bold text-white px-4 py-[9px] rounded-full"
              style={{
                background:     "linear-gradient(135deg,#7c3aed,#06b6d4)",
                textDecoration: "none",
                boxShadow:      "0 4px 18px rgba(124,58,237,0.32)",
                letterSpacing:  "-0.1px",
              }}
            >
              Start Free →
            </motion.a>
          </div>
        </div>
      </div>
    </nav>
  );
}
