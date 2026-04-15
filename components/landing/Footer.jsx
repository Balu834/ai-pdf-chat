"use client";

import { T } from "@/components/ui/tokens";
import { PdfIcon } from "@/components/ui/atoms";

export default function Footer() {
  return (
    <footer className="px-5 sm:px-8 pt-12 pb-8" style={{ borderTop:`1px solid ${T.border}` }}>
      <div className="max-w-[1100px] mx-auto">
        <div className="flex flex-wrap gap-12 justify-between mb-10">
          <div style={{ maxWidth:240 }}>
            <a href="/" className="flex items-center gap-2 no-underline mb-4">
              <div className="flex items-center justify-center rounded-xl" style={{ width:28, height:28, background:"linear-gradient(135deg,#7c3aed,#06b6d4)" }}>
                <PdfIcon size={12} />
              </div>
              <span className="font-extrabold text-[14px] text-white">Intellixy</span>
            </a>
            <p className="text-[13px] leading-[1.7] m-0" style={{ color:T.faint }}>
              AI-powered document assistant. Chat with any PDF, extract insights, work smarter.
            </p>
          </div>
          <div className="flex flex-wrap gap-12">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color:T.faint }}>Product</p>
              <div className="flex flex-col gap-2.5">
                {[["Features","#features"],["How it works","#how-it-works"],["Pricing","#pricing"],["Demo","#demo"]].map(([l,h])=>(
                  <a key={l} href={h} className="text-[13px] no-underline" style={{ color:"rgba(255,255,255,0.38)" }}>{l}</a>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color:T.faint }}>Legal</p>
              <div className="flex flex-col gap-2.5">
                {[["Privacy Policy","/privacy-policy"],["Terms of Service","/terms"],["Refund Policy","/refund-policy"],["Contact","mailto:support@intellixy.app"]].map(([l,h])=>(
                  <a key={l} href={h} className="text-[13px] no-underline" style={{ color:"rgba(255,255,255,0.38)" }}>{l}</a>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 pt-5" style={{ borderTop:`1px solid ${T.border}` }}>
          <p className="text-[12px] m-0" style={{ color:T.faint }}>© 2026 Intellixy. All rights reserved.</p>
          <p className="text-[12px] m-0" style={{ color:"rgba(255,255,255,0.16)" }}>Made with ♥ using Next.js + GPT-4o</p>
        </div>
      </div>
    </footer>
  );
}
