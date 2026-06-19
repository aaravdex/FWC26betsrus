// Client-safe: derive a human-readable match status label from existing fields
// (no new data source). Used on match cards and pages.

export type MatchStatusKey =
  | "upcoming"
  | "closed"
  | "live"
  | "completed"
  | "settled"
  | "cancelled"
  | "postponed";

export type MatchStateInput = {
  status: string; // SCHEDULED | LOCKED | SETTLED | CANCELLED | POSTPONED
  liveStatus: string; // SCHEDULED | LIVE | HALFTIME | FULLTIME
  kickoff: string | Date;
  settledAt?: string | Date | null;
};

export function matchDisplayStatus(
  m: MatchStateInput,
  now: Date = new Date(),
): { key: MatchStatusKey; label: string } {
  if (m.status === "CANCELLED") return { key: "cancelled", label: "Cancelled" };
  if (m.status === "POSTPONED") return { key: "postponed", label: "Postponed" };
  if (m.status === "SETTLED") return { key: "settled", label: "Result Updated" };
  if (m.liveStatus === "LIVE" || m.liveStatus === "HALFTIME") return { key: "live", label: "Live" };
  if (m.liveStatus === "FULLTIME") return { key: "completed", label: "Completed" };
  const kickoff = new Date(m.kickoff).getTime();
  if (m.status === "LOCKED" || kickoff <= now.getTime()) {
    return { key: "closed", label: "Betting Closed" };
  }
  return { key: "upcoming", label: "Upcoming" };
}

export function matchStatusClass(key: MatchStatusKey): string {
  switch (key) {
    case "live":
      return "border border-down/40 bg-down/10 text-down";
    case "upcoming":
      return "border border-accent/30 bg-accent/10 text-accent-soft";
    case "closed":
      return "border border-amber-500/30 bg-amber-500/10 text-amber-300";
    case "completed":
      return "border border-gold/30 bg-gold/10 text-gold-soft";
    case "cancelled":
      return "border border-down/30 bg-down/10 text-down";
    case "postponed":
      return "border border-amber-500/30 bg-amber-500/10 text-amber-300";
    case "settled":
    default:
      return "border border-white/10 bg-white/5 text-slate-300";
  }
}
