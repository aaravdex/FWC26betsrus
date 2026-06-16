import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { marketInclude, toMarketView } from "@/lib/views";
import { MarketPanel } from "@/components/MarketPanel";
import { formatKickoff } from "@/lib/format";
import { formatPoints } from "@/lib/points";
import { StatusBadge } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      homeTeam: true,
      awayTeam: true,
      markets: { include: marketInclude },
    },
  });
  if (!match) notFound();

  const views = match.markets.map((m) => toMarketView(m));
  const allBets = views.flatMap((v) => v.bets.map((b) => ({ ...b, market: v.title })));
  const settled = match.status === "SETTLED";

  return (
    <div className="space-y-6">
      <Link href="/matches" className="text-sm text-slate-400 hover:text-white">
        ← All matches
      </Link>

      <header className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <div className="text-xs text-slate-400">{formatKickoff(match.kickoff)}</div>
          <h1 className="mt-1 text-2xl font-bold">
            {match.homeTeam.name} <span className="text-slate-500">vs</span> {match.awayTeam.name}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {settled && (
            <div className="text-center">
              <div className="text-xs uppercase tracking-wide text-slate-500">Full time</div>
              <div className="font-mono text-2xl">
                {match.homeScore} – {match.awayScore}
              </div>
            </div>
          )}
          <StatusBadge status={match.status} />
        </div>
      </header>

      <div className="space-y-4">
        {views.map((v) => (
          <MarketPanel key={v.id} market={v} signedIn={!!user} balance={user.balance} />
        ))}
      </div>

      {/* Per-match bet activity (all markets combined) */}
      <section className="card p-4">
        <h2 className="mb-3 font-semibold">All bets on this match</h2>
        {allBets.length === 0 ? (
          <p className="text-sm text-slate-500">No bets placed on this match yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="table-cell font-medium">Player</th>
                  <th className="table-cell font-medium">Market</th>
                  <th className="table-cell font-medium">Pick</th>
                  <th className="table-cell font-medium text-right">Stake</th>
                  <th className="table-cell font-medium text-right">Potential return</th>
                  <th className="table-cell font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {allBets.map((b) => (
                  <tr key={b.id} className="border-b border-white/5 last:border-0">
                    <td className="table-cell">
                      <Link href={`/players/${b.playerId}`} className="hover:text-accent">
                        {b.playerName}
                      </Link>
                    </td>
                    <td className="table-cell text-slate-400">{b.market}</td>
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
        )}
      </section>
    </div>
  );
}
