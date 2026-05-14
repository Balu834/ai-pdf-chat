const STATS = [
  { val: "50K+",  label: "Documents processed" },
  { val: "3.4s",  label: "Average answer time"  },
  { val: "98%",   label: "Citation accuracy"     },
  { val: "4.9★",  label: "Average user rating"   },
];

export default function Stats() {
  return (
    <section className="lp-stats-section">
      <div className="lp-stats-inner">
        {STATS.map(s => (
          <div key={s.label} className="lp-stat-item">
            <div className="lp-stat-val">{s.val}</div>
            <div className="lp-stat-label">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
