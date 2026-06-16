"use client";

import { useEffect, useState } from "react";
import { FOOTBALL_FACTS } from "@/lib/facts";

// Rotating "did you know?" football-fact banner. Starts from a server-provided
// index (no hydration mismatch) and advances every few seconds.
export function FactBanner({ startIndex = 0 }: { startIndex?: number }) {
  const [i, setI] = useState(startIndex % FOOTBALL_FACTS.length);

  useEffect(() => {
    const id = setInterval(() => {
      setI((prev) => (prev + 1) % FOOTBALL_FACTS.length);
    }, 7000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="card flex items-center gap-3 border-accent/20 bg-accent/5 px-4 py-3">
      <span aria-hidden className="text-lg">⚽️</span>
      <p className="text-sm text-slate-200">
        <span className="mr-2 text-xs font-semibold uppercase tracking-wide text-accent">
          Football fact
        </span>
        {FOOTBALL_FACTS[i]}
      </p>
    </div>
  );
}
