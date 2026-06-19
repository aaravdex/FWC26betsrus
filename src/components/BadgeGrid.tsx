import type { BadgeState } from "@/lib/badges";

// Earned + locked achievements. Every badge here maps to genuine recorded
// activity (see computeBadges) — locked ones show real progress toward unlock.
export function BadgeGrid({ badges }: { badges: BadgeState[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {badges.map((b) => (
        <div
          key={b.id}
          className={`rounded-xl border p-3 text-center transition ${
            b.earned
              ? "border-gold/30 bg-gold/[0.06] shadow-glow"
              : "border-white/10 bg-white/[0.02]"
          }`}
        >
          <div className={`text-2xl ${b.earned ? "" : "opacity-40 grayscale"}`}>{b.icon}</div>
          <div className={`mt-1 text-sm font-semibold ${b.earned ? "text-slate-100" : "text-slate-400"}`}>
            {b.name}
          </div>
          <div className="mt-0.5 text-[11px] leading-tight text-slate-500">{b.description}</div>
          {b.earned ? (
            <div className="mt-1.5 text-[10px] font-semibold uppercase tracking-wide text-gold-soft">
              ✓ Earned
            </div>
          ) : (
            <div className="mt-1.5 text-[10px] uppercase tracking-wide text-slate-600">
              {b.progress ? `Locked · ${b.progress}` : "Locked"}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
