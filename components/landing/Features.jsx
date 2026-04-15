"use client";

import { motion } from "framer-motion";
import { T, FADE_UP, STAGGER, VP } from "@/components/ui/tokens";
import { Check, Pill } from "@/components/ui/atoms";

export default function Features() {
  const card = (extra = {}) => ({
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: 22,
    padding: 28,
    overflow: "hidden",
    transition: "border-color 0.25s, background 0.25s",
    ...extra,
  });

  return (
    <section id="features" className="px-5 sm:px-8 py-24 sm:py-32">
      <div className="max-w-[1100px] mx-auto">

        <motion.div initial="hidden" whileInView="show" viewport={VP} variants={FADE_UP}
          className="text-center mb-16">
          <Pill color={T.cyan}>Features</Pill>
          <h2 className="font-black tracking-tight mt-4 mb-4 text-[clamp(28px,5vw,54px)] leading-[1.08]">
            Everything you need to stop<br className="hidden sm:block" /> drowning in documents
          </h2>
          <p className="text-[17px] leading-[1.7] mx-auto" style={{ color:T.muted, maxWidth:460 }}>
            Works on any PDF — legal, financial, academic, or medical.
          </p>
        </motion.div>

        <motion.div initial="hidden" whileInView="show" viewport={VP} variants={STAGGER(0.08)}
          className="grid gap-4"
          style={{ gridTemplateColumns:"repeat(3,1fr)", gridTemplateRows:"auto" }}>

          {/* Row 1 — card A (span 2) + card B */}
          <motion.div variants={FADE_UP} whileHover={{ borderColor:T.borderHi, background:T.surfaceHi }}
            style={{ ...card(), gridColumn:"span 2", background:"linear-gradient(135deg,rgba(124,58,237,0.1),rgba(6,182,212,0.04))", borderColor:"rgba(124,58,237,0.2)" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl">💬</div>
              <div>
                <h3 className="font-extrabold text-[18px] tracking-tight mb-1" style={{ color:"#c4b5fd" }}>Ask Anything</h3>
                <p className="text-[13px] leading-[1.65]" style={{ color:T.muted }}>Type any question in plain English. Answers in under 2 seconds, cited from the source.</p>
              </div>
            </div>
            <div className="rounded-2xl p-4" style={{ background:"rgba(0,0,0,0.35)", border:`1px solid rgba(124,58,237,0.18)` }}>
              <div className="flex justify-end mb-2.5">
                <span className="text-[12px] px-3 py-2 rounded-[14px_14px_3px_14px] text-white" style={{ background:"linear-gradient(135deg,#7c3aed,#5b21b6)", maxWidth:"80%" }}>
                  What is the cancellation clause in this contract?
                </span>
              </div>
              <div className="flex gap-2">
                <div className="flex-shrink-0 rounded-lg flex items-center justify-center" style={{ width:22, height:22, background:"linear-gradient(135deg,#7c3aed,#06b6d4)" }}>
                  <svg width="10" height="10" fill="white" viewBox="0 0 24 24"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>
                </div>
                <div className="text-[12px] px-3 py-2 rounded-[3px_14px_14px_14px]" style={{ background:"rgba(255,255,255,0.07)", border:`1px solid ${T.border}`, color:"rgba(255,255,255,0.85)", lineHeight:1.6 }}>
                  Either party may cancel with <strong style={{ color:"#4ade80" }}>30 days written notice</strong>. Auto-renewal applies unless cancelled <strong style={{ color:"#4ade80" }}>15 days before</strong> the renewal date. (§12.3)
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={FADE_UP} whileHover={{ borderColor:T.borderHi, background:T.surfaceHi }}
            style={{ ...card(), background:"linear-gradient(135deg,rgba(6,182,212,0.08),transparent)", borderColor:"rgba(6,182,212,0.18)" }}>
            <div className="text-3xl mb-4">✨</div>
            <h3 className="font-extrabold text-[17px] tracking-tight mb-2" style={{ color:"#67e8f9" }}>Instant Summaries</h3>
            <p className="text-[13px] leading-[1.68]" style={{ color:T.muted }}>
              One-click summary of any document. Get the key points without reading a single page.
            </p>
            <div className="flex flex-col gap-2 mt-5">
              {["Executive summary","Key clauses identified (7)","Risk flags (2)"].map((item) => (
                <div key={item} className="flex items-center gap-2 text-[12px]" style={{ color:"rgba(255,255,255,0.6)" }}>
                  <Check size={12} color="#06b6d4" /> {item}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Row 2 — card C, D, E */}
          <motion.div variants={FADE_UP} whileHover={{ borderColor:T.borderHi, background:T.surfaceHi }}
            style={card()}>
            <div className="text-3xl mb-4">🔍</div>
            <h3 className="font-extrabold text-[17px] tracking-tight mb-2" style={{ color:"#86efac" }}>Smart Extraction</h3>
            <p className="text-[13px] leading-[1.68]" style={{ color:T.muted }}>
              Auto-extract invoices, dates, names, totals, and terms from any format.
            </p>
          </motion.div>

          <motion.div variants={FADE_UP} whileHover={{ borderColor:T.borderHi, background:T.surfaceHi }}
            style={card()}>
            <div className="text-3xl mb-4">📊</div>
            <h3 className="font-extrabold text-[17px] tracking-tight mb-2" style={{ color:"#fcd34d" }}>PDF Compare</h3>
            <p className="text-[13px] leading-[1.68]" style={{ color:T.muted }}>
              Upload two documents and ask what changed. Perfect for contract revisions.
            </p>
          </motion.div>

          <motion.div variants={FADE_UP} whileHover={{ borderColor:T.borderHi, background:T.surfaceHi }}
            style={card()}>
            <div className="text-3xl mb-4">🔗</div>
            <h3 className="font-extrabold text-[17px] tracking-tight mb-2" style={{ color:"#f9a8d4" }}>Share Insights</h3>
            <p className="text-[13px] leading-[1.68]" style={{ color:T.muted }}>
              Generate a shareable link to your chat. Send findings to your team in one click.
            </p>
          </motion.div>

          {/* Row 3 — full-width privacy card */}
          <motion.div variants={FADE_UP} whileHover={{ borderColor:"rgba(124,58,237,0.3)", background:"rgba(124,58,237,0.05)" }}
            style={{ ...card({ padding:"24px 28px" }), gridColumn:"1 / -1", display:"flex", flexWrap:"wrap", alignItems:"center", justifyContent:"space-between", gap:16 }}>
            <div className="flex items-center gap-4">
              <div className="text-3xl">🛡️</div>
              <div>
                <h3 className="font-extrabold text-[17px] tracking-tight mb-1">Private &amp; Secure by Default</h3>
                <p className="text-[13px]" style={{ color:T.muted }}>Files are processed in isolation and never stored. Zero data sharing. Zero training on your content.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {["256-bit encryption","No data retention","GDPR-aligned","Zero third-party sharing"].map(b => (
                <span key={b} className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-full"
                  style={{ background:"rgba(124,58,237,0.1)", border:"1px solid rgba(124,58,237,0.22)", color:"#c4b5fd" }}>
                  <Check size={11} color="#a78bfa" /> {b}
                </span>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
