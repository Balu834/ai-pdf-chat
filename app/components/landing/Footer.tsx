import Link from "next/link";
import { IntellixyBrainIcon } from "@/app/components/IntellixyBrainIcon";

const COLS = [
  {
    head: "Product",
    links: [
      { label: "Features",  href: "#features" },
      { label: "Live demo", href: "#demo"     },
      { label: "Pricing",   href: "#pricing"  },
    ],
  },
  {
    head: "Legal",
    links: [
      { label: "Privacy policy",   href: "/privacy"  },
      { label: "Terms of service", href: "/terms"    },
      { label: "Refund policy",    href: "/refunds"  },
    ],
  },
  {
    head: "Contact",
    links: [
      { label: "intellixy54@gmail.com", href: "mailto:intellixy54@gmail.com" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="lp-footer">
      <div className="lp-footer-inner">
        <div>
          <Link href="/" className="lp-footer-logo">
            <span className="lp-footer-logo-mark" aria-hidden>
              <IntellixyBrainIcon size={24} />
            </span>
            Intellixy
          </Link>
          <p className="lp-footer-tagline">
            Chat with any document.<br />Get cited answers, instantly.
          </p>
        </div>

        {COLS.map(col => (
          <div key={col.head}>
            <p className="lp-footer-col-head">{col.head}</p>
            <ul className="lp-footer-links" role="list">
              {col.links.map(l => (
                <li key={l.label}><a href={l.href}>{l.label}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="lp-footer-bottom">
        <span suppressHydrationWarning>© {new Date().getFullYear()} Intellixy. All rights reserved.</span>
        <span>
          <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a> · <a href="mailto:intellixy54@gmail.com">Contact</a>
        </span>
      </div>
    </footer>
  );
}
