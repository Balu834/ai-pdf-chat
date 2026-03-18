"use client";

import { useState, useEffect } from "react";
import supabase from "@/lib/supabase";

export default function Dashboard() {
  const [file, setFile] = useState(null);
  const [pdfText, setPdfText] = useState("");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // 📥 LOAD OLD CHATS (STEP 8)
  useEffect(() => {
    const loadChats = async () => {
      const { data } = await supabase
        .from("chats")
        .select("*")
        .order("created_at", { ascending: true });

      if (data) {
        setMessages(
          data.map((msg) => ({
            role: msg.role,
            content: msg.message,
          }))
        );
      }
    };

    loadChats();
  }, []);

  // 📤 Upload PDF
  const uploadPdf = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("pdf", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setPdfText(data.text);
    setSelectedPdf(file.name);
  };

  // 💬 SEND MESSAGE (STEP 7 INCLUDED)
  const sendMessage = async () => {
    if (!input || !pdfText) return;

    const userMessage = input;

    const newMessages = [
      ...messages,
      { role: "user", content: userMessage },
    ];

    setMessages(newMessages);
    setInput("");
    setLoading(true);

    // ✅ SAVE USER MESSAGE
    await supabase.from("chats").insert([
      { message: userMessage, role: "user" },
    ]);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: userMessage, pdfText }),
    });

    const data = await res.json();

    const aiMessage = data.reply;

    setMessages([
      ...newMessages,
      { role: "assistant", content: aiMessage },
    ]);

    // ✅ SAVE AI MESSAGE
    await supabase.from("chats").insert([
      { message: aiMessage, role: "assistant" },
    ]);

    setLoading(false);
  };

  // 📋 COPY
  const copyText = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);

    setTimeout(() => {
      setCopiedIndex(null);
    }, 1500);
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "Arial" }}>
      
      {/* Sidebar */}
      <div
        style={{
          width: 250,
          background: "#1e1e1e",
          color: "white",
          padding: 20,
        }}
      >
        <h2>📁 PDFs</h2>

        {selectedPdf && (
          <div
            style={{
              background: "#333",
              padding: 10,
              borderRadius: 8,
              marginBottom: 20,
            }}
          >
            {selectedPdf}
          </div>
        )}

        <hr />

        <h3>💬 Chats</h3>
        <button
          style={{
            padding: 8,
            borderRadius: 6,
            border: "none",
            cursor: "pointer",
          }}
        >
          + New Chat
        </button>
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: 20 }}>
        <h1>AI PDF Chat 🚀</h1>

        {/* Upload */}
        <div style={{ marginBottom: 20 }}>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
          />
          <button onClick={uploadPdf} style={{ marginLeft: 10 }}>
            Upload
          </button>
        </div>

        {/* EMPTY STATE */}
        {!selectedPdf && (
          <div style={{ textAlign: "center", marginTop: 50 }}>
            <h2>📄 Upload a PDF to start</h2>
            <p>Ask questions, summarize, extract info instantly</p>
          </div>
        )}

        {/* Messages */}
        <div
          style={{
            marginTop: 20,
            maxHeight: "60vh",
            overflowY: "auto",
          }}
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                marginBottom: 15,
                textAlign: msg.role === "user" ? "right" : "left",
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  padding: 12,
                  borderRadius: 10,
                  background:
                    msg.role === "user" ? "#0070f3" : "#eee",
                  color:
                    msg.role === "user" ? "white" : "black",
                  maxWidth: "70%",
                }}
              >
                {msg.content}

                {/* COPY BUTTON */}
                {msg.role === "assistant" && (
                  <div
                    onClick={() => copyText(msg.content, i)}
                    style={{
                      marginTop: 8,
                      fontSize: 12,
                      cursor: "pointer",
                      opacity: 0.7,
                    }}
                  >
                    {copiedIndex === i
                      ? "✅ Copied!"
                      : "📋 Copy"}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* LOADING */}
          {loading && (
            <div style={{ color: "gray" }}>
              AI is thinking<span className="dots"></span>
            </div>
          )}
        </div>

        {/* Input */}
        <div
          style={{
            position: "fixed",
            bottom: 20,
            left: 270,
            right: 20,
            display: "flex",
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your PDF anything..."
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 8,
              border: "1px solid #ccc",
            }}
          />

          {/* FIXED SEND BUTTON */}
          <button
            disabled={!input || !pdfText}
            onClick={sendMessage}
            style={{
              marginLeft: 10,
              padding: "12px 20px",
              borderRadius: 8,
              border: "none",
              background:
                !input || !pdfText ? "#ccc" : "#0070f3",
              color: "white",
              cursor:
                !input || !pdfText
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}