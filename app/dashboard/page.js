"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

const PdfViewer = dynamic(() => import("@/components/PdfViewer"), {
  ssr: false,
});

export default function Dashboard() {
  const [file, setFile] = useState(null);
  const [pdfText, setPdfText] = useState("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState([]);

  const [pdfs, setPdfs] = useState([]);
  const [selectedPdf, setSelectedPdf] = useState(null);

  const [copiedIndex, setCopiedIndex] = useState(null);

  // ✅ Upload PDF
  const uploadPdf = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    const newPdf = {
      name: file.name,
      text: data.text,
      file: file,
    };

    setPdfs((prev) => [...prev, newPdf]);
    setSelectedPdf(newPdf);
    setPdfText(data.text);
  };

  // ❌ Delete PDF
  const deletePdf = (name) => {
    const updated = pdfs.filter((p) => p.name !== name);
    setPdfs(updated);

    if (selectedPdf?.name === name) {
      setSelectedPdf(null);
      setPdfText("");
    }
  };

  // ✅ Send Message (SAFE)
  const sendMessage = async () => {
    if (!input || !pdfText) return;

    const newMessage = { role: "user", text: input };
    const updatedChat = [...currentChat, newMessage];

    setCurrentChat(updatedChat);
    setInput("");
    setLoading(true);

    const res = await fetch("/api/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: input,
        context: pdfText,
      }),
    });

    const data = await res.json();

    const aiMessage = { role: "ai", text: "" };
    setCurrentChat((prev) => [...prev, aiMessage]);

    let aiText = "";

    for (let char of data.answer) {
      aiText += char;
      await new Promise((r) => setTimeout(r, 10));

      setCurrentChat((prev) => {
        const updated = [...prev];
        updated[updated.length - 1].text = aiText;
        return updated;
      });
    }

    setChats((prev) => [...prev, [...updatedChat, { role: "ai", text: aiText }]]);
    setLoading(false);
  };

  // 📋 Copy
  const copyText = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>

      {/* SIDEBAR */}
      <div style={{ width: 260, background: "#202123", color: "white", padding: 10 }}>
        <h2>📂 PDFs</h2>

        {pdfs.map((pdf, i) => (
          <div key={i} style={{
            display: "flex",
            justifyContent: "space-between",
            background: selectedPdf?.name === pdf.name ? "#444" : "transparent",
            padding: 8,
            marginBottom: 5,
            borderRadius: 6
          }}>
            <span onClick={() => {
              setSelectedPdf(pdf);
              setPdfText(pdf.text);
            }}>
              {pdf.name}
            </span>

            <button onClick={() => deletePdf(pdf.name)}>❌</button>
          </div>
        ))}

        <hr />

        <h2>💬 Chats</h2>

        <button onClick={() => setCurrentChat([])}>+ New Chat</button>

        {chats.map((chat, i) => (
          <div key={i} onClick={() => setCurrentChat(chat)}>
            Chat {i + 1}
          </div>
        ))}
      </div>

      {/* PDF VIEW */}
      <div style={{ width: "30%", borderRight: "1px solid #ddd", padding: 10 }}>
        {selectedPdf ? (
          <PdfViewer file={selectedPdf.file} />
        ) : (
          <div style={{ textAlign: "center", marginTop: 50 }}>
            <h2>📄 Upload a PDF to start</h2>
            <p>Ask questions, summarize, extract info instantly</p>
          </div>
        )}
      </div>

      {/* CHAT AREA */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

        {/* HEADER */}
        <div style={{
          padding: 15,
          fontSize: 24,
          fontWeight: "bold",
          borderBottom: "1px solid #ddd"
        }}>
          AI PDF Chat 🚀
        </div>

        {/* Upload */}
        <div style={{ padding: 10 }}>
          <input type="file" onChange={(e) => setFile(e.target.files[0])} />
          <button onClick={uploadPdf}>Upload</button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {currentChat.map((msg, i) => (
            <div key={i} style={{
              textAlign: msg.role === "user" ? "right" : "left",
              marginBottom: 10
            }}>
              <div style={{
                display: "inline-block",
                background: msg.role === "user" ? "#007bff" : "#eee",
                color: msg.role === "user" ? "white" : "black",
                padding: 10,
                borderRadius: 10,
                maxWidth: "70%",
                position: "relative"
              }}>
                {msg.text}

                {msg.role === "ai" && (
                  <div style={{ marginTop: 5 }}>
                    <button onClick={() => copyText(msg.text, i)}>
                      📋 Copy
                    </button>
                  </div>
                )}

                {copiedIndex === i && (
                  <div style={{
                    position: "absolute",
                    top: -25,
                    right: 0,
                    background: "black",
                    color: "white",
                    padding: "3px 8px",
                    borderRadius: 6,
                    fontSize: 12
                  }}>
                    Copied!
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* AI Thinking */}
          {loading && (
            <div style={{ color: "gray" }}>
              AI is thinking<span className="dots"></span>
            </div>
          )}
        </div>

        {/* INPUT */}
        <div style={{ padding: 10 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your PDF anything..."
            style={{ width: "80%" }}
          />

          {/* ✅ FIXED BUTTON */}
          <button
            disabled={!input || !pdfText}
            onClick={sendMessage}
          >
            Send
          </button>
        </div>

      </div>
    </div>
  );
}