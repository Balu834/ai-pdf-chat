"use client";

import { motion } from "framer-motion";
import { T, FADE_UP, STAGGER, VP } from "@/components/ui/tokens";
import { Counter } from "@/components/ui/atoms";

export default function StatsBar() {
  const stats = [
    { to:1000, suffix:"+", label:"Happy users",         color:"#a78bfa" },
    { to:5000, suffix:"+", label:"PDFs analyzed",       color:"#06b6d4" },
    { to:50000,suffix:"+", label:"Questions answered",  color:"#4ade80" },
    { to:2,    prefix:"<", suffix:"s", label:"Avg response time", color:T.amber },
  ];
  return (
    <motion.section initial="hidden" whileInView="show" viewport={VP} variants={STAGGER(0.12)}
      className="px-5 py-10"
      style={{ borderTop:`1px solid ${T.border}`, borderBottom:`1px solid ${T.border}`, background:"rgba(255,255,255,0.018)" }}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center max-w-3xl mx-auto">
        {stats.map(s => (
          <motion.div key={s.label} variants={FADE_UP}>
            <div className="font-black mb-1 tabular-nums"
              style={{ fontSize:"clamp(26px,4vw,40px)", letterSpacing:"-1px", color:s.color }}>
              <Counter to={s.to} suffix={s.suffix} prefix={s.prefix} />
            </div>
            <div className="text-[12px] font-medium" style={{ color:T.faint }}>{s.label}</div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
