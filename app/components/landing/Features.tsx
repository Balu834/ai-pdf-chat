import { FileSearch, Zap, FileText, Globe, Shield, AlertTriangle } from "lucide-react";

const FEATURES = [
  {
    Icon:  FileSearch,
    title: "Cited answers",
    body:  "Every answer links back to the exact page, section, and sentence. No black-box output — just verifiable claims.",
  },
  {
    Icon:  Zap,
    title: "Answer in seconds",
    body:  "Average response time under 3.4 seconds. Streaming output so you see answers as they form.",
  },
  {
    Icon:  FileText,
    title: "120+ formats + OCR",
    body:  "PDFs, DOCX, XLSX, scanned images, handwritten notes, academic LaTeX. If it's a document, we read it.",
  },
  {
    Icon:  Globe,
    title: "Multi-language",
    body:  "Ask in English, get answers from a French contract. Cross-lingual retrieval with no manual translation.",
  },
  {
    Icon:  Shield,
    title: "End-to-end encrypted",
    body:  "Documents are encrypted at rest and in transit. We never train on your data. Enterprise on-premise available.",
  },
  {
    Icon:  AlertTriangle,
    title: "Risk extraction",
    body:  "Automatically flags legal exposure, concentration risk, and compliance gaps in contracts and financial reports.",
  },
];

export default function Features() {
  return (
    <section className="lp-features" id="features">
      <div className="lp-section-head">
        <p className="lp-section-eyebrow">Features</p>
        <h2 className="lp-section-title">Everything you need to read smarter</h2>
        <p className="lp-section-sub">
          Built for professionals who can&apos;t afford to miss a detail.
        </p>
      </div>

      <div className="lp-feat-grid">
        {FEATURES.map(({ Icon, title, body }) => (
          <div key={title} className="lp-feat-card">
            <div className="lp-feat-icon">
              <Icon size={20} strokeWidth={1.75} />
            </div>
            <h3 className="lp-feat-title">{title}</h3>
            <p className="lp-feat-body">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
