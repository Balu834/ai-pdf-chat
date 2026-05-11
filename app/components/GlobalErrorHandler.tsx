"use client";

/**
 * GlobalErrorHandler — mounts window-level error listeners.
 *
 * Captures:
 *   - window.onerror          (uncaught JS exceptions)
 *   - window.onunhandledrejection  (unhandled Promise rejections)
 *
 * Reports all caught errors to POST /api/log-error.
 * Place <GlobalErrorHandler /> once inside the root layout.
 * Renders nothing — purely a side-effect component.
 */

import { useEffect } from "react";

function report(payload: {
  route: string;
  message: string;
  stack?: string;
  severity: string;
  metadata?: Record<string, unknown>;
}) {
  // Navigator.sendBeacon is preferred — fires even during page unload
  const body = JSON.stringify(payload);
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    navigator.sendBeacon("/api/log-error", new Blob([body], { type: "application/json" }));
  } else {
    fetch("/api/log-error", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  }
}

export default function GlobalErrorHandler() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const msg = event.message ?? "Unknown window error";

      // Filter out browser extensions and cross-origin script errors
      if (msg === "Script error." || msg.includes("extension://")) return;

      report({
        route:    typeof window !== "undefined" ? window.location.pathname : "window",
        message:  msg,
        stack:    event.error?.stack ?? undefined,
        severity: "error",
        metadata: {
          type:     "window_error",
          filename: event.filename,
          lineno:   event.lineno,
          colno:    event.colno,
        },
      });
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const msg    = reason instanceof Error
        ? reason.message
        : typeof reason === "string"
          ? reason
          : "Unhandled promise rejection";

      // Suppress AbortError (user-initiated navigation cancellations)
      if (reason?.name === "AbortError") return;

      report({
        route:    typeof window !== "undefined" ? window.location.pathname : "window",
        message:  msg,
        stack:    reason instanceof Error ? reason.stack : undefined,
        severity: "error",
        metadata: {
          type:   "unhandled_rejection",
          reason: typeof reason === "string" ? reason : undefined,
        },
      });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return null;
}
