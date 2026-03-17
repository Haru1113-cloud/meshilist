"use client";
import { useEffect, useState } from "react";

export default function MyIdPage() {
  const [id, setId] = useState("");
  useEffect(() => {
    let stored = localStorage.getItem("meshilist_device_id");
    if (!stored) {
      stored = crypto.randomUUID();
      localStorage.setItem("meshilist_device_id", stored);
    }
    setId(stored);
  }, []);

  return (
    <div style={{ padding: 32, fontFamily: "monospace", fontSize: 14 }}>
      <p>Device ID:</p>
      <p style={{ wordBreak: "break-all", background: "#f0f0f0", padding: 12, borderRadius: 8 }}>{id}</p>
    </div>
  );
}
