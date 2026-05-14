import Link from "next/link";

const COLS = [
  {
    head: "Product",
    links: [
      { label: "Features",     href: "#features" },
      { label: "How it works", href: "#workflow" },
      { label: "Pricing",      href: "#pricing"  },
      { label: "Changelog",    href: "#"         },
    ],
  },
  {
    head: "Use cases",
    links: [
      { label: "Legal contracts",     href: "#" },
      { label: "Financial reports",   href: "#" },
      { label: "Research papers",     href: "#" },
      { label: "Compliance reviews",  href: "#" },
    ],
  },
  {
    head: "Company",
    links: [
      { label: "About",    href: "#" },
      { label: "Blog",     href: "#" },
      { label: "Careers",  href: "#" },
      { label: "Contact",  href: "#" },
    ],
  },
  {
    head: "Legal",
    links: [
      { label: "Privacy policy",  href: "#" },
      { label: "Terms of service",href: "#" },
      { label: "Cookie policy",   href: "#" },
      { label: "Security",        href: "#" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="lp-footer">
      <div className="lp-footer-top">

        {/* Brand block */}
        <div className="lp-footer-brand">
          <Link href="/" className="lp-nav-brand">
            <div className="lp-nav-mark">I</div>
            <span className="lp-nav-name">Intellixy</span>
          </Link>
          <p className="lp-footer-tagline">
            Chat with any document.<br />Get cited answers, instantly.
          </p>
        </div>

        {/* Columns */}
        <div className="lp-footer-cols">
          {COLS.map(col => (
            <div key={col.head} className="lp-footer-col">
              <p className="lp-footer-col-head">{col.head}</p>
              <ul className="lp-footer-col-list">
                {col.links.map(l => (
                  <li key={l.label}>
                    <a href={l.href} className="lp-footer-link">{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="lp-footer-bottom">
        <p className="lp-footer-copy">
          © {new Date().getFullYear()} Intellixy. All rights reserved.
        </p>
        <p className="lp-footer-made">
          Made with care · Hosted on Vercel
        </p>
      </div>
    </footer>
  );
}
