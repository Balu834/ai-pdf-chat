import Script from "next/script";

/**
 * Analytics — Google Analytics 4 + Microsoft Clarity
 *
 * Rendered as a Server Component so NEXT_PUBLIC_* env vars are
 * inlined at build time (no "use client" needed, no runtime miss).
 *
 * Env vars (Vercel → Settings → Environment Variables):
 *   NEXT_PUBLIC_GA_ID        e.g. G-26MPXY3PE2
 *   NEXT_PUBLIC_CLARITY_ID   e.g. abcdefghij  (optional)
 */

const GA_ID      = process.env.NEXT_PUBLIC_GA_ID?.trim();
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID?.trim();

export default function Analytics() {
  if (process.env.NODE_ENV !== "production") return null;

  return (
    <>
      {/* ── Google Analytics 4 ─────────────────────────────────────────── */}
      {GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}', {
              page_path: window.location.pathname,
              cookie_flags: 'SameSite=None;Secure',
              send_page_view: true,
            });
          `}</Script>
        </>
      )}

      {/* ── Microsoft Clarity ──────────────────────────────────────────── */}
      {CLARITY_ID && (
        <Script id="clarity-init" strategy="afterInteractive">{`
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${CLARITY_ID}");
        `}</Script>
      )}
    </>
  );
}
