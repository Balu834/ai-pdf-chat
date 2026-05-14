const STEPS = [
  {
    num:   "01",
    title: "Upload your document",
    body:  "Drop any PDF, DOCX, or scanned file. We extract, chunk, and embed it in seconds.",
  },
  {
    num:   "02",
    title: "Ask in plain language",
    body:  "Type any question — summarise, compare, extract numbers, find risks. No special syntax.",
  },
  {
    num:   "03",
    title: "Get cited answers",
    body:  "Every response links back to the exact page and passage. Verify any claim in one click.",
  },
];

export default function HowItWorks() {
  return (
    <section className="lp-workflow" id="workflow">
      <div className="lp-section-head">
        <p className="lp-section-eyebrow">How it works</p>
        <h2 className="lp-section-title">From upload to answer in three steps</h2>
      </div>

      <div className="lp-steps-grid">
        {STEPS.map((s, i) => (
          <div key={s.num} className="lp-step">
            {i < STEPS.length - 1 && <div className="lp-step-divider" aria-hidden />}
            <div className="lp-step-num" aria-hidden>{s.num}</div>
            <h3 className="lp-step-title">{s.title}</h3>
            <p className="lp-step-body">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
