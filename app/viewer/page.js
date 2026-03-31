"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

// ✅ Disable SSR
const Document = dynamic(
  () => import("react-pdf").then((mod) => mod.Document),
  { ssr: false }
);

const Page = dynamic(
  () => import("react-pdf").then((mod) => mod.Page),
  { ssr: false }
);

// ✅ Worker fix
import { pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

export default function PDFViewer({ fileUrl }) {
  const [numPages, setNumPages] = useState(null);

  function onLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  return (
    <div>
      <Document file={fileUrl} onLoadSuccess={onLoadSuccess}>
        {numPages &&
          Array.from(new Array(numPages), (_, i) => (
            <Page key={i} pageNumber={i + 1} />
          ))}
      </Document>
    </div>
  );
}