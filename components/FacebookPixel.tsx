import Script from "next/script";

/**
 * FacebookPixel — Server Component
 *
 * Injects the Meta Pixel base code via next/script afterInteractive.
 * Follows the same pattern as components/Analytics.tsx.
 *
 * - No "use client" needed — NEXT_PUBLIC_* is inlined at build time.
 * - strategy="afterInteractive" ensures zero render-blocking.
 * - The built-in `if(f.fbq)return` guard in the base code prevents
 *   double-initialization even if this component re-renders.
 * - Only active in production to keep Meta Events Manager clean.
 *
 * To activate:
 *   1. Set NEXT_PUBLIC_FACEBOOK_PIXEL_ID in Vercel → Settings → Env Vars.
 *   2. The component self-disables when the env var is absent.
 */

const PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID?.trim();

export default function FacebookPixel() {
  if (!PIXEL_ID) return null;
  if (process.env.NODE_ENV !== "production") return null;

  return (
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
  );
}
