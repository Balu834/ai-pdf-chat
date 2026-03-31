"use client";

import { Document, Page, pdfjs } from "react-pdf";
import { useState } from "react";

pdfjs.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

export default function PDFViewer({ file }) {
  const [numPages, setNumPages] = useState(null);

  return (
    <div>
      {/* 🔥 OPEN FULL PDF BUTTON */}
      <div className="mb-2">
        <button
          onClick={() => window.open(file)}
          className="bg-blue-600 px-3 py-1 rounded text-sm"
        >
          Open Full PDF 🔍
        </button>
      </div>

      <Document
        file={file}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        onLoadError={(err) => console.error("PDF ERROR:", err)}
      >
        {/* 🔥 ONLY SHOW FIRST 2 PAGES */}
        {numPages &&
          Array.from(new Array(Math.min(numPages, 2)), (_, i) => (
            <Page key={i} pageNumber={i + 1} />
          ))}
      </Document>
    </div>
  );
}