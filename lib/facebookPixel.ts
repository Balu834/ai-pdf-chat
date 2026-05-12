/**
 * lib/facebookPixel.ts
 *
 * Meta Pixel event helpers — all fbq calls go through here.
 * Every function is SSR-safe and ad-blocker-safe (silent no-ops on failure).
 *
 * The pixel base code lives in app/layout.tsx.
 * Route-change PageView tracking lives in components/RouteAnalytics.tsx.
 *
 * Usage anywhere in the app:
 *   import { trackLead, trackPurchase } from "@/lib/facebookPixel";
 *
 * To add a new event:
 *   1. Export a new function below
 *   2. Call it from the relevant component or API callback
 */

export const PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID?.trim();

if (!PIXEL_ID && typeof window !== "undefined") {
  console.warn("[fb-pixel] NEXT_PUBLIC_FACEBOOK_PIXEL_ID is not set");
}

// ── TypeScript: tell the compiler fbq exists on window ─────────────────────
declare global {
  interface Window {
    fbq:  ((...args: unknown[]) => void) & {
      callMethod?: (...args: unknown[]) => void;
      queue?:      unknown[];
      loaded?:     boolean;
      version?:    string;
    };
    _fbq: unknown;
  }
}

/**
 * Internal safe wrapper — silently returns false when fbq is unavailable
 * (SSR, ad-blockers, or script not yet loaded).
 */
function fbq(...args: unknown[]): boolean {
  if (typeof window === "undefined") return false;
  if (typeof window.fbq !== "function") {
    console.warn("[fb-pixel] Tried to track", args[1], "but window.fbq is not loaded yet");
    return false;
  }
  console.log("[fb-pixel]", args[1], args[2] ?? "");
  try {
    window.fbq(...args);
    return true;
  } catch {
    return false;
  }
}

// ── Core ───────────────────────────────────────────────────────────────────

/**
 * pageview() — fire on every SPA route change.
 * Called automatically by RouteAnalytics; you rarely need to call this directly.
 */
export function pageview() {
  fbq("track", "PageView");
}

/**
 * event() — fire any standard or custom Meta Pixel event.
 *
 * @param name  Standard event name (e.g. "Lead") or custom (e.g. "VideoWatched")
 * @param data  Optional parameters: value, currency, content_name, etc.
 *
 * @example
 *   event("Lead");
 *   event("Purchase", { value: 299, currency: "INR" });
 */
export function event(name: string, data?: Record<string, unknown>) {
  if (data !== undefined) {
    fbq("track", name, data);
  } else {
    fbq("track", name);
  }
}

// ── Standard Conversion Events ─────────────────────────────────────────────

/**
 * trackLead() — fire when a user shows signup or purchase intent.
 *
 * Where to call:
 *   - User clicks "Start Free" or "Get Pro" on landing page
 *   - User lands on /login page from an ad
 *
 * Meta standard event: Lead
 */
export function trackLead() {
  fbq("track", "Lead");
}

/**
 * trackRegistration() — fire when a new account is successfully created.
 *
 * Where to call:
 *   - After email verification completes
 *   - After Google OAuth signup succeeds
 *
 * Meta standard event: CompleteRegistration
 */
export function trackRegistration(method?: string) {
  fbq("track", "CompleteRegistration", method ? { method } : {});
}

/** Alias kept for backwards compatibility with existing analytics.ts calls */
export const trackCompleteRegistration = trackRegistration;

/**
 * trackPDFUpload() — fire when a user successfully uploads a PDF.
 *
 * Where to call:
 *   - In the upload success handler (dashboard or chat page)
 *   - After /api/upload confirms processing
 *
 * Meta standard event: ViewContent (with content_name = "PDF Uploaded")
 */
export function trackPDFUpload(fileName?: string) {
  fbq("track", "ViewContent", {
    content_name:     "PDF Uploaded",
    content_category: "product",
    ...(fileName ? { content_ids: [fileName] } : {}),
  });
}

/** Alias kept for backwards compatibility */
export const trackViewContent = (contentName: string) =>
  fbq("track", "ViewContent", { content_name: contentName });

/**
 * trackChatStarted() — fire when a user sends their first question in a session.
 *
 * Where to call:
 *   - In the chat handler after the first message is submitted
 *   - In Events.questionAsked() in lib/analytics.ts (already wired up)
 *
 * Meta custom event: ChatStarted
 */
export function trackChatStarted() {
  fbq("track", "ViewContent", {
    content_name:     "Chat Started",
    content_category: "product",
  });
}

/**
 * trackStartTrial() — fire when a free-plan user first engages with the product.
 *
 * Where to call:
 *   - After first PDF upload
 *   - After first question asked
 *
 * Meta standard event: StartTrial
 */
export function trackStartTrial() {
  fbq("track", "StartTrial", { predicted_ltv: 0, currency: "INR", value: 0 });
}

/**
 * trackInitiateCheckout() — fire when payment modal opens.
 *
 * Where to call:
 *   - When Razorpay dialog is about to open
 *   - When user clicks "Get Pro" on pricing page (if going to payment)
 *
 * Meta standard event: InitiateCheckout
 */
export function trackInitiateCheckout() {
  fbq("track", "InitiateCheckout");
}

/**
 * trackPurchase() — fire after a successful payment is confirmed.
 *
 * Where to call:
 *   - After Razorpay verify-payment API returns success
 *
 * @param value     Amount in primary currency units (₹299 → pass 299)
 * @param currency  ISO 4217 code, default "INR"
 *
 * Meta standard event: Purchase
 */
export function trackPurchase(value: number, currency = "INR") {
  fbq("track", "Purchase", { value, currency });
}

/**
 * trackSubscribe() — fire when user starts a recurring paid plan.
 * Call alongside trackPurchase() for subscription payments.
 *
 * Meta standard event: Subscribe
 */
export function trackSubscribe(value: number, currency = "INR") {
  fbq("track", "Subscribe", {
    value,
    currency,
    predicted_ltv: value * 12,
  });
}

/**
 * trackSearch() — fire when a user submits a question in the chat.
 *
 * Where to call:
 *   - In handleSend() before the API fetch
 *
 * Meta standard event: Search
 */
export function trackSearch(searchTerm?: string) {
  if (searchTerm) {
    fbq("track", "Search", { search_string: searchTerm.slice(0, 100) });
  } else {
    fbq("track", "Search");
  }
}
