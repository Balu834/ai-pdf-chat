"use client";

export default function PDFViewer({ file }) {
  if (!file) return null;

  return (
    <div>
      <div className="mb-2">
        <button
          onClick={() => window.open(file)}
          className="bg-blue-600 px-3 py-1 rounded text-sm"
        >
          Open Full PDF 🔍
        </button>
      </div>

      <iframe
        src={file}
        width="100%"
        height="600px"
        style={{ border: "none" }}
        title="PDF Viewer"
      />
    </div>
  );
}
