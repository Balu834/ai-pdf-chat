"use client";

import { motion } from "framer-motion";
import { T, FADE_UP, SCALE_IN, STAGGER, VP } from "@/components/ui/tokens";
import { ArrowRight } from "@/components/ui/atoms";

const STEPS = [
  { step: "01", label: "Upload", sub: "Drop any PDF. Any size." },
  { step: "02", label: "Ask",    sub: "Type any question naturally." },
  { step: "03", label: "Answer", sub: "Instant. Cited. Accurate." },
];

const PROMPTS = [
  {
    icon: "📋",
    text: "Summarize this PDF",
    result: "Gets you the key points in a tight summary. No page-by-page reading required.",
    color: "#a78bfa",
  },
  {
    icon: "💡",
    text: "What are the key insights?",
    result: "Surfaces the 3 most important takeaways from any document — instantly.",
    color: "#67e8f9",
  },
  {
    icon: "🧠",
    text: "Explain this simply",
    result: "Breaks down dense jargon into plain, clear English you can actually use.",
    color: "#86efac",
  },
];

export default function ValueSection() {
  return (
    <section className="px-5 sm:px-8 py-24 sm:py-32"
      style={{ background: "rgba(255,255,255,0.014)" }}>
      <div className="max-w-[860px] mx-auto text-center">

        <motion.div initial="hidden" whileInView="show" viewport={VP} variants={FADE_UP}>
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8 text-[11px] font-bold uppercase tracking-widest"
            style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.28)", color: "#c4b5fd" }}>
            ✦ A faster way to read
          </div>
          <h2 className="font-black tracking-tight mb-5 text-[clamp(32px,6vw,64px)] leading-[1.05]">
            Stop reading.<br />
            <span style={{
              background: "linear-gradient(135deg,#e0c3fc 0%,#7c3aed 40%,#06b6d4 80%,#a5f3fc 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>
              Start asking.
            </span>
          </h2>
          <p className="text-[18px] leading-[1.72] mx-auto mb-14" style={{ color: T.muted, maxWidth: 520 }}>
            You don&apos;t have to read the whole PDF anymore. Just ask the question you need answered. Get the answer. Move on.
          </p>
        </motion.div>

        {/* Upload → Ask → Answer flow */}
        <motion.div initial="hidden" whileInView="show" viewport={VP} variants={STAGGER(0.12)}
          className="flex items-center justify-center gap-3 mb-16 flex-wrap">
          {STEPS.map((s, i) => (
            <div key={s.step} className="flex items-center gap-3">
              <motion.div variants={SCALE_IN}
                className="rounded-2xl px-6 py-4 text-center"
                style={{ background: T.surface, border: `1px solid ${T.borderHi}`, minWidth: 130 }}>
                <div className="text-[10px] font-extrabold uppercase tracking-widest mb-1" style={{ color: T.faint }}>{s.step}</div>
                <div className="font-extrabold text-[15px] text-white">{s.label}</div>
                <div className="text-[11px] mt-1" style={{ color: T.muted }}>{s.sub}</div>
              </motion.div>
              {i < STEPS.length - 1 && (
                <motion.div variants={FADE_UP}
                  className="text-[22px] font-light hidden sm:block"
                  style={{ color: T.faint }}>→</motion.div>
              )}
            </div>
          ))}
        </motion.div>

        {/* Example prompts */}
        <motion.div initial="hidden" whileInView="show" viewport={VP} variants={STAGGER(0.1)}
          className="flex flex-col gap-3 mb-12 text-left">
          {PROMPTS.map((p) => (
            <motion.div key={p.text} variants={FADE_UP}
              className="flex items-start gap-4 rounded-2xl px-5 py-4"
              style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.18)" }}>
              <span className="text-2xl flex-shrink-0 mt-0.5">{p.icon}</span>
              <div>
                <div className="font-bold text-[14px] mb-1" style={{ color: p.color }}>&ldquo;{p.text}&rdquo;</div>
                <div className="text-[13px] leading-[1.65]" style={{ color: T.muted }}>{p.result}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div initial="hidden" whileInView="show" viewport={VP} variants={FADE_UP}>
          <a href="/login"
            className="inline-flex items-center gap-2 font-extrabold text-white text-[15px] rounded-full"
            style={{ background: "linear-gradient(135deg,#7c3aed,#06b6d4)", padding: "15px 38px", textDecoration: "none", boxShadow: "0 8px 32px rgba(124,58,237,0.48)" }}>
            Try it free — no credit card <ArrowRight size={15} />
          </a>
          <p className="text-[12px] mt-4" style={{ color: T.faint }}>
            Upload your first PDF. Get your first answer. It&apos;s free.
          </p>
        </motion.div>

      </div>
    </section>
  );
}
