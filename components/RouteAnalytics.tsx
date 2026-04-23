"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { track } from "@/lib/analytics";

/**
 * Fires a GA4 page_view on every client-side route change.
 * Next.js App Router doesn't trigger gtag's built-in pageview
 * on navigation — this fills that gap.
 *
 * Mount once inside <Suspense> in layout.tsx.
 */
export default function RouteAnalytics() {
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const lastUrl      = useRef<string>("");

  useEffect(() => {
    const url = pathname + (searchParams.toString() ? `?${searchParams}` : "");
    if (url === lastUrl.current) return; // no duplicate fires
    lastUrl.current = url;

    // Tell GA4 about the navigation
    if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
      (window as any).gtag("event", "page_view", {
        page_path:     pathname,
        page_location: window.location.href,
        page_title:    document.title,
      });
    }

    track("page_view", { page: url });
  }, [pathname, searchParams]);

  return null;
}
