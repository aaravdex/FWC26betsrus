import type { MarketView } from "@/lib/views";
import { formatPoints } from "@/lib/points";
import { BetBox } from "@/components/BetBox";
import { BetActivity } from "@/components/BetActivity";
import { StatusBadge } from "@/components/StatusBadge";

type Props = {
  market: MarketView;
  signedIn: boolean;
  balance: bigint;
};

export function MarketPanel({ market, signedIn, balance }: Props) {
  return (
    <section className="card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">{market.title}</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">
            {market.bets.length} bet{market.bets.length === 1 ? "" : "s"} ·{" "}
            {formatPoints(market.totalStaked)} staked
          </span>
          <StatusBadge status={market.status} />
        </div>
      </div>

      <BetBox
        marketId={market.id}
        outcomes={market.outcomes.map((o) => ({
          id: o.id,
          label: o.label,
          odds: o.odds,
          previousOdds: o.previousOdds,
        }))}
        locked={market.locked}
        lockLabel={market.lockLabel}
        suspended={market.status === "SUSPENDED"}
        signedIn={signedIn}
        balance={balance}
      />

      <details className="mt-4 group">
        <summary className="cursor-pointer list-none text-xs font-medium uppercase tracking-wide text-slate-400 hover:text-slate-200">
          <span className="group-open:hidden">▸ Show bet activity ({market.bets.length})</span>
          <span className="hidden group-open:inline">▾ Hide bet activity</span>
        </summary>
        <div className="mt-2">
          <BetActivity bets={market.bets} />
        </div>
      </details>
    </section>
  );
}
