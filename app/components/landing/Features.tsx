import { FileSearch, Zap, FileText, Globe, Shield, AlertTriangle } from "lucide-react";

const CARDS = [
  {
    icon: <FileSearch size={20} />,
    eyebrow: "Core feature",
    title: "Cited answers, every time",
    body: "Every AI response links back to the exact page, section, and sentence. No black-box output — every claim is verifiable.",
    featured: true,
    demo: true,
  },
  {
    icon: <Zap size={20} />,
    eyebrow: "Performance",
    title: "Answer in 3.4 seconds",
    body: "Streaming output so you see answers as they form. Average full response under 3.4s.",
  },
  {
    icon: <FileText size={20} />,
    eyebrow: "Compatibility",
    title: "PDFs, DOCX, scans",
    body: "OCR for scanned documents, handwritten notes, and academic LaTeX. If it's a document, we read it.",
  },
  {
    icon: <Globe size={20} />,
    eyebrow: "Languages",
    title: "Multi-language retrieval",
    body: "Ask in English, get answers from a French contract. Cross-lingual without manual translation.",
  },
  {
    icon: <Shield size={20} />,
    eyebrow: "Privacy",
    title: "End-to-end encrypted",
    body: "Encrypted at rest and in transit. We never train on your data. Enterprise on-premise available.",
    dark: true,
  },
  {
    icon: <AlertTriangle size={20} />,
    eyebrow: "Intelligence",
    title: "Automatic risk extraction",
    body: "Flags legal exposure, concentration risk, and compliance gaps in contracts and reports.",
    dark: true,
  },
];

export default function Features() {
  return (
    <section className="lp-features-section" id="features">
      <div className="lp-features-inner">
        <div className="lp-section-head">
          <p className="lp-section-eyebrow">Features</p>
          <h2 className="lp-section-title">Everything you need to read smarter</h2>
          <p className="lp-section-sub">
            Built for professionals who can&apos;t afford to miss a detail.
          </p>
        </div>

        <div className="lp-bento">
          {CARDS.map((c, i) => (
            <div
              key={i}
              className={`lp-bento-card${c.featured ? " featured" : ""}${c.dark ? " dark" : ""}`}
            >
              <div className="lp-bento-icon">{c.icon}</div>
              <div className="lp-bento-eyebrow">{c.eyebrow}</div>
              <div className="lp-bento-title">{c.title}</div>
              <div className="lp-bento-body">{c.body}</div>
              {c.demo && (
                <div className="lp-bento-cite-demo">
                  Q3 revenue was <strong>₹423.7 crore</strong>, up 23.4% YoY, beating
                  analyst consensus by 4.2 pp.
                  <span className="lp-bento-cite-pill">p.14</span>
                  <span className="lp-bento-cite-pill">§3.2</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
