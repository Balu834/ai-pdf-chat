"use client";
import { useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";

export default function FinalCTA() {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <section className="lp-cta-section">
      <motion.div
        className="lp-cta-inner"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <h2 className="lp-cta-title">
          Start chatting with<br />your PDFs today.
        </h2>
        <p className="lp-cta-sub">
          Upload your first document in seconds. No credit card required.
        </p>

        <div
          className="lp-cta-input-wrap"
          onClick={() => inputRef.current?.focus()}
          role="button"
          tabIndex={-1}
        >
          <Sparkles size={15} className="lp-cta-input-icon" strokeWidth={1.75} />
          <input
            ref={inputRef}
            className="lp-cta-input"
            placeholder="Ask anything about your document…"
            readOnly
          />
          <Link href="/login" className="lp-cta-btn">
            Start Free <ArrowRight size={13} strokeWidth={2.5} />
          </Link>
        </div>

        <p className="lp-cta-microtrust">
          No credit card · Free plan · Cancel anytime
        </p>
      </motion.div>
    </section>
  );
}
