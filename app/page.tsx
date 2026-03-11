export default function Home() {
  return (
    <div style={{ padding: "80px", textAlign: "center" }}>
      <h1>🧠 PDFMind AI</h1>
      <p>Chat with your PDF documents using AI.</p>

      <div style={{ display: "flex", justifyContent: "center", gap: "40px", marginTop: "50px" }}>
        <div style={card}>
          <h2>Free</h2>
          <p>10 Questions / month</p>
          <h3>$0</h3>
        </div>

        <div style={{ ...card, border: "2px solid #6366f1" }}>
          <h2>Pro</h2>
          <p>Unlimited Questions</p>
          <h3>$9/month</h3>
        </div>
      </div>
    </div>
  );
}

const card = {
  background: "white",
  padding: "40px",
  borderRadius: "16px",
  width: "250px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
};