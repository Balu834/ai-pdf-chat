import Link from "next/link";

export default function FinalCTA() {
  return (
    <section className="lp-final-cta">
      <h2 className="lp-final-cta-h2">
        Stop reading.<br /><em>Start asking.</em>
      </h2>

      <Link href="/login" className="lp-btn-black lp-btn-lg">
        Upload a PDF — it&apos;s free →
      </Link>

      <p className="lp-final-cta-meta">
        14-day money-back guarantee · Cancel anytime
      </p>
    </section>
  );
}
