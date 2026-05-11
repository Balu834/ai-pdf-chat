"use client";

import { Component } from "react";

/**
 * React error boundary — catches render/lifecycle crashes in any child tree.
 *
 * Usage (wrap any subtree you want guarded):
 *   <ErrorBoundary route="dashboard/pdf-viewer">
 *     <PDFViewer ... />
 *   </ErrorBoundary>
 *
 * On error:
 *   1. Reports to POST /api/log-error  (→ logger → Telegram/Discord/DB)
 *   2. Renders a friendly fallback with a retry button
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMsg: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMsg: error?.message ?? "Unknown error" };
  }

  componentDidCatch(error, info) {
    const route = this.props.route ?? (typeof window !== "undefined" ? window.location.pathname : "client");

    fetch("/api/log-error", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        route,
        message:  error?.message ?? "React render error",
        stack:    (error?.stack ?? "") + "\n\nComponent stack:\n" + (info?.componentStack ?? ""),
        severity: "error",
        metadata: { type: "react_error_boundary" },
      }),
    }).catch(() => {}); // never break the error boundary itself
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMsg: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { fallback } = this.props;
    if (fallback) return fallback;

    return (
      <div style={{
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
        padding:        "40px 24px",
        textAlign:      "center",
        minHeight:      200,
        background:     "rgba(239,68,68,0.05)",
        border:         "1px solid rgba(239,68,68,0.15)",
        borderRadius:   12,
      }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
        <p style={{ color: "#f87171", fontWeight: 600, marginBottom: 8 }}>
          Something went wrong
        </p>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, marginBottom: 20, maxWidth: 360 }}>
          {this.state.errorMsg ?? "An unexpected error occurred. Our team has been notified."}
        </p>
        <button
          onClick={this.handleRetry}
          style={{
            padding:      "8px 20px",
            background:   "rgba(124,58,237,0.2)",
            border:       "1px solid rgba(124,58,237,0.4)",
            borderRadius: 8,
            color:        "#a78bfa",
            cursor:       "pointer",
            fontSize:     14,
          }}
        >
          Try again
        </button>
      </div>
    );
  }
}
