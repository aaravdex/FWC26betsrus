"use client";

import { useEffect, useRef, useState } from "react";

// A score digit that pops (and briefly turns gold) whenever its value changes —
// driven only by real admin score updates arriving via polling.
export function AnimatedScore({ value, className = "" }: { value: number; className?: string }) {
  const [pop, setPop] = useState(false);
  const last = useRef(value);
  useEffect(() => {
    if (last.current !== value) {
      last.current = value;
      setPop(true);
      const t = setTimeout(() => setPop(false), 600);
      return () => clearTimeout(t);
    }
  }, [value]);
  return (
    <span className={`inline-block font-mono font-bold tabular-nums ${pop ? "animate-scorePop" : ""} ${className}`}>
      {value}
    </span>
  );
}
