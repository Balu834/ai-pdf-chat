"use client";

import Script from "next/script";

/**
 * Analytics — Google Analytics 4 + Microsoft Clarity
 *
 * Both are loaded with `strategy="afterInteractive"` so they never block
 * the main thread or delay the first paint.
 *
 * Env vars required (Vercel → Environment Variables):
 *   NEXT_PUBLIC_GA_ID        e.g. G-XXXXXXXXXX
 *   NEXT_PUBLIC_CLARITY_ID   e.g. abcdefghij
 *
 * Neither script loads in development (NODE_ENV !== "production"), so
 * local sessions don't pollute your analytics dashboards.
 */
export default function Analytics() {
  if (process.env.NODE_ENV !== "production") return null;

  const gaId      = process.env.NEXT_PUBLIC_GA_ID;
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID;

  return (
    <>
      {/* ── Google Analytics 4 ─────────────────────────────────────────── */}
      {gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}', {
                page_path: window.location.pathname,
                cookie_flags: 'SameSite=None;Secure',
              });
            `}
          </Script>
        </>
      )}

      {/* ── Microsoft Clarity ──────────────────────────────────────────── */}
      {clarityId && (
        <Script id="clarity-init" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${clarityId}");
          `}
        </Script>
      )}
    </>
  );
}
