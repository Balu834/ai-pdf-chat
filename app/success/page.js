"use client";

import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Success() {
  useEffect(() => {
    activatePro();
  }, []);

  async function activatePro() {
    const { data } = await supabase.auth.getUser();

    if (data.user) {
      await supabase
        .from("profiles")
        .update({ plan: "pro" })
        .eq("id", data.user.id);

      window.location.href = "/dashboard";
    }
  }

  return (
    <div style={{ padding: "60px" }}>
      <h2>Processing payment...</h2>
    </div>
  );
}