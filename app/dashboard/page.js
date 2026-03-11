"use client"

import { useState, useEffect } from "react"

export default function Dashboard() {

  const [file, setFile] = useState(null)
  const [documents, setDocuments] = useState([])
  const [selectedDoc, setSelectedDoc] = useState(null)

  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")

  useEffect(() => {
    loadDocuments()
  }, [])

  async function loadDocuments() {

    const res = await fetch("/api/documents")
    const data = await res.json()

    setDocuments(data.documents || [])
  }

  async function uploadFile() {

    if (!file) {
      alert("Please select a PDF")
      return
    }

    const formData = new FormData()
    formData.append("file", file)
    formData.append("userId", "demo-user")

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData
    })

    const data = await res.json()

    if (data.success) {
      alert("PDF uploaded")
      loadDocuments()
    } else {
      alert("Upload failed")
    }

  }

  async function askQuestion() {

    if (!question) return

    const res = await fetch("/api/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        question
      })
    })

    const data = await res.json()

    setAnswer(data.answer)
  }

  return (
    <div style={{ display: "flex", height: "100vh" }}>

      {/* LEFT PANEL */}

      <div style={{
        width: "250px",
        borderRight: "1px solid #ccc",
        padding: "20px"
      }}>

        <h2>AI PDF Chat</h2>

        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
        />

        <button onClick={uploadFile}>
          Upload
        </button>

        <h3 style={{ marginTop: "20px" }}>
          Your Documents
        </h3>

        {documents.length === 0 ? (
          <p>No documents yet</p>
        ) : (
          documents.map((doc, i) => (
            <div
              key={i}
              style={{
                padding: "5px",
                cursor: "pointer"
              }}
              onClick={() => setSelectedDoc(doc)}
            >
              {doc.name}
            </div>
          ))
        )}

      </div>

      {/* CHAT AREA */}

      <div style={{ flex: 1, padding: "20px" }}>

        <h2>
          Chat with: {selectedDoc ? selectedDoc.name : "Select a PDF"}
        </h2>

        <div style={{
          border: "1px solid #ccc",
          height: "400px",
          marginBottom: "20px",
          padding: "10px"
        }}>

          <b>Answer:</b>

          <p>{answer}</p>

        </div>

        <input
          style={{ width: "80%" }}
          placeholder="Ask about this PDF..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />

        <button onClick={askQuestion}>
          Ask
        </button>

      </div>

    </div>
  )

}