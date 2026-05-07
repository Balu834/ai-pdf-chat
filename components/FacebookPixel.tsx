import Script from "next/script";

/**
 * FacebookPixel — Server Component
 *
 * Injects the Meta Pixel base code via next/script afterInteractive.
 * Pixel ID is hardcoded as a guaranteed fallback so the pixel loads in
 * production even if NEXT_PUBLIC_FACEBOOK_PIXEL_ID is not configured in
 * Vercel's Environment Variables dashboard.
 *
 * - strategy="afterInteractive" → zero render-blocking, no layout shift.
 * - The base code's built-in `if(f.fbq)return` guard prevents double-init.
 * - Disabled in NODE_ENV=development to keep Meta Events Manager clean.
 *   Set NEXT_PUBLIC_FB_DEV=1 to force-enable during local testing.
 */

// Env var takes precedence; hardcoded value is the guaranteed production fallback.
const PIXEL_ID =
  (process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID?.trim()) || "1923754734936306";

const isDev =
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PUBLIC_FB_DEV !== "1";

export default function FacebookPixel() {
  if (isDev) return null; // keep dev events out of Meta Events Manager

  return (
    <>
      {/* ── Meta Pixel base code ────────────────────────────────────────── */}
      <Script id="fb-pixel-init" strategy="afterInteractive">{`
        !function(f,b,e,v,n,t,s){
          if(f.fbq)return;
          n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;
          n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];
          t=b.createElement(e);t.async=!0;
          t.src=v;
          s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)
        }(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
        fbq('init','${PIXEL_ID}');
        fbq('track','PageView');
      `}</Script>
    </>
  );
}
