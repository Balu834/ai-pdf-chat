"use client";

/**
 * app/components/ErrorBoundary.tsx
 *
 * React Error Boundary — catches render/lifecycle crashes in any child subtree.
 *
 * Usage:
 *   <ErrorBoundary route="dashboard/pdf-viewer">
 *     <PDFViewer />
 *   </ErrorBoundary>
 *
 * On error:
 *   1. Reports to POST /api/log-error via navigator.sendBeacon (survives unload).
 *   2. Shows branded fallback UI with route context and retry button.
 *
 * Suspense-safe: place this boundary outside React.Suspense so it catches
 * both render errors and errors that occur after lazy loading.
 */

import { Component, type ReactNode, type ErrorInfo } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  children:   ReactNode;
  /** Route name sent in the error report. Defaults to window.location.pathname. */
  route?:     string;
  /** Custom fallback UI. If omitted, the default branded fallback is shown. */
  fallback?:  ReactNode;
}

interface State {
  hasError: boolean;
  message:  string | null;
  traceId:  string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function reportError(body: Record<string, unknown>): void {
  const json = JSON.stringify(body);
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    // sendBeacon fires even during page unload — preferred method
    navigator.sendBeacon(
      "/api/log-error",
      new Blob([json], { type: "application/json" })
    );
  } else {
    fetch("/api/log-error", {
      method:    "POST",
      headers:   { "Content-Type": "application/json" },
      body:      json,
      keepalive: true,
    }).catch(() => {}); // never throw inside error boundary
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: null, traceId: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message:  error?.message ?? "An unexpected error occurred",
      traceId:  generateId(),
    };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    const route   = this.props.route
      ?? (typeof window !== "undefined" ? window.location.pathname : "client");
    const traceId = this.state.traceId ?? generateId();

    reportError({
      route,
      message:  error?.message ?? "React render crash",
      stack:    (error?.stack ?? "") + "\n\nComponent stack:\n" + (info?.componentStack ?? ""),
      severity: "error",
      traceId,
      metadata: { type: "react_error_boundary" },
    });
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, message: null, traceId: null });
  };

  override render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback)  return this.props.fallback;

    return (
      <div
        role="alert"
        style={{
          display:        "flex",
          flexDirection:  "column",
          alignItems:     "center",
          justifyContent: "center",
          padding:        "48px 24px",
          textAlign:      "center",
          minHeight:      260,
          background:     "rgba(239,68,68,0.04)",
          border:         "1px solid rgba(239,68,68,0.15)",
          borderRadius:   16,
          gap:            0,
        }}
      >
        {/* Icon */}
        <div
          style={{
            width:          48,
            height:         48,
            borderRadius:   "50%",
            background:     "rgba(239,68,68,0.1)",
            border:         "1px solid rgba(239,68,68,0.2)",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            fontSize:       22,
            marginBottom:   16,
          }}
        >
          ⚠️
        </div>

        {/* Title */}
        <h3
          style={{
            color:      "#f87171",
            fontWeight: 700,
            fontSize:   15,
            margin:     "0 0 8px",
            fontFamily: "inherit",
          }}
        >
          Something went wrong
        </h3>

        {/* Message */}
        <p
          style={{
            color:      "rgba(255,255,255,0.4)",
            fontSize:   13,
            lineHeight: 1.6,
            maxWidth:   400,
            margin:     "0 0 6px",
            fontFamily: "inherit",
          }}
        >
          {this.state.message}
        </p>

        {/* Trace ID */}
        {this.state.traceId && (
          <p
            style={{
              color:      "rgba(255,255,255,0.2)",
              fontSize:   11,
              fontFamily: "monospace",
              margin:     "0 0 24px",
            }}
          >
            Trace: {this.state.traceId}
          </p>
        )}

        {/* Retry button */}
        <button
          type="button"
          onClick={this.handleRetry}
          style={{
            padding:      "9px 22px",
            background:   "rgba(124,58,237,0.15)",
            border:       "1px solid rgba(124,58,237,0.35)",
            borderRadius: 8,
            color:        "#a78bfa",
            cursor:       "pointer",
            fontSize:     14,
            fontWeight:   600,
            fontFamily:   "inherit",
            transition:   "background 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget).style.background = "rgba(124,58,237,0.28)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget).style.background = "rgba(124,58,237,0.15)";
          }}
        >
          Try again
        </button>
      </div>
    );
  }
}
