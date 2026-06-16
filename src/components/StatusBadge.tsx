const styles: Record<string, string> = {
  // market / match status
  OPEN: "bg-accent/15 text-accent",
  SCHEDULED: "bg-accent/15 text-accent",
  LOCKED: "bg-amber-500/15 text-amber-300",
  SETTLED: "bg-slate-500/20 text-slate-300",
  // bet / outcome result
  WON: "bg-accent/15 text-accent",
  LOST: "bg-red-500/15 text-red-300",
  VOID: "bg-slate-500/20 text-slate-300",
  PENDING: "bg-slate-500/20 text-slate-300",
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge ${styles[status] ?? "bg-slate-500/20 text-slate-300"}`}>{status}</span>;
}
