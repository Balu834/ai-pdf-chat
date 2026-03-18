"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    router.push("/dashboard");
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: 100 }}>
      Loading dashboard...
    </div>
  );
}