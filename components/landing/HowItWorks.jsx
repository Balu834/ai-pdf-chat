"use client";

import { motion } from "framer-motion";
import { T, FADE_UP, STAGGER, VP } from "@/components/ui/tokens";
import { Pill, ArrowRight } from "@/components/ui/atoms";

const STEPS = [
  {
    n: "01", icon: "📤",
    color: "#a78bfa", glow: "rgba(167,139,250,0.18)", iconBg: "rgba(167,139,250,0.14)",
    title: "Upload your PDF",
    desc:  "Drop any PDF — textbooks, contracts, research papers, reports. Any size, any topic. Done in seconds.",
  },
  {
    n: "02", icon: "💬",
    color: "#67e8f9", glow: "rgba(103,232,249,0.16)", iconBg: "rgba(103,232,249,0.12)",
    title: "Ask any question",
    desc:  "Type anything in plain English — 'summarize this', 'what are the key points?', 'explain simply'. No commands.",
  },
  {
    n: "03", icon: "⚡",
    color: "#86efac", glow: "rgba(134,239,172,0.16)", iconBg: "rgba(134,239,172,0.1)",
    title: "Get instant answers",
    desc:  "Precise, cited answers in under 2 seconds — pulled directly from your PDF. No guessing, no hallucinations.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="px-5 sm:px-8 py-24 sm:py-32"
      style={{ background: "rgba(255,255,255,0.014)" }}
    >
      <div className="max-w-[1000px] mx-auto">

        {/* Header */}
        <motion.div
          initial="hidden" whileInView="show" viewport={VP} variants={FADE_UP}
          className="text-center mb-16"
        >
          <Pill>How it works</Pill>
          <h2 className="font-black tracking-tight mt-4 mb-3 text-[clamp(26px,5vw,50px)] leading-[1.1]">
            How it works — 3 simple steps
          </h2>
          <p className="text-[16px]" style={{ color: T.muted }}>
            No learning curve. No setup. Upload → Ask → Done.
          </p>
        </motion.div>

        {/* Step cards */}
        <motion.div
          initial="hidden" whileInView="show" viewport={VP} variants={STAGGER(0.14)}
          className="grid grid-cols-1 sm:grid-cols-3 gap-5"
        >
          {STEPS.map((s) => (
            <motion.div
              key={s.n}
              variants={FADE_UP}
              whileHover={{
                y:          -6,
                borderColor: s.color + "55",
                boxShadow:   `0 16px 48px ${s.glow}, 0 0 0 1px ${s.color}30`,
                transition:  { duration: 0.22 },
              }}
              className="relative text-center rounded-[22px] overflow-hidden"
              style={{
                background:  T.surface,
                border:      `1px solid ${T.border}`,
                padding:     "36px 28px 32px",
                transition:  "border-color 0.25s, box-shadow 0.25s, transform 0.25s",
              }}
            >
              {/* Top accent line — fades in from center, matches step color */}
              <div style={{
                position:   "absolute",
                top:        0,
                left:       "10%",
                right:      "10%",
                height:     2,
                borderRadius: 2,
                background: `linear-gradient(90deg, transparent, ${s.color}, transparent)`,
                opacity:    0.7,
              }} />

              {/* Step icon */}
              <div
                className="relative inline-flex items-center justify-center rounded-2xl mb-5"
                style={{
                  width:      66,
                  height:     66,
                  background: `linear-gradient(135deg, ${s.iconBg}, rgba(6,182,212,0.06))`,
                  border:     `1px solid ${s.color}30`,
                  boxShadow:  `0 8px 24px ${s.glow}`,
                }}
              >
                <span style={{ fontSize: 28 }}>{s.icon}</span>

                {/* Step number badge */}
                <div
                  className="absolute flex items-center justify-center rounded-full text-white font-extrabold"
                  style={{
                    top:        -10,
                    right:      -10,
                    width:      24,
                    height:     24,
                    background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
                    fontSize:   10,
                    boxShadow:  "0 4px 12px rgba(124,58,237,0.45)",
                  }}
                >
                  {s.n}
                </div>
              </div>

              {/* Text */}
              <h3
                className="font-extrabold text-[16px] tracking-tight mb-2"
                style={{ color: s.color }}
              >
                {s.title}
              </h3>
              <p className="text-[13px] leading-[1.72]" style={{ color: T.muted }}>
                {s.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial="hidden" whileInView="show" viewport={VP} variants={FADE_UP}
          className="text-center mt-12"
        >
          <motion.a
            href="/login"
            whileHover={{ opacity: 0.88, y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 font-extrabold text-white text-[14px] rounded-full"
            style={{
              background:     "linear-gradient(135deg,#7c3aed,#06b6d4)",
              padding:        "13px 34px",
              textDecoration: "none",
              boxShadow:      "0 6px 28px rgba(124,58,237,0.44)",
            }}
          >
            Try it free — Start in 30 seconds <ArrowRight />
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
