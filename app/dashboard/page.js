"use client";

import { useState, useEffect, useRef } from "react";

export default function Dashboard() {
  const [docs, setDocs] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);

  const chatEndRef = useRef(null);

  // 📚 Fetch docs
  const fetchDocs = async () => {
    const res = await fetch("/api/docs");
    const data = await res.json();
    setDocs(data || []);
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  // auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 📤 Upload
  const handleUpload = async () => {
    if (!selectedFile) return alert("Choose file");

    const formData = new FormData();
    formData.append("file", selectedFile);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (data.url) {
      await fetchDocs();

      setSelectedDoc({
        name: selectedFile.name,
        file_url: data.url,
      });

      setSelectedFile(null);
      alert("Uploaded!");
    }
  };

  // 💬 Chat
  const handleAsk = async () => {
    if (!selectedDoc) return alert("Select PDF");
    if (!input) return;

    const userMsg = { role: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: input,
        fileUrl: selectedDoc.file_url,
      }),
    });

    const data = await res.json();

    setMessages((prev) => [
      ...prev,
      { role: "ai", text: data.answer || "Error" },
    ]);

    setInput("");
  };

  // 🗑 Delete
  const handleDelete = async (doc) => {
    const res = await fetch("/api/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: doc.id,
        fileUrl: doc.file_url,
      }),
    });

    const data = await res.json();

    if (data.success) {
      fetchDocs();
      if (selectedDoc?.id === doc.id) {
        setSelectedDoc(null);
        setMessages([]);
      }
    } else {
      alert("Delete failed");
      console.error(data);
    }
  };

  // copy
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied!");
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0f172a", color: "white" }}>
      
      {/* SIDEBAR */}
      <div style={{ width: "260px", padding: "15px", borderRight: "1px solid #1e293b" }}>
        <h3>📄 PDFs</h3>

        {/* FILE INPUT (HYDRATION SAFE) */}
        <input
          type="file"
          accept="application/pdf"
          suppressHydrationWarning
          autoComplete="off"
          onChange={(e) => setSelectedFile(e.target.files[0])}
        />

        <button
          onClick={handleUpload}
          style={{
            marginTop: "5px",
            width: "100%",
            background: "#2563eb",
            padding: "10px",
            border: "none",
            borderRadius: "8px",
            color: "white",
          }}
        >
          Upload PDF
        </button>

        {/* LIST */}
        <div style={{ marginTop: "15px" }}>
          {docs.map((doc) => (
            <div
              key={doc.id}
              style={{
                padding: "10px",
                background: selectedDoc?.id === doc.id ? "#1e293b" : "#020617",
                borderRadius: "8px",
                marginBottom: "10px",
              }}
            >
              <p
                onClick={() => {
                  setSelectedDoc(doc);
                  setMessages([]);
                }}
                style={{ cursor: "pointer" }}
              >
                📄 {doc.name}
              </p>

              <button
                onClick={() => handleDelete(doc)}
                style={{
                  background: "#dc2626",
                  border: "none",
                  padding: "5px",
                  borderRadius: "5px",
                  color: "white",
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "20px" }}>
        <h2>AI PDF Chat</h2>

        {/* PREVIEW */}
        {selectedDoc && (
          <iframe
            src={selectedDoc.file_url}
            width="100%"
            height="250px"
          />
        )}

        {/* CHAT */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ margin: "10px 0" }}>
              <div
                style={{
                  background: msg.role === "user" ? "#2563eb" : "#334155",
                  padding: "10px",
                  borderRadius: "10px",
                }}
              >
                {msg.text}

                {msg.role === "ai" && (
                  <button onClick={() => handleCopy(msg.text)}>
                    Copy
                  </button>
                )}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* INPUT (HYDRATION SAFE) */}
        <div style={{ display: "flex" }}>
          <input
            suppressHydrationWarning
            autoComplete="off"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your PDF..."
            style={{ flex: 1, padding: "10px" }}
          />

          <button onClick={handleAsk}>Send</button>
        </div>
      </div>
    </div>
  );
}