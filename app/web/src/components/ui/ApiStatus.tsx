"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type Status = "checking" | "online" | "offline";

export function ApiStatus() {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        await fetch(`${API_URL}/`, {
          method: "GET",
          signal: AbortSignal.timeout(5000),
        });
        if (!cancelled) setStatus("online");
      } catch {
        if (!cancelled) setStatus("offline");
      }
    }

    check();
    const id = setInterval(check, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (status === "checking") return null;

  return (
    <div className="flex items-center gap-2">
      <span
        className={`w-2 h-2 rounded-full ${
          status === "online" ? "bg-green-500 animate-pulse" : "bg-red-500"
        }`}
      />
      <span className="font-mono text-xs font-bold uppercase tracking-widest text-subtle">
        Authentication server: {status}
      </span>
    </div>
  );
}
