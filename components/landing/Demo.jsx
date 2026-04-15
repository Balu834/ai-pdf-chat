"use client";

import { motion } from "framer-motion";
import { T, FADE_UP, SCALE_IN, VP } from "@/components/ui/tokens";
import { Pill, ArrowRight } from "@/components/ui/atoms";

const DEMO_VIDEO_ID = "9_hnyQxFUjI";

export default function Demo() {
  return (
    <section id="demo" className="px-5 sm:px-8 py-24 sm:py-32">
      <div className="max-w-[760px] mx-auto">
        <motion.div initial="hidden" whileInView="show" viewport={VP} variants={FADE_UP} className="text-center mb-12">
          <Pill color={T.amber}>Live Demo</Pill>
          <h2 className="font-black tracking-tight mt-4 mb-3 text-[clamp(24px,5vw,48px)] leading-[1.1]">
            See it in 60 seconds
          </h2>
          <p className="text-[15px]" style={{ color:T.muted }}>A real PDF. A real question. An answer in under 2 seconds ⚡</p>
        </motion.div>
        <motion.div initial="hidden" whileInView="show" viewport={VP} variants={SCALE_IN}>
          <div className="rounded-[22px] overflow-hidden" style={{ border:`1px solid ${T.border}`, boxShadow:"0 32px 90px rgba(0,0,0,0.6)" }}>
            <iframe
              width="100%" height="420"
              src={`https://www.youtube.com/embed/${DEMO_VIDEO_ID}?rel=0&modestbranding=1`}
              title="Intellixy Demo" frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen style={{ display:"block" }} />
          </div>
        </motion.div>
        <motion.div initial="hidden" whileInView="show" viewport={VP} variants={FADE_UP}
          className="mt-8 rounded-[22px] p-8 text-center"
          style={{ background:"linear-gradient(135deg,rgba(124,58,237,0.1),rgba(6,182,212,0.04))", border:"1px solid rgba(124,58,237,0.22)" }}>
          <h3 className="font-black text-[22px] tracking-tight mb-2">Your PDFs are next.</h3>
          <p className="text-[14px] mb-5" style={{ color:T.muted }}>Same experience, on your own files, right now.</p>
          <motion.a href="/login" whileHover={{ opacity:0.9, y:-2 }} whileTap={{ scale:0.97 }}
            className="inline-flex items-center gap-2 font-extrabold text-white text-[14px] rounded-full"
            style={{ background:"linear-gradient(135deg,#7c3aed,#06b6d4)", padding:"13px 30px", textDecoration:"none", boxShadow:"0 8px 28px rgba(124,58,237,0.45)" }}>
            Start Free — 7-Day Pro Trial <ArrowRight />
          </motion.a>
          <p className="text-[12px] mt-3" style={{ color:T.faint }}>No credit card · Instant access · Cancel anytime</p>
        </motion.div>
      </div>
    </section>
  );
}
