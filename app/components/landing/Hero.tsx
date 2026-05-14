"use client";
import { Paperclip, ArrowUp } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Hero() {
  const router = useRouter();
  const go = () => router.push("/login");

  return (
    <section className="lp-hero">

      {/* Eyebrow */}
      <div className="lp-hero-eyebrow">
        <span className="lp-eyebrow-dot" aria-hidden />
        AI-Powered Document Intelligence
      </div>

      {/* Headline */}
      <h1 className="lp-hero-h1">
        Chat with any PDF.<br /><em>Instantly.</em>
      </h1>

      {/* Sub-headline */}
      <p className="lp-hero-sub">
        Upload any document and get cited AI answers in seconds —&thinsp;no skimming,
        no guessing, no hallucinations.
      </p>

      {/* ── Signature chat-style CTA ───────────────────────────────────── */}
      <div
        className="lp-hero-input-wrap"
        onClick={go}
        role="button"
        tabIndex={0}
        aria-label="Get started — upload a PDF"
        onKeyDown={e => e.key === "Enter" && go()}
      >
        <button
          className="lp-hero-attach"
          type="button"
          aria-label="Attach PDF"
          onClick={e => { e.stopPropagation(); go(); }}
        >
          <Paperclip size={17} strokeWidth={2} />
        </button>

        <span className="lp-hero-placeholder" aria-hidden>
          Drop a PDF or ask anything…
        </span>

        <button
          className="lp-hero-send"
          type="button"
          aria-label="Get started"
          onClick={e => { e.stopPropagation(); go(); }}
        >
          <ArrowUp size={16} strokeWidth={2.5} />
        </button>
      </div>

      {/* Trust line */}
      <p className="lp-hero-trust">
        <strong>1,200+ professionals</strong> trust Intellixy
      </p>
    </section>
  );
}
