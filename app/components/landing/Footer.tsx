import Link from "next/link";
import { IntellixyBrainIcon } from "@/app/components/IntellixyBrainIcon";

const COLS = [
  {
    head: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Live demo", href: "#demo"     },
      { label: "Pricing",  href: "#pricing"   },
      { label: "Changelog", href: "#"         },
    ],
  },
  {
    head: "Use cases",
    links: [
      { label: "Legal contracts",    href: "#" },
      { label: "Financial reports",  href: "#" },
      { label: "Research papers",    href: "#" },
      { label: "Compliance reviews", href: "#" },
    ],
  },
  {
    head: "Company",
    links: [
      { label: "About",   href: "#" },
      { label: "Blog",    href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "#" },
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
          <a href="#">Privacy</a> · <a href="#">Terms</a> · <a href="#">Security</a>
        </span>
      </div>
    </footer>
  );
}
