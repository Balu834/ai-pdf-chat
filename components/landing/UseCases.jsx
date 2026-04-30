"use client";

import { motion } from "framer-motion";
import { T, FADE_UP, STAGGER, VP } from "@/components/ui/tokens";
import { Check, Pill, ArrowRight } from "@/components/ui/atoms";

const CASES = [
  {
    emoji: "🎓",
    role: "Students",
    headline: "Stop cramming. Start understanding.",
    color: "#a78bfa",
    border: "rgba(124,58,237,0.28)",
    bg: "rgba(124,58,237,0.07)",
    outcomes: [
      "Summarize 100-page textbooks in 30 seconds",
      "Get complex concepts explained in plain English",
      "Find exact answers before exams — without re-reading",
      "Turn lecture PDFs into quick study notes instantly",
    ],
    prompt: '"Explain Chapter 5 in simple terms"',
  },
  {
    emoji: "💼",
    role: "Professionals",
    headline: "Turn documents into decisions.",
    color: "#67e8f9",
    border: "rgba(6,182,212,0.28)",
    bg: "rgba(6,182,212,0.06)",
    outcomes: [
      "Extract key clauses from contracts in seconds",
      "Summarize financial reports without reading 50 pages",
      "Answer stakeholder questions on the spot",
      "Cut document review time by 80%",
    ],
    prompt: '"What are the payment terms in this contract?"',
  },
  {
    emoji: "🔬",
    role: "Researchers",
    headline: "Find insights, not pages.",
    color: "#86efac",
    border: "rgba(34,197,94,0.28)",
    bg: "rgba(34,197,94,0.06)",
    outcomes: [
      "Query research papers by topic in seconds",
      "Compare multiple studies side by side",
      "Extract data points and citations instantly",
      "Summarize entire literature reviews in minutes",
    ],
    prompt: '"What methodology did this study use?"',
  },
];

export default function UseCases() {
  return (
    <section className="px-5 sm:px-8 py-24 sm:py-32">
      <div className="max-w-[1100px] mx-auto">

        <motion.div initial="hidden" whileInView="show" viewport={VP} variants={FADE_UP}
          className="text-center mb-16">
          <Pill color={T.violet}>Who It&apos;s For</Pill>
          <h2 className="font-black tracking-tight mt-4 mb-3 text-[clamp(26px,5vw,50px)] leading-[1.1]">
            Built for how you actually work
          </h2>
          <p className="text-[16px]" style={{ color: T.muted }}>
            Students, professionals, researchers — everyone who reads PDFs and wants answers faster.
          </p>
        </motion.div>

        <motion.div initial="hidden" whileInView="show" viewport={VP} variants={STAGGER(0.12)}
          className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {CASES.map((c) => (
            <motion.div key={c.role} variants={FADE_UP}
              whileHover={{ y: -4, borderColor: c.border }}
              className="rounded-[24px] p-7 flex flex-col"
              style={{ background: c.bg, border: `1px solid ${c.border}`, transition: "all 0.25s" }}>
              <div className="text-4xl mb-4">{c.emoji}</div>
              <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: c.color }}>{c.role}</div>
              <h3 className="font-extrabold text-[18px] tracking-tight mb-4 leading-[1.3]">{c.headline}</h3>
              <ul className="flex flex-col gap-2.5 mb-6 flex-1 list-none p-0 m-0">
                {c.outcomes.map((o) => (
                  <li key={o} className="flex items-start gap-2.5 text-[13px]" style={{ color: "rgba(255,255,255,0.72)" }}>
                    <Check size={12} color={c.color} /> {o}
                  </li>
                ))}
              </ul>
              <div className="rounded-[12px] px-4 py-3 text-[12px] font-mono"
                style={{ background: "rgba(0,0,0,0.35)", border: `1px solid ${c.border}`, color: c.color }}>
                {c.prompt}
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div initial="hidden" whileInView="show" viewport={VP} variants={FADE_UP}
          className="text-center mt-10">
          <a href="/login"
            className="inline-flex items-center gap-2 font-extrabold text-white text-[14px] rounded-full"
            style={{ background: "linear-gradient(135deg,#7c3aed,#06b6d4)", padding: "13px 34px", textDecoration: "none", boxShadow: "0 6px 24px rgba(124,58,237,0.42)" }}>
            Try it free — 30 seconds to start <ArrowRight size={14} />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
