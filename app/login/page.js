"use client";

import { useState } from "react";
import supabase from "@/lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async () => {
    try {
      if (!email) {
        setMessage("❌ Please enter email");
        return;
      }

      const { data, error } = await supabase.auth.signInWithOtp({
        email: email,
      });

      if (error) {
        console.error(error);
        setMessage("❌ Login failed");
      } else {
        setMessage("✅ Check your email for login link");
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Something went wrong");
    }
  };

  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h1>Login</h1>

      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{
          padding: 10,
          width: "250px",
          marginBottom: "10px",
        }}
      />

      <br />

      <button
        onClick={handleLogin}
        style={{
          padding: "10px 20px",
          cursor: "pointer",
        }}
      >
        Send Magic Link
      </button>

      <p style={{ marginTop: 20 }}>{message}</p>
    </div>
  );
}