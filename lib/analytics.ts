/**
 * lib/analytics.ts
 *
 * Unified event tracking — fires to GA4 + Vercel Analytics simultaneously.
 * Safe during SSR (all guards check typeof window).
 */

type Props = Record<string, string | number | boolean | undefined>;

export function track(event: string, props?: Props) {
  if (typeof window === "undefined") return;

  // Google Analytics 4
  if (typeof (window as any).gtag === "function") {
    (window as any).gtag("event", event, props ?? {});
  }

  // Vercel Analytics
  if (typeof (window as any).va === "function") {
    (window as any).va("event", { name: event, ...(props ?? {}) });
  }
}

// ─── Named events ─────────────────────────────────────────────────────────────

export const Events = {
  // ── Landing ──────────────────────────────────────────────────────────────
  landingView:      () => track("landing_view",    { event_category: "engagement" }),
  tryFreeClick:     () => track("try_free_click",   { event_category: "engagement" }),
  apkDownloadClick: () => track("apk_download",     { event_category: "engagement", event_label: "android_apk" }),
  watchDemoClick:   () => track("watch_demo_click", { event_category: "engagement" }),
  pricingView:      () => track("pricing_view",     { event_category: "engagement" }),
  upgradeClick:     () => track("upgrade_click",    { event_category: "monetization" }),

  // ── Auth ─────────────────────────────────────────────────────────────────
  signupStart:      () => track("signup_start",    { event_category: "auth" }),
  signupComplete:   (method: "email" | "google") =>
    track("signup_complete", { event_category: "auth", method }),
  loginStart:       () => track("login_start",     { event_category: "auth" }),
  loginComplete:    (method: "email" | "google") =>
    track("login",           { event_category: "auth", method }),

  // ── Product ──────────────────────────────────────────────────────────────
  pdfUploadStart:   () => track("upload_pdf_start", { event_category: "product" }),
  pdfUploadSuccess: (fileName: string, fileSizeKb: number) =>
    track("upload_pdf", {
      event_category: "product",
      file_name:       fileName,
      file_size_kb:    Math.round(fileSizeKb),
    }),
  questionAsked:    () => track("question_asked",        { event_category: "product" }),
  aiResponseGenerated: () => track("ai_response_generated", { event_category: "product" }),
  summaryViewed:    () => track("summary_viewed",        { event_category: "product" }),

  // ── Monetization ─────────────────────────────────────────────────────────
  paymentStart:   () => track("payment_start", { event_category: "monetization" }),
  paymentFailed:  () => track("payment_failed", { event_category: "monetization" }),

  /** Fires both a custom payment_success + GA4's standard purchase event */
  paymentSuccess: (paymentId: string, amountPaise: number) => {
    const value = amountPaise / 100;
    track("payment_success", { event_category: "monetization", value, currency: "INR" });

    // GA4 e-commerce purchase — shows up in Monetization → Purchases
    if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
      (window as any).gtag("event", "purchase", {
        transaction_id: paymentId,
        value,
        currency:       "INR",
        items: [{ item_id: "pro_monthly", item_name: "Pro Plan", price: value, quantity: 1 }],
      });
    }
  },

  // ── Retention ─────────────────────────────────────────────────────────────
  notifEnabled:  () => track("notification_enabled"),
  notifDisabled: () => track("notification_disabled"),

  // ── Scroll depth (25 / 50 / 75 / 90 %) ───────────────────────────────────
  scrollDepth: (pct: 25 | 50 | 75 | 90) =>
    track("scroll", {
      event_category:   "engagement",
      event_label:      `${pct}%`,
      percent_scrolled: pct,
    }),
} as const;

// ─── First-visit / install-proxy ──────────────────────────────────────────────

export function trackFirstVisit() {
  if (typeof window === "undefined") return;
  const KEY = "ix_first_visit_fired";
  if (localStorage.getItem(KEY)) return;
  localStorage.setItem(KEY, "1");
  track("first_visit_app", { event_category: "engagement" });
}

// ─── Scroll depth ─────────────────────────────────────────────────────────────

export function initScrollDepthTracking() {
  if (typeof window === "undefined") return;
  const fired      = new Set<number>();
  const thresholds = [25, 50, 75, 90] as const;

  function onScroll() {
    const scrollable = document.body.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return;
    const pct = Math.round((window.scrollY / scrollable) * 100);
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
