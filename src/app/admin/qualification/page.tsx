import { prisma } from "@/lib/prisma";
import { marketInclude, toMarketView } from "@/lib/views";
import { toDateTimeLocalValue } from "@/lib/format";
import { formatOddsNum } from "@/lib/points";
import { StatusBadge } from "@/components/StatusBadge";
import { BetActivity } from "@/components/BetActivity";
import { OddsEditor } from "@/components/admin/OddsEditor";
import { MarketLockForm } from "@/components/admin/MarketLockForm";
import { QualificationSettleForm } from "@/components/admin/QualificationSettleForm";

export const dynamic = "force-dynamic";

export default async function AdminQualificationPage() {
  const market = await prisma.market.findFirst({
    where: { kind: "ROUND_OF_16" },
    include: marketInclude,
  });

  if (!market) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Round of 16 — qualification</h1>
        <p className="text-slate-400">
          This market isn’t created yet — it appears automatically on the next deploy (or re-run the
          seed locally).
        </p>
      </div>
    );
  }

  const view = toMarketView(market);
  const settled = market.status === "SETTLED";
  const editable = view.outcomes.map((o) => ({ id: o.id, label: o.label, odds: o.odds }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Round of 16 — qualification</h1>
        <p className="text-sm text-slate-400">
          Set the group-stage lock time and per-team payouts, then mark which teams qualified to
          settle. Mirrors the Tournament Winner admin; editing odds never changes already-placed
          bets.
        </p>
      </header>

      <section className="card p-4">
        <h2 className="mb-3 font-semibold">Lock time</h2>
        <MarketLockForm marketId={market.id} locksAtLocal={toDateTimeLocalValue(market.locksAt)} />
      </section>

      <section className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Odds &amp; settlement</h2>
          <StatusBadge status={market.status} />
        </div>

        {settled ? (
          <ul className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
            {view.outcomes.map((o) => (
              <li key={o.id} className="flex items-center justify-between text-sm">
                <span>
                  {o.label} <span className="font-mono text-accent-soft">{formatOddsNum(o.odds)}</span>
                </span>
                <StatusBadge status={o.result} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="space-y-5">
            <OddsEditor marketId={market.id} outcomes={editable} />
            <div className="border-t border-white/10 pt-4">
              <h3 className="mb-2 text-sm font-semibold">Settle — mark qualified teams</h3>
              <QualificationSettleForm marketId={market.id} outcomes={editable} />
            </div>
          </div>
        )}
      </section>

      <section className="card p-4">
        <h2 className="mb-3 font-semibold">Bet activity ({view.bets.length})</h2>
        <BetActivity bets={view.bets} />
      </section>
    </div>
  );
}
