/**
 * lib/facebookPixel.ts
 *
 * Meta Pixel utility — all fbq calls go through here.
 * Every function is SSR-safe and ad-blocker-safe (silent no-ops on failure).
 *
 * Usage:
 *   import { pageview, event, trackPurchase } from "@/lib/facebookPixel";
 *
 * Env var: NEXT_PUBLIC_FACEBOOK_PIXEL_ID (set in Vercel → Settings → Environment Variables)
 */

export const PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID ?? "";

// Extend Window so TypeScript knows fbq exists after the pixel script loads.
declare global {
  interface Window {
    fbq:  ((...args: unknown[]) => void) & { callMethod?: Function; queue?: unknown[]; loaded?: boolean; version?: string; };
    _fbq: unknown;
  }
}

/** Internal — safe wrapper around window.fbq. Returns false if unavailable. */
function fbq(...args: unknown[]): boolean {
  if (typeof window === "undefined") return false;       // SSR guard
  if (typeof window.fbq !== "function") return false;    // ad-blocker / not loaded yet
  try {
    window.fbq(...args);
    return true;
  } catch {
    return false;
  }
}

// ─── Core ────────────────────────────────────────────────────────────────────

/**
 * PageView — fire this on every SPA navigation (after the initial page load,
 * which the base code handles automatically).
 * Called by RouteAnalytics on route changes.
 */
export function pageview() {
  fbq("track", "PageView");
}

/**
 * Generic event helper — use for any standard or custom event.
 *
 * @param name  Standard Meta event (e.g. "Lead") or custom string (e.g. "PDFUploaded")
 * @param data  Optional event parameters (value, currency, content_name, etc.)
 *
 * @example
 *   event("Lead");
 *   event("Purchase", { value: 299, currency: "INR" });
 *   event("PDFUploaded", { content_name: "invoice.pdf" });
 */
export function event(name: string, data?: Record<string, unknown>) {
  if (data !== undefined) {
    fbq("track", name, data);
  } else {
    fbq("track", name);
  }
}

// ─── Standard Conversion Events ──────────────────────────────────────────────

/**
 * Lead — user shows purchase intent (sign-up start, pricing page view, etc.).
 * Fires: when user clicks "Start Free" / "Get Pro" / opens login page.
 */
export function trackLead() {
  fbq("track", "Lead");
}

/**
 * CompleteRegistration — user successfully creates an account.
 * Fires: after email confirmed / OAuth signup completes.
 *
 * @param method  "email" | "google"
 */
export function trackCompleteRegistration(method?: string) {
  fbq("track", "CompleteRegistration", method ? { method } : {});
}

/**
 * StartTrial — user activates the free plan (first PDF upload, first question).
 * Fires: when free-plan user first engages with core product.
 */
export function trackStartTrial() {
  fbq("track", "StartTrial", { predicted_ltv: 0, currency: "INR", value: 0 });
}

/**
 * InitiateCheckout — user opens payment modal / clicks a paid plan CTA.
 * Fires: before the Razorpay dialog opens.
 */
export function trackInitiateCheckout() {
  fbq("track", "InitiateCheckout");
}

/**
 * Purchase — payment confirmed and subscription/credits activated.
 * Fires: inside paymentSuccess after Razorpay verify succeeds.
 *
 * @param value     Amount in primary currency units (₹299 → 299)
 * @param currency  ISO 4217 code — defaults to "INR"
 */
export function trackPurchase(value: number, currency = "INR") {
  fbq("track", "Purchase", { value, currency });
}

/**
 * Subscribe — user upgrades to a recurring paid plan.
 * Fires: alongside Purchase for subscription (not one-time credit) payments.
 *
 * @param value     Monthly price (₹299 → 299)
 * @param currency  ISO 4217 code — defaults to "INR"
 */
export function trackSubscribe(value: number, currency = "INR") {
  fbq("track", "Subscribe", {
    value,
    currency,
    predicted_ltv: value * 12, // annual LTV estimate for Meta's bidding algorithm
  });
}

/**
 * ViewContent — user views a meaningful product surface.
 * Use for PDF upload success, chat started, summary viewed, etc.
 *
 * @param contentName  Descriptive label, e.g. "PDF Uploaded", "Chat Started"
 */
export function trackViewContent(contentName: string) {
  fbq("track", "ViewContent", { content_name: contentName });
}
