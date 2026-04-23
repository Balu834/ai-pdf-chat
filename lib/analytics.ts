/**
 * lib/analytics.ts
 *
 * Unified event tracking — fires to GA4 + Vercel Analytics simultaneously.
 * Safe during SSR (all functions guard typeof window).
 */

type Props = Record<string, string | number | boolean>;

export function track(event: string, props?: Props) {
  if (typeof window === "undefined") return;

  if (typeof (window as any).gtag === "function") {
    (window as any).gtag("event", event, props ?? {});
  }

  if (typeof (window as any).va === "function") {
    (window as any).va("event", { name: event, ...(props ?? {}) });
  }
}

// ─── Named events ─────────────────────────────────────────────────────────────

export const Events = {
  // Landing
  tryFreeClick:     () => track("try_free_click", { event_category: "engagement" }),
  apkDownloadClick: () => track("apk_download",   { event_category: "engagement", event_label: "android_apk" }),
  watchDemoClick:   () => track("watch_demo_click", { event_category: "engagement" }),
  pricingView:      () => track("pricing_view"),
  upgradeClick:     () => track("upgrade_click",  { event_category: "monetization" }),

  // Auth
  signupStart:      () => track("signup_start"),
  loginStart:       () => track("login_start"),

  // Product
  pdfUploadStart:   () => track("pdf_upload_start"),
  pdfUploadSuccess: (fileName: string) => track("pdf_upload_success", { file_name: fileName }),
  questionAsked:    () => track("question_asked"),
  summaryViewed:    () => track("summary_viewed"),

  // Monetization
  paymentStart:     () => track("payment_start",   { event_category: "monetization" }),
  paymentSuccess:   (amountPaise: number) => track("payment_success", {
    event_category: "monetization",
    value:          amountPaise / 100,  // GA4 expects value in currency units
    currency:       "INR",
  }),
  paymentFailed:    () => track("payment_failed", { event_category: "monetization" }),

  // Retention
  notifEnabled:     () => track("notification_enabled"),
  notifDisabled:    () => track("notification_disabled"),

  // Scroll depth — call once per threshold per page
  scrollDepth:      (pct: 25 | 50 | 75 | 90) => track("scroll", {
    event_category: "engagement",
    event_label:    `${pct}%`,
    percent_scrolled: pct,
  }),
} as const;

// ─── Scroll depth hook — attach once on landing page ─────────────────────────

export function initScrollDepthTracking() {
  if (typeof window === "undefined") return;
  const fired = new Set<number>();
  const thresholds = [25, 50, 75, 90] as const;

  function onScroll() {
    const pct = Math.round(
      (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
    );
    for (const t of thresholds) {
      if (pct >= t && !fired.has(t)) {
        fired.add(t);
        Events.scrollDepth(t);
      }
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  return () => window.removeEventListener("scroll", onScroll);
}
