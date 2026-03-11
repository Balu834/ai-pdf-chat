"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function Login() {

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  async function signUp() {

    const { error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error) {
      alert(error.message)
    } else {
      alert("Account created! Check your email.")
    }

  }

  async function signIn() {

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      alert(error.message)
    } else {
      window.location.href = "/dashboard"
    }

  }

  return (
    <div style={{ padding: 40 }}>

      <h2>Login</h2>

      <input
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <br /><br />

      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <br /><br />

      <button onClick={signIn}>Login</button>

      <button onClick={signUp}>Sign Up</button>

    </div>
  )

}