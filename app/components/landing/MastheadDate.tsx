"use client";
import { useEffect, useState } from "react";

export default function MastheadDate() {
  const [label, setLabel] = useState("");

  useEffect(() => {
    const d = new Date();
    const days   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    setLabel(`${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`);
  }, []);

  return <span>{label}</span>;
}
