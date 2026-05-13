"use client";
import { useState } from "react";

const FAQS = [
  {
    q: "Is my data private?",
    a: "Yes. Your documents are encrypted at rest and in transit. We process them in isolated compute environments and never use your documents to train our models. Enterprise customers can opt for on-premise deployment.",
  },
  {
    q: "How accurate are the citations?",
    a: "In independent audits, Intellixy achieved 98% citation accuracy — the cited passage genuinely supports the answer 98 out of 100 times. The remaining 2% are flagged with a lower-confidence indicator. We never hide uncertainty.",
  },
  {
    q: "What document types do you support?",
    a: "120+ formats including PDFs (including scanned OCR), DOCX, XLSX, PPTX, EPUB, HTML, and LaTeX. We handle handwritten notes and multi-column academic layouts. If your format isn't listed, contact us.",
  },
  {
    q: "Is there a document size limit?",
    a: "Free plans support documents up to 50 MB (roughly 500 pages). Pro supports up to 500 MB per document. Atelier supports unlimited size with chunked processing for very large document sets.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from your account settings at any moment. Your Pro access continues until the end of the billing period. No cancellation fees, no dark patterns, no angry retention calls.",
  },
  {
    q: "Do you work offline?",
    a: "Not currently — Intellixy requires an internet connection to process documents and run AI inference. Offline mode is on our roadmap for Atelier enterprise customers. Subscribe to our changelog for updates.",
  },
];

export default function FaqAccordion() {
  const [open, setOpen] = useState<number>(0);

  return (
    <div className="l-faq-list">
      {FAQS.map((faq, i) => (
        <div key={i} className={`l-faq-item${open === i ? " l-faq-open" : ""}`}>
          <button
            className="l-faq-q f"
            onClick={() => setOpen(open === i ? -1 : i)}
            aria-expanded={open === i}
          >
            {faq.q}
            <span className="l-faq-icon">{open === i ? "×" : "+"}</span>
          </button>
          <div className="l-faq-a" aria-hidden={open !== i}>
            <div className="l-faq-a-inner">{faq.a}</div>
          </div>
        </div>
      ))}

      <style jsx>{`
        .l-faq-list { display: flex; flex-direction: column; }
        .l-faq-item { border-bottom: 1px solid var(--rule, #d9d1bf); }
        .l-faq-q {
          width: 100%; display: flex; justify-content: space-between; align-items: center;
          padding: 20px 0; font-family: var(--font-fraunces, Georgia, serif); font-size: 17px;
          font-weight: 600; font-variation-settings: 'SOFT' 30; text-align: left; cursor: pointer;
          color: var(--ink, #1a1814); background: none; border: none; transition: color .15s;
        }
        .l-faq-q:hover { color: var(--accent, #b8552d); }
        .l-faq-icon {
          width: 22px; height: 22px; border: 1.5px solid var(--rule, #d9d1bf); border-radius: 50%;
          display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0;
          color: var(--ink-faint, #8a8378); transition: transform .25s, background .2s, border-color .2s, color .2s;
        }
        .l-faq-open .l-faq-icon { transform: rotate(45deg); background: var(--accent, #b8552d); border-color: var(--accent, #b8552d); color: white; }
        .l-faq-a { max-height: 0; overflow: hidden; transition: max-height .35s cubic-bezier(.22,1,.36,1); }
        .l-faq-open .l-faq-a { max-height: 300px; }
        .l-faq-a-inner { padding-bottom: 20px; font-size: 14.5px; color: var(--ink-soft, #4a443d); line-height: 1.7; }
      `}</style>
    </div>
  );
}
