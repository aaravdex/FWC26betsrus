"use client";

import { useEffect, useState } from "react";

// Live client-side countdown to a target time (e.g. kickoff). Once the target
// passes it renders the locked label instead, so the card reflects that betting
// has closed without a page reload.
export function Countdown({
  to,
  prefix = "Betting closes in",
  lockedLabel = "Betting closed",
  className,
}: {
  to: string | number | Date;
  prefix?: string;
  lockedLabel?: string;
  className?: string;
}) {
  const target =
    to instanceof Date ? to.getTime() : typeof to === "string" ? new Date(to).getTime() : to;
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // First paint (SSR/hydration) renders a neutral placeholder to avoid a
  // server/client time mismatch; the live value appears on the next tick.
  if (now === null) return <span className={className}>{prefix} —</span>;

  const ms = target - now;
  if (ms <= 0) return <span className={className}>{lockedLabel}</span>;

  const total = Math.floor(ms / 1000);
  const days = Math.floor(total / 86_400);
  const hours = Math.floor((total % 86_400) / 3_600);
  const mins = Math.floor((total % 3_600) / 60);
  const secs = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  const value =
    days > 0
      ? `${days}d ${pad(hours)}h ${pad(mins)}m`
      : `${pad(hours)}h ${pad(mins)}m ${pad(secs)}s`;

  return (
    <span className={className}>
      {prefix} {value}
    </span>
  );
}
