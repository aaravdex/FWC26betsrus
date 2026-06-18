"use client";

import { useEffect, useState } from "react";
import { FOOTBALL_FACTS } from "@/lib/facts";

// Rotating "did you know?" football-fact banner. Starts from a server-provided
// index (no hydration mismatch) and advances every few seconds with a fade.
export function FactBanner({ startIndex = 0 }: { startIndex?: number }) {
  const [i, setI] = useState(startIndex % FOOTBALL_FACTS.length);
  const [show, setShow] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setShow(false);
      setTimeout(() => {
        setI((prev) => (prev + 1) % FOOTBALL_FACTS.length);
        setShow(true);
      }, 250);
    }, 8000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="card flex items-center gap-4 px-5 py-4">
      <span
        aria-hidden
        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold/10 text-lg ring-1 ring-gold/25"
      >
        ⚽
      </span>
      <p
        className={`text-sm leading-relaxed text-slate-200 transition-opacity duration-250 ${
          show ? "opacity-100" : "opacity-0"
        }`}
      >
        <span className="mr-2 text-[11px] font-semibold uppercase tracking-widest text-gold-soft">
          Did you know
        </span>
        {FOOTBALL_FACTS[i]}
      </p>
    </div>
  );
}
