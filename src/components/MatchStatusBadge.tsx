import { matchDisplayStatus, matchStatusClass, type MatchStateInput } from "@/lib/matchStatus";

// Small status chip (Upcoming / Betting Closed / Live / Completed / Result
// Updated / Cancelled / Postponed) derived from the match's existing fields.
export function MatchStatusBadge({
  match,
  className = "",
}: {
  match: MatchStateInput;
  className?: string;
}) {
  const { key, label } = matchDisplayStatus(match);
  return (
    <span className={`badge ${matchStatusClass(key)} ${className}`}>
      {key === "live" && (
        <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-down" />
      )}
      {label}
    </span>
  );
}
