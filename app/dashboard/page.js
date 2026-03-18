"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabase";

export default function Dashboard() {
  const router = useRouter();

  const [file, setFile] = useState(null);
  const [pdfText, setPdfText] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  // 🔐 Protect Dashboard
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.push("/login");
      }
    };

    checkUser();
  }, []);

  // 📜 Load chat history
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const res = await fetch("/api/chat-history");
    const data = await res.json();
    if (data.data) {
      setHistory(data.data);
    }
  };

  // 📄 Upload PDF
  const uploadPdf = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    setPdfText(data.text);
    alert("PDF uploaded successfully!");
  };

  // 🤖 Ask Question
  const askQuestion = async () => {
    if (!question) return;

    setLoading(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({
        question,
        context: pdfText,
      }),
    });

    const data = await res.json();

    setAnswer(data.answer);

    // 💾 Save to Supabase
    await fetch("/api/chat-history", {
      method: "POST",
      body: JSON.stringify({
        question,
        answer: data.answer,
      }),
    });

    setLoading(false);
    loadHistory(); // refresh history
  };

  // 🚪 Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div style={{ padding: 40, fontFamily: "Arial" }}>
      <h1>AI PDF Chat</h1>

      {/* 🚪 Logout */}
      <button onClick={handleLogout} style={{ marginBottom: 20 }}>
        Logout
      </button>

      {/* 📄 Upload */}
      <div>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <button onClick={uploadPdf}>Upload PDF</button>
      </div>

      <hr />

      {/* ❓ Ask */}
      <textarea
        placeholder="Ask something..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        style={{ width: "100%", height: 100 }}
      />

      <br />

      <button onClick={askQuestion}>Ask</button>

      {loading && <p>AI is thinking...</p>}

      {/* 🤖 Answer */}
      {answer && (
        <div>
          <h3>Answer:</h3>
          <p>{answer}</p>
        </div>
      )}

      <hr />

      {/* 📜 Chat History */}
      <h2>Chat History</h2>

      {history.map((item, i) => (
        <div key={i}>
          <p><b>Q:</b> {item.question}</p>
          <p><b>A:</b> {item.answer}</p>
          <hr />
        </div>
      ))}
    </div>
  );
}