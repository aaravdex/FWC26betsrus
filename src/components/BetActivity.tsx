import Link from "next/link";
import type { BetView } from "@/lib/views";
import { formatPoints } from "@/lib/money";
import { StatusBadge } from "@/components/StatusBadge";

// Public transparency view: everyone can see who staked what on a market.
export function BetActivity({ bets }: { bets: BetView[] }) {
  if (bets.length === 0) {
    return <p className="px-1 py-2 text-sm text-slate-500">No bets placed yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-slate-400">
            <th className="table-cell font-medium">Player</th>
            <th className="table-cell font-medium">Pick</th>
            <th className="table-cell font-medium text-right">Stake</th>
            <th className="table-cell font-medium text-right">Potential return</th>
            <th className="table-cell font-medium text-right">Status</th>
          </tr>
        </thead>
        <tbody>
          {bets.map((b) => (
            <tr key={b.id} className="border-b border-white/5 last:border-0">
              <td className="table-cell">
                <Link href={`/players/${b.playerId}`} className="hover:text-accent">
                  {b.playerName}
                </Link>
              </td>
              <td className="table-cell text-slate-300">{b.outcomeLabel}</td>
              <td className="table-cell text-right font-mono">{formatPoints(b.stake)}</td>
              <td className="table-cell text-right font-mono text-slate-300">
                {formatPoints(b.potentialReturn)}
              </td>
              <td className="table-cell text-right">
                <StatusBadge status={b.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
