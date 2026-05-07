"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { track } from "@/lib/analytics";
import { pageview } from "@/lib/facebookPixel";

/**
 * RouteAnalytics — fires page_view on every SPA route change.
 *
 * Next.js App Router does not fire built-in pageview events on client-side
 * navigation, so this component fills the gap for both GA4 and Meta Pixel.
 *
 * Mount once inside <Suspense> in layout.tsx (required by useSearchParams).
 *
 * Deduplication: `lastUrl` ref prevents double-fires when query-string
 * flicker causes the effect to re-run with the same full URL.
 *
 * First load: the Meta Pixel init script (in layout.tsx) already calls
 * fbq('track','PageView') on initial load, so we skip it here by comparing
 * against the lastUrl ref which starts as "" — the effect runs once, sets
 * lastUrl, and skips the pixel call for that first URL via `isFirst`.
 */
export default function RouteAnalytics() {
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const lastUrl      = useRef<string>("");
  const isFirst      = useRef(true);

  useEffect(() => {
    const url = pathname + (searchParams.toString() ? `?${searchParams}` : "");
    if (url === lastUrl.current) return;
    lastUrl.current = url;

    // ── GA4 page_view ───────────────────────────────────────────────────
    if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
      (window as any).gtag("event", "page_view", {
        page_path:     pathname,
        page_location: window.location.href,
        page_title:    document.title,
      });
    }

    track("page_view", { page: url });

    // ── Meta Pixel PageView ─────────────────────────────────────────────
    // Skip the very first render: the layout.tsx init script already called
    // fbq('track','PageView') for the initial page load.
    // Every subsequent SPA navigation fires an explicit PageView.
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }

    pageview();
  }, [pathname, searchParams]);

  return null;
}
