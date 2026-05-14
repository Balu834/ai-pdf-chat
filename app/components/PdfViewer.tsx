"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Served from /public — works with worker-src 'self'
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

export interface PdfViewerHandle {
  prevPage: () => void;
  nextPage: () => void;
  pageInfo: { current: number; total: number };
}

interface Props {
  url: string;
  onPageChange?: (page: number, total: number) => void;
}

type PDFDocumentProxy = { numPages: number };

export default function PdfViewer({ url, onPageChange }: Props) {
  const [numPages, setNumPages]     = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale]           = useState(1.0);
  const [fitWidth, setFitWidth]     = useState(600);
  const [loadError, setLoadError]   = useState<string | null>(null);
  const [retryKey, setRetryKey]     = useState(0);
  const [pageReady, setPageReady]   = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Measure container to auto-fit PDF width
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setFitWidth(containerRef.current.clientWidth - 32);
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const handleDocLoad = useCallback(
    ({ numPages: n }: PDFDocumentProxy) => {
      setNumPages(n);
      setLoadError(null);
      setPageNumber(1);
      onPageChange?.(1, n);
    },
    [onPageChange]
  );

  const handleDocError = useCallback((err: Error) => {
    setLoadError(err?.message ?? "Failed to load PDF");
  }, []);

  const handlePageLoad = useCallback(() => {
    setPageReady(true);
  }, []);

  const goto = useCallback(
    (n: number) => {
      const clamped = Math.max(1, Math.min(numPages, n));
      setPageNumber(clamped);
      setPageReady(false);
      onPageChange?.(clamped, numPages);
      containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    },
    [numPages, onPageChange]
  );

  const zoomIn  = () => setScale((s) => Math.min(+(s + 0.25).toFixed(2), 3));
  const zoomOut = () => setScale((s) => Math.max(+(s - 0.25).toFixed(2), 0.5));
  const resetZoom = () => setScale(1.0);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goto(pageNumber + 1);
      if (e.key === "ArrowLeft"  || e.key === "ArrowUp")   goto(pageNumber - 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [pageNumber, goto]);

  if (loadError) {
    return (
      <div className="pvw-error-state">
        <div className="pvw-error-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div className="pvw-error-title">Failed to load PDF</div>
        <div className="pvw-error-detail">{loadError}</div>
        <button
          className="pvw-retry-btn"
          onClick={() => { setLoadError(null); setRetryKey((k) => k + 1); }}
        >
          Try again
        </button>
      </div>
    );
  }

  const effectiveWidth = fitWidth * scale;

  return (
    <div className="pvw-root">
      {/* Controls bar */}
      <div className="pvw-controls">
        <div className="pvw-ctrl-group">
          <button className="pvw-ctrl-btn" onClick={zoomOut} disabled={scale <= 0.5} title="Zoom out">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <line x1="2" y1="7" x2="12" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          <button className="pvw-ctrl-zoom-label" onClick={resetZoom} title="Reset zoom">
            {Math.round(scale * 100)}%
          </button>
          <button className="pvw-ctrl-btn" onClick={zoomIn} disabled={scale >= 3} title="Zoom in">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <line x1="7" y1="2" x2="7" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="2" y1="7" x2="12" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="pvw-page-group">
          <button className="pvw-ctrl-btn" onClick={() => goto(pageNumber - 1)} disabled={pageNumber <= 1} title="Previous page (←)">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <span className="pvw-page-label">
            {numPages > 0 ? `${pageNumber} / ${numPages}` : "—"}
          </span>
          <button className="pvw-ctrl-btn" onClick={() => goto(pageNumber + 1)} disabled={pageNumber >= numPages || numPages === 0} title="Next page (→)">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 11l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* PDF scroll area */}
      <div className="pvw-scroll" ref={containerRef}>
        <Document
          key={retryKey}
          file={url}
          onLoadSuccess={handleDocLoad}
          onLoadError={handleDocError}
          loading={<PdfLoadSkeleton />}
          error={<span />}
        >
          {/* Invisible skeleton shown while page canvas renders */}
          {!pageReady && numPages > 0 && (
            <div className="pvw-page-loading-overlay">
              <div className="pvw-spinner" />
            </div>
          )}
          <Page
            key={`page-${pageNumber}-${retryKey}`}
            pageNumber={pageNumber}
            width={effectiveWidth}
            renderTextLayer
            renderAnnotationLayer
            onRenderSuccess={handlePageLoad}
            className="pvw-page-canvas"
          />
        </Document>
      </div>
    </div>
  );
}

function PdfLoadSkeleton() {
  return (
    <div className="pvw-doc-skeleton">
      {[100, 60, 85, 70, 90, 55, 80, 65, 75, 40].map((w, i) => (
        <div
          key={i}
          className="pvw-skeleton-line"
          style={{ width: `${w}%`, animationDelay: `${i * 0.06}s` }}
        />
      ))}
    </div>
  );
}
