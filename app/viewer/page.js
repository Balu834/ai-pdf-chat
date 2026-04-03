"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function PDFViewerContent() {
  const searchParams = useSearchParams();
  const fileUrl = searchParams.get("url");

  if (!fileUrl) return <p>No PDF URL provided.</p>;

  return (
    <div>
      <iframe
        src={fileUrl}
        width="100%"
        height="800px"
        style={{ border: "none" }}
        title="PDF Viewer"
      />
    </div>
  );
}

export default function ViewerPage() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <PDFViewerContent />
    </Suspense>
  );
}
