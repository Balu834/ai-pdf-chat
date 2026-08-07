"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FAQS = [
  {
    q: "Is my data private?",
    a: "Yes. Your documents are encrypted at rest and in transit. We process them in isolated compute environments and never use your documents to train our models. Enterprise customers can opt for on-premise deployment.",
  },
  {
    q: "How accurate are the citations?",
    a: "Intellixy achieves 100% citation accuracy — every answer is grounded in the exact passage from your document, with page and section references you can verify instantly. We never fabricate or hallucinate sources.",
  },
  {
    q: "What document types do you support?",
    a: "Currently PDF only. DOCX, XLSX, and other formats are on the roadmap. If you have a specific format you need, email us — it helps us prioritise.",
  },
  {
    q: "Is there a document size limit?",
    a: "Free plan supports PDFs up to 100 pages. Pro plan supports up to 500 pages per PDF. Very large documents (500+ pages) are on the Pro roadmap — contact us if you need to process them today.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from your account settings at any moment. Your Pro access continues until the end of the billing period. No cancellation fees, no dark patterns, no angry retention calls.",
  },
  {
    q: "Do you work offline?",
    a: "Not currently — Intellixy requires an internet connection to process documents and run AI inference. Offline mode is on our roadmap.",
  },
];

export default function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="lp-faq-list">
      {FAQS.map((faq, i) => (
        <div key={i} className="lp-faq-item">
          <button
            className="lp-faq-question"
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
          >
            <span>{faq.q}</span>
            <ChevronDown
              size={16}
              strokeWidth={2}
              className={`lp-faq-chevron${open === i ? " open" : ""}`}
              aria-hidden
            />
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div
                key="body"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                style={{ overflow: "hidden" }}
              >
                <p className="lp-faq-body">{faq.a}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
