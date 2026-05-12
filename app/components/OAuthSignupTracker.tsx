"use client";
import { useEffect, useRef }                        from "react";
import { useRouter, useSearchParams, usePathname }  from "next/navigation";
import { trackRegistration }                        from "@/lib/facebookPixel";

/**
 * Fires Meta Pixel CompleteRegistration("google") exactly once when the user
 * lands on the dashboard with ?welcome=1 (set by app/auth/callback/route.js
 * when it detects a first-time OAuth signup), then strips the param so that a
 * page refresh never double-fires.
 *
 * Must be rendered inside <Suspense fallback={null}> — useSearchParams()
 * requires a Suspense boundary in the Next.js App Router.
 */
export default function OAuthSignupTracker() {
  const params   = useSearchParams();
  const router   = useRouter();
  const pathname = usePathname();
  // Ref guard prevents double-firing in React 18 StrictMode (effects run twice
  // in dev; the second invocation sees the same captured `params` snapshot).
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    if (params.get("welcome") !== "1") return;

    fired.current = true;
    trackRegistration("google");

    // Strip ?welcome=1 without a full navigation so refresh never re-fires
    const clean = new URLSearchParams(params.toString());
    clean.delete("welcome");
    const qs = clean.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // empty deps: run once on mount with the initial params snapshot

  return null;
}
