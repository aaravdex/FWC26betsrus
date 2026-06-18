// Three stacked match-winner rows: outcome name on the left, decimal payout
// right-aligned. Shared by the fixtures card and the live-hub card.
export function OddsRows({ rows }: { rows: { label: string; odds: number | null }[] }) {
  return (
    <div className="mt-3 space-y-1">
      {rows.map((r) => (
        <div
          key={r.label}
          className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-1.5"
        >
          <span className="min-w-0 truncate text-sm text-slate-200">{r.label}</span>
          <span className="shrink-0 font-mono text-sm font-semibold text-gold-soft">
            {r.odds != null ? r.odds.toFixed(2) : "—"}
          </span>
        </div>
      ))}
    </div>
  );
}
