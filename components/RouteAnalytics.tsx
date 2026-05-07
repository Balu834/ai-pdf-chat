"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { track } from "@/lib/analytics";
import { pageview } from "@/lib/facebookPixel";

/**
 * RouteAnalytics — tracks client-side SPA navigation for GA4 + Meta Pixel.
 *
 * Next.js App Router doesn't trigger built-in pageview events on navigation,
 * so this component fills that gap. Mount it once inside <Suspense> in layout.tsx.
 *
 * Deduplication strategy:
 *   • lastUrl ref — prevents double-fires on the same URL (e.g. query-string flicker).
 *   • isFirstMount ref — skips the very first render for Meta Pixel only, because the
 *     FacebookPixel init script already fires fbq('track','PageView') on initial load.
 *     GA4 behavior is left unchanged to avoid affecting existing reports.
 */
export default function RouteAnalytics() {
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const lastUrl      = useRef<string>("");
  const isFirstMount = useRef(true);

  useEffect(() => {
    const url = pathname + (searchParams.toString() ? `?${searchParams}` : "");
    if (url === lastUrl.current) return; // deduplicate same-URL fires
    lastUrl.current = url;

    // ── GA4 page_view (unchanged behaviour) ──────────────────────────────
    if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
      (window as any).gtag("event", "page_view", {
        page_path:     pathname,
        page_location: window.location.href,
        page_title:    document.title,
      });
    }

    track("page_view", { page: url });

    // ── Meta Pixel PageView ───────────────────────────────────────────────
    // Skip first mount: FacebookPixel's init script already fired PageView.
    // Every subsequent navigation (SPA route change) needs an explicit call.
    if (!isFirstMount.current) {
      pageview();
    }
    isFirstMount.current = false;
  }, [pathname, searchParams]);

  return null;
}
