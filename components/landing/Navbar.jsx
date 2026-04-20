"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { T } from "@/components/ui/tokens";
import { PdfIcon } from "@/components/ui/atoms";
import { usePWAInstall } from "@/hooks/usePWAInstall";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { isInstallable, installApp } = usePWAInstall();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <nav className="fixed top-0 left-0 right-0 z-50"
      style={{
        borderBottom: `1px solid ${scrolled ? T.border : "transparent"}`,
        background: scrolled ? "rgba(7,7,14,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(28px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(28px)" : "none",
        transition: "all 0.3s ease",
      }}>
      <div className="flex items-center justify-between mx-auto px-5 md:px-8" style={{ maxWidth:1160, height:60 }}>

        <a href="/" className="flex items-center gap-2 no-underline">
          <div className="flex items-center justify-center rounded-xl flex-shrink-0"
            style={{ width:32, height:32, background:"linear-gradient(135deg,#7c3aed,#06b6d4)", boxShadow:"0 4px 14px rgba(124,58,237,0.38)" }}>
            <PdfIcon size={14} />
          </div>
          <span className="font-extrabold text-[15px] tracking-tight" style={{ color:T.text }}>Intellixy</span>
        </a>

        <div className="hidden md:flex items-center gap-1">
          {[["#features","Features"],["#how-it-works","How it works"],["#pricing","Pricing"]].map(([href,lbl]) => (
            <a key={lbl} href={href} className="text-[13px] font-medium px-3 py-2 rounded-lg transition-colors"
              style={{ color:T.muted, textDecoration:"none" }}>{lbl}</a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {isInstallable && (
            <motion.button
              onClick={installApp}
              whileHover={{ opacity: 0.88 }}
              whileTap={{ scale: 0.97 }}
              className="hidden sm:flex items-center gap-1.5 text-[12px] font-bold px-3 py-[8px] rounded-full"
              style={{ background:"rgba(124,58,237,0.15)", border:"1px solid rgba(124,58,237,0.35)", color:"#a78bfa", cursor:"pointer" }}
            >
              <span style={{ fontSize:13 }}>⬇</span> Install App
            </motion.button>
          )}
          <a href="/login" className="hidden sm:block text-[13px] font-semibold px-3 py-2 rounded-lg" style={{ color:T.muted, textDecoration:"none" }}>Log in</a>
          <motion.a href="/login"
            whileHover={{ opacity:0.88, y:-1, boxShadow:"0 12px 36px rgba(124,58,237,0.45)" }}
            whileTap={{ scale:0.97 }}
            className="text-[13px] font-bold text-white px-4 py-[9px] rounded-full"
            style={{ background:"linear-gradient(135deg,#7c3aed,#06b6d4)", textDecoration:"none", boxShadow:"0 4px 18px rgba(124,58,237,0.32)", letterSpacing:"-0.1px" }}>
            Start Free →
          </motion.a>
        </div>
      </div>
    </nav>
  );
}
