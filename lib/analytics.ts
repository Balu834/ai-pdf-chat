/**
 * lib/analytics.ts
 *
 * Unified event tracking — fires to GA4 + Vercel Analytics + Meta Pixel.
 * Safe during SSR (all guards check typeof window).
 *
 * Meta Pixel events fire alongside GA4 at key conversion touchpoints.
 * To add a new pixel event anywhere in the app, import directly from
 * @/lib/facebookPixel instead of going through this file.
 */

import {
  trackLead,
  trackCompleteRegistration,
  trackStartTrial,
  trackInitiateCheckout,
  trackPurchase,
  trackSubscribe,
  trackViewContent,
} from "@/lib/facebookPixel";

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
  signupStart: () => {
    track("signup_start", { event_category: "auth" });
    trackLead(); // Meta Pixel: user shows signup intent
  },
  signupComplete: (method: "email" | "google") => {
    track("signup_complete", { event_category: "auth", method });
    trackCompleteRegistration(method); // Meta Pixel: account created
  },
  loginStart:    () => track("login_start",  { event_category: "auth" }),
  loginComplete: (method: "email" | "google") =>
    track("login",           { event_category: "auth", method }),

  // ── Product ──────────────────────────────────────────────────────────────
  pdfUploadStart:   () => track("upload_pdf_start", { event_category: "product" }),
  pdfUploadSuccess: (fileName: string, fileSizeKb: number) => {
    track("upload_pdf", {
      event_category: "product",
      file_name:       fileName,
      file_size_kb:    Math.round(fileSizeKb),
    });
    trackViewContent("PDF Uploaded");  // Meta Pixel: user uploaded a PDF
    trackStartTrial();                 // Meta Pixel: user is actively using the product
  },
  questionAsked: () => {
    track("question_asked", { event_category: "product" });
    trackViewContent("Chat Started"); // Meta Pixel: user started a chat session
  },
  aiResponseGenerated: () => track("ai_response_generated", { event_category: "product" }),
  summaryViewed:       () => track("summary_viewed",         { event_category: "product" }),

  // ── Monetization ─────────────────────────────────────────────────────────
  paymentStart: () => {
    track("payment_start", { event_category: "monetization" });
    trackInitiateCheckout(); // Meta Pixel: user opened payment flow
  },
  paymentFailed: () => track("payment_failed", { event_category: "monetization" }),

  /** Fires GA4 purchase + Meta Pixel Purchase + Subscribe */
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

    // Meta Pixel: purchase confirmed + subscription started
    trackPurchase(value, "INR");
    trackSubscribe(value, "INR");
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
