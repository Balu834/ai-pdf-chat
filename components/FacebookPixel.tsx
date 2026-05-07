/**
 * FacebookPixel — RETIRED
 *
 * The Meta Pixel <Script> is now placed directly in app/layout.tsx
 * (not in a sub-component) so that next/script can reliably hoist it
 * through Next.js 16's RSC pipeline.
 *
 * This file is kept as a no-op to avoid breaking any existing imports.
 * SPA route-change tracking lives in components/RouteAnalytics.tsx.
 * Event helpers live in lib/facebookPixel.ts.
 */
export default function FacebookPixel() {
  return null;
}
