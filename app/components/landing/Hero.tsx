"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowRight, Shield, Zap, CreditCard } from "lucide-react";
import HeroDemo from "./HeroDemo";

const ease = [0.22, 1, 0.36, 1] as const;
const WORDS = ["notes", "contracts", "reports", "textbooks"];

/* Gold word that swaps every few seconds: "Ask your notes / contracts / …" */
function KineticWord() {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setI(n => (n + 1) % WORDS.length), 2400);
    return () => clearInterval(id);
  }, [reduce]);
  return (
    <span className="lp-kw lp-hero-h1-accent" aria-label={WORDS.join(", ")}>
      {/* invisible longest word reserves the width so the line never jumps */}
      <span aria-hidden style={{ visibility: "hidden" }}>contracts.</span>
      {/* mode="wait": the old word fully leaves before the next enters, so words can
          never pile up even when the browser throttles animation (background tabs) */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={WORDS[i]}
          aria-hidden
          initial={{ y: "45%", opacity: 0, filter: "blur(6px)" }}
          animate={{ y: "0%", opacity: 1, filter: "blur(0px)", transition: { duration: 0.42, ease } }}
          exit={{ y: "-45%", opacity: 0, filter: "blur(6px)", transition: { duration: 0.22, ease: "easeIn" } }}
        >
          {WORDS[i]}.
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } } };
const rise = { hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } } };

export default function Hero() {
  return (
    <section className="lp-hero">
      <div className="lp-hero-inner">

        {/* ── LEFT: Copy ─────────────────────────────────────────────── */}
        <motion.div className="lp-hero-copy" variants={stagger} initial="hidden" animate="show">
          <motion.div className="lp-hero-eyebrow" variants={rise}>
            <span className="lp-hero-eyebrow-live" aria-hidden />
            AI Document Intelligence
          </motion.div>

          <motion.h1 className="lp-hero-h1" variants={rise}>
            Ask your <KineticWord /><br />
            Get answers with the page.
          </motion.h1>

          <motion.p className="lp-hero-sub" variants={rise}>
            Upload any PDF and ask in plain English. Intellixy answers in seconds and shows the exact page and section each answer came from, so you can check it yourself.
          </motion.p>

          <motion.div className="lp-hero-actions" variants={rise}>
            <Link href="/login" className="lp-hero-cta-primary">
              Start for free <ArrowRight size={14} strokeWidth={2.5} />
            </Link>
            <a href="#demo" className="lp-hero-cta-ghost">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M10 8l6 4-6 4V8z" fill="currentColor"/>
              </svg>
              See live demo
            </a>
          </motion.div>

          <motion.div className="lp-hero-trust" variants={rise}>
            <div className="lp-hero-trust-item">
              <Zap size={18} strokeWidth={2} />
              Answers in seconds
            </div>
            <div className="lp-hero-trust-sep" />
            <div className="lp-hero-trust-item">
              <Shield size={18} strokeWidth={2} />
              Encrypted in transit
            </div>
            <div className="lp-hero-trust-sep" />
            <div className="lp-hero-trust-item">
              <CreditCard size={18} strokeWidth={2} />
              No credit card required
            </div>
          </motion.div>
        </motion.div>

        {/* ── RIGHT: live product demo ───────────────────────────────── */}
        <div className="lp-hero-preview">
          <HeroDemo />
        </div>

      </div>
    </section>
  );
}
