"use client";

import { useState, useEffect } from "react";
import supabase from "@/lib/supabase";

export default function Dashboard() {
  const [file, setFile] = useState(null);
  const [pdfs, setPdfs] = useState([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState([]);

  // 📥 LOAD PDFs
  const fetchPDFs = async () => {
    const { data } = await supabase.storage.from("pdfs").list();
    setPdfs(data || []);
  };

  // 📥 LOAD CHAT HISTORY
  const fetchHistory = async () => {
    const { data } = await supabase
      .from("chat_history")
      .select("*")
      .order("created_at", { ascending: false });

    setHistory(data || []);
  };

  useEffect(() => {
    fetchPDFs();
    fetchHistory();
  }, []);

  // 📤 UPLOAD PDF
  const uploadPdf = async () => {
    if (!file) return alert("Select a PDF");

    const { error } = await supabase.storage
      .from("pdfs")
      .upload(file.name, file);

    if (error) {
      alert(error.message);
    } else {
      alert("Uploaded!");
      fetchPDFs();
    }
  };

  // ❌ DELETE PDF
  const deletePdf = async (name) => {
    await supabase.storage.from("pdfs").remove([name]);
    fetchPDFs();
  };

  // 💾 SAVE CHAT
  const saveChat = async (question, answer) => {
    if (!question || !answer) return;

    const { error } = await supabase
      .from("chat_history")
      .insert([{ question, answer }]);

    if (error) {
      console.error(error.message);
    } else {
      fetchHistory();
    }
  };

  // 🤖 ASK AI
  const askQuestion = async () => {
    if (!question) return alert("Please enter a question");

    setLoading(true);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        body: JSON.stringify({ question }),
      });

      const data = await res.json();

      setAnswer(data.answer);

      // ✅ SAVE TO SUPABASE
      await saveChat(question, data.answer);
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  // 📋 COPY
  const copyText = () => {
    navigator.clipboard.writeText(answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "40px auto",
        padding: 20,
        color: "white",
        fontFamily: "Arial",
      }}
    >
      <h1>📄 AI PDF Chat</h1>

      {/* 📤 Upload */}
      <div style={{ marginBottom: 20 }}>
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        <button onClick={uploadPdf} style={{ marginLeft: 10 }}>
          Upload
        </button>
      </div>

      {/* 📂 PDF LIST */}
      <h3>Your PDFs</h3>
      {pdfs.map((pdf) => (
        <div key={pdf.name} style={{ marginBottom: 5 }}>
          {pdf.name}
          <button
            onClick={() => deletePdf(pdf.name)}
            style={{ marginLeft: 10 }}
          >
            Delete
          </button>
        </div>
      ))}

      {/* ❓ QUESTION */}
      <textarea
        placeholder="Ask something about your PDF..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        style={{
          width: "100%",
          height: 100,
          marginTop: 20,
          padding: 10,
        }}
      />

      <button onClick={askQuestion} style={{ marginTop: 10 }}>
        Ask
      </button>

      {/* ⏳ LOADING */}
      {loading && <p>AI is thinking...</p>}

      {/* 💬 ANSWER */}
      {answer && (
        <div
          style={{
            background: "#222",
            padding: 15,
            borderRadius: 10,
            marginTop: 10,
          }}
        >
          <p>{answer}</p>
          <button onClick={copyText}>Copy</button>
          {copied && <span style={{ marginLeft: 10 }}>Copied!</span>}
        </div>
      )}

      {/* 🕘 HISTORY */}
      <h3 style={{ marginTop: 30 }}>Chat History</h3>
      {history.map((chat) => (
        <div
          key={chat.id}
          style={{
            background: "#111",
            padding: 10,
            marginTop: 10,
            borderRadius: 8,
          }}
        >
          <p>
            <b>Q:</b> {chat.question}
          </p>
          <p>
            <b>A:</b> {chat.answer}
          </p>
        </div>
      ))}
    </div>
  );
}