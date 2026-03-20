"use client";

import { useState, useEffect } from "react";
import supabase from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();

  const [file, setFile] = useState(null);
  const [pdfs, setPdfs] = useState([]);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [copyMsg, setCopyMsg] = useState("");
  const [history, setHistory] = useState([]);

  // Load PDFs
  const loadPdfs = async () => {
    const { data } = await supabase.storage.from("pdfs").list();
    if (data) setPdfs(data);
  };

  // Load chat history
  const loadHistory = async () => {
    const { data } = await supabase
      .from("chat_history")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setHistory(data);
  };

  useEffect(() => {
    loadPdfs();
    loadHistory();
  }, []);

  // Upload PDF
  const uploadPdf = async () => {
    if (!file) return alert("Select a file");

    const fileName = Date.now() + "-" + file.name;

    const { error } = await supabase.storage
      .from("pdfs")
      .upload(fileName, file);

    if (error) alert(error.message);
    else {
      alert("Uploaded!");
      setFile(null);
      loadPdfs();
    }
  };

  // Delete PDF
  const deletePdf = async (name) => {
    await supabase.storage.from("pdfs").remove([name]);
    loadPdfs();
    if (selectedPdf === name) setSelectedPdf(null);
  };

  // Ask AI
  const askQuestion = async () => {
    if (!question) return alert("Please enter a question");
    if (!selectedPdf) return alert("Select a PDF");

    setLoading(true);
    setAnswer("");

    const res = await fetch("/api/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question, pdf: selectedPdf }),
    });

    const data = await res.json();
    setAnswer(data.answer);
    setLoading(false);

    await supabase.from("chat_history").insert([
      { question, answer: data.answer },
    ]);

    loadHistory();
  };

  // Logout
  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Copy
  const copyAnswer = () => {
    navigator.clipboard.writeText(answer);
    setCopyMsg("Copied!");
    setTimeout(() => setCopyMsg(""), 2000);
  };

  const getPdfUrl = (name) => {
    const { data } = supabase.storage.from("pdfs").getPublicUrl(name);
    return data.publicUrl;
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f172a",
      padding: 20,
      color: "white",
      fontFamily: "Arial"
    }}>

      <div style={{
        maxWidth: 1000,
        margin: "auto",
        background: "#1e293b",
        padding: 20,
        borderRadius: 12
      }}>

        {/* Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 20
        }}>
          <h1>📄 AI PDF Chat</h1>
          <button onClick={logout}>Logout</button>
        </div>

        {/* Upload */}
        <div style={{ marginBottom: 20 }}>
          <input type="file" onChange={(e) => setFile(e.target.files[0])} />
          <button onClick={uploadPdf} style={{ marginLeft: 10 }}>
            Upload
          </button>
        </div>

        {/* PDF List */}
        <h3>Your PDFs</h3>
        <div style={{ marginBottom: 20 }}>
          {pdfs.map((pdf) => (
            <div key={pdf.name} style={{
              display: "flex",
              justifyContent: "space-between",
              background: "#334155",
              padding: 10,
              borderRadius: 6,
              marginBottom: 5
            }}>
              <span
                onClick={() => setSelectedPdf(pdf.name)}
                style={{ cursor: "pointer" }}
              >
                {pdf.name}
              </span>
              <button onClick={() => deletePdf(pdf.name)}>Delete</button>
            </div>
          ))}
        </div>

        {/* Preview */}
        {selectedPdf && (
          <div style={{ marginBottom: 20 }}>
            <h3>Preview</h3>
            <iframe
              src={getPdfUrl(selectedPdf)}
              width="100%"
              height="400px"
              style={{ borderRadius: 10 }}
            />
          </div>
        )}

        {/* Ask */}
        <textarea
          placeholder="Ask something about your PDF..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          style={{
            width: "100%",
            height: 100,
            borderRadius: 8,
            padding: 10,
            marginBottom: 10
          }}
        />

        <button onClick={askQuestion}>Ask</button>

        {loading && <p>🤖 AI is thinking...</p>}

        {/* Answer */}
        {answer && (
          <div style={{
            background: "#020617",
            padding: 15,
            borderRadius: 10,
            marginTop: 10
          }}>
            <strong>Answer:</strong>
            <p>{answer}</p>

            <button onClick={copyAnswer}>Copy</button>
            {copyMsg && <span style={{ marginLeft: 10 }}>{copyMsg}</span>}
          </div>
        )}

        {/* History */}
        <h3 style={{ marginTop: 30 }}>Chat History</h3>
        {history.map((item, i) => (
          <div key={i} style={{
            background: "#020617",
            padding: 10,
            borderRadius: 6,
            marginBottom: 10
          }}>
            <p><strong>Q:</strong> {item.question}</p>
            <p><strong>A:</strong> {item.answer}</p>
          </div>
        ))}

      </div>
    </div>
  );
}