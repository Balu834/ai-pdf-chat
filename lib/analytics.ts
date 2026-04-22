/**
 * lib/analytics.ts
 *
 * Single track() function that fires to both:
 *   - Google Analytics 4  (window.gtag)
 *   - Vercel Analytics    (window.va)
 *
 * Safe to call during SSR — both guards check for window.
 */

type Props = Record<string, string | number | boolean>;

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

// ─── Named events — use these instead of raw strings ────────────────────────

export const Events = {
  // Landing page
  tryFreeClick:      () => track("try_free_click"),
  apkDownloadClick:  () => track("apk_download_click"),
  watchDemoClick:    () => track("watch_demo_click"),
  pricingView:       () => track("pricing_view"),
  upgradeClick:      () => track("upgrade_click"),

  // Auth
  signupStart:       () => track("signup_start"),
  loginStart:        () => track("login_start"),

  // Core product
  pdfUploadStart:    () => track("pdf_upload_start"),
  pdfUploadSuccess:  (fileName: string) => track("pdf_upload_success", { file_name: fileName }),
  questionAsked:     () => track("question_asked"),
  summaryViewed:     () => track("summary_viewed"),

  // Monetization
  paymentStart:      () => track("payment_start"),
  paymentSuccess:    (amountPaise: number) => track("payment_success", { amount_paise: amountPaise }),
  paymentFailed:     () => track("payment_failed"),

  // Retention
  notifEnabled:      () => track("notification_enabled"),
  notifDisabled:     () => track("notification_disabled"),
} as const;
