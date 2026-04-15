"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { T, FADE_UP, STAGGER, VP, spring } from "@/components/ui/tokens";
import { Pill, ChevronDown } from "@/components/ui/atoms";

const ITEMS = [
  { q:"What types of PDFs does Intellixy support?",    a:"Any PDF — contracts, invoices, research papers, medical reports, financial statements, study notes. If it has text, Intellixy can read and answer questions about it." },
  { q:"Is there really a free plan?",                  a:"Yes. The free plan gives you 5 PDF uploads and 10 questions — no credit card required. Most users hit the limit in their first session and upgrade the same day." },
  { q:"How is my data kept private?",                  a:"Files are processed in an isolated environment for your session only. We never store your files after processing, never share them, and never train AI models on your content." },
  { q:"Can I cancel my Pro subscription anytime?",    a:"Yes. Cancel with one click from your dashboard. You keep Pro access until the end of your billing period — no pro-rated charges, no cancellation fees." },
  { q:"What happens after the 7-day free trial?",     a:"After your trial ends, you're automatically downgraded to the free plan. No charges unless you choose to upgrade. You keep all your chat history." },
];

export default function FAQ() {
  const [open, setOpen] = useState(null);
  return (
    <section className="px-5 sm:px-8 py-24 sm:py-32"
      style={{ background:"rgba(255,255,255,0.014)" }}>
      <div className="max-w-[660px] mx-auto">
        <motion.div initial="hidden" whileInView="show" viewport={VP} variants={FADE_UP}
          className="text-center mb-14">
          <Pill color={T.cyan}>FAQ</Pill>
          <h2 className="font-black tracking-tight mt-4 text-[clamp(24px,4.5vw,44px)] leading-[1.1]">
            Common questions
          </h2>
        </motion.div>
        <motion.div initial="hidden" whileInView="show" viewport={VP} variants={STAGGER(0.07)}
          className="flex flex-col gap-2.5">
          {ITEMS.map((item,i) => (
            <motion.div key={i} variants={FADE_UP}
              className="rounded-2xl overflow-hidden"
              style={{ background:T.surface, border:`1px solid ${open===i ? T.borderHi : T.border}`, transition:"border-color 0.2s" }}>
              <button onClick={() => setOpen(open===i ? null : i)}
                className="w-full flex items-center justify-between gap-3 text-left font-semibold text-[14px]"
                style={{ padding:"18px 22px", background:"none", border:"none", cursor:"pointer", color:T.text }}>
                {item.q}
                <ChevronDown open={open===i} />
              </button>
              <AnimatePresence initial={false}>
                {open===i && (
                  <motion.div key="body"
                    initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }} exit={{ height:0, opacity:0 }}
                    transition={{ duration:0.3, ease:spring }} style={{ overflow:"hidden" }}>
                    <p className="text-[13px] leading-[1.78] m-0" style={{ padding:"0 22px 20px", color:T.muted }}>{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
