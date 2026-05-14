const TESTIMONIALS = [
  {
    quote: "I read 40-page contracts in 3 minutes now. Intellixy finds the renewal traps and liability clauses my paralegal would take hours to locate.",
    name:  "Priya Venkataraman",
    role:  "M&A Associate, Mumbai",
    init:  "PV",
  },
  {
    quote: "Our equity research team dropped average report-reading time by 70%. The citation accuracy is the only reason our compliance team approved it.",
    name:  "Rohan Mehta",
    role:  "VP Research, NBFC",
    init:  "RM",
  },
  {
    quote: "I used to spend Sunday nights reading board packs. Now I ask questions. Cited answers mean I can push back in meetings with exact page numbers.",
    name:  "Anika Singh",
    role:  "CFO, Series B SaaS",
    init:  "AS",
  },
];

export default function Testimonials() {
  return (
    <section className="lp-testimonials-section">
      <div className="lp-testimonials-inner">
        <div className="lp-section-head">
          <p className="lp-section-eyebrow">Testimonials</p>
          <h2 className="lp-section-title">Trusted by professionals who read for a living</h2>
        </div>

        <div className="lp-testimonials-grid">
          {TESTIMONIALS.map(t => (
            <div key={t.name} className="lp-tcard">
              <div className="lp-tcard-stars" aria-label="5 out of 5 stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className="lp-tcard-star" aria-hidden>★</span>
                ))}
              </div>
              <blockquote className="lp-tcard-quote">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="lp-tcard-author">
                <div className="lp-tcard-av" aria-hidden>{t.init}</div>
                <div>
                  <div className="lp-tcard-name">{t.name}</div>
                  <div className="lp-tcard-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
