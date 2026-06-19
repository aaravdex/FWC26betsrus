const styles: Record<string, string> = {
  // market / match status
  OPEN: "border border-up/30 bg-up/10 text-up",
  SCHEDULED: "border border-white/15 bg-white/5 text-slate-300",
  SUSPENDED: "border border-gold/30 bg-gold/10 text-gold-soft",
  LOCKED: "border border-amber-500/30 bg-amber-500/10 text-amber-300",
  SETTLED: "border border-white/10 bg-white/5 text-slate-400",
  CANCELLED: "border border-down/30 bg-down/10 text-down",
  POSTPONED: "border border-amber-500/30 bg-amber-500/10 text-amber-300",
  // live match status
  LIVE: "border border-down/40 bg-down/10 text-down",
  HALFTIME: "border border-gold/30 bg-gold/10 text-gold-soft",
  FULLTIME: "border border-white/10 bg-white/5 text-slate-400",
  // bet / outcome result
  WON: "border border-up/30 bg-up/10 text-up",
  LOST: "border border-down/30 bg-down/10 text-down",
  VOID: "border border-white/10 bg-white/5 text-slate-400",
  PENDING: "border border-white/10 bg-white/5 text-slate-400",
};

const labels: Record<string, string> = {
  HALFTIME: "Half-time",
  FULLTIME: "Full-time",
  CANCELLED: "Cancelled",
  POSTPONED: "Postponed",
};

export function StatusBadge({ status }: { status: string }) {
  const isLive = status === "LIVE";
  return (
    <span className={`badge ${styles[status] ?? "border border-white/10 bg-white/5 text-slate-300"}`}>
      {isLive && <span className="live-dot" />}
      {labels[status] ?? status}
    </span>
  );
}
