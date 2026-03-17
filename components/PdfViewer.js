"use client";

import { Document, Page, pdfjs } from "react-pdf";
import { useState, useEffect } from "react";

// ✅ USE LOCAL WORKER (NO CDN, NO IMPORT ISSUE)
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

export default function PdfViewer({ file }) {
  const [numPages, setNumPages] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setFileUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  function onLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  if (!fileUrl) return <p>No PDF selected</p>;

  return (
    <div style={{ height: "100%", overflowY: "auto" }}>
      <Document file={fileUrl} onLoadSuccess={onLoadSuccess}>
        {numPages &&
          Array.from(new Array(numPages), (_, i) => (
            <Page key={i} pageNumber={i + 1} width={300} />
          ))}
      </Document>
    </div>
  );
}