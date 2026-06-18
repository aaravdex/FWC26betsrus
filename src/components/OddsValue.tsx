"use client";

import { useEffect, useRef, useState } from "react";

// Shows decimal odds as a gold "value" pill. If the admin has edited the odds,
// a green-up / red-down arrow shows the direction vs the previous value, and the
// pill flashes whenever the displayed value actually changes on screen (e.g.
// during live polling). No simulated movement — only real admin edits.
export function OddsValue({
  odds,
  previousOdds,
  className = "",
}: {
  odds: number;
  previousOdds?: number | null;
  className?: string;
}) {
  const [flash, setFlash] = useState(false);
  const last = useRef(odds);

  useEffect(() => {
    if (last.current !== odds) {
      last.current = odds;
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 1200);
      return () => clearTimeout(t);
    }
  }, [odds]);

  const dir = previousOdds == null ? 0 : odds > previousOdds ? 1 : odds < previousOdds ? -1 : 0;

  return (
    <span className={`odds-pill ${flash ? "animate-oddsFlash" : ""} ${className}`}>
      {odds.toFixed(2)}
      {dir > 0 && <span className="ml-1 text-xs text-up">▲</span>}
      {dir < 0 && <span className="ml-1 text-xs text-down">▼</span>}
    </span>
  );
}
