"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async (type) => {
    setLoading(true);

    let result;

    if (type === "login") {
      result = await supabase.auth.signInWithPassword({
        email,
        password
      });
    } else {
      result = await supabase.auth.signUp({
        email,
        password
      });
    }

    if (result.error) {
      alert(result.error.message);
    } else {
      alert(type === "login" ? "Login success!" : "Signup success!");
      router.push("/dashboard");
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Login / Signup</h1>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <br /><br />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <br /><br />

      <button onClick={() => handleAuth("login")}>
        Login
      </button>

      <button onClick={() => handleAuth("signup")}>
        Signup
      </button>

      {loading && <p>Loading...</p>}
    </div>
  );
}