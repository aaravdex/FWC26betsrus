import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getLiveMatch } from "@/lib/live";
import { formatPoints } from "@/lib/points";
import { formatKickoff } from "@/lib/format";
import { LiveMatch } from "@/components/LiveMatch";
import { StatusBadge } from "@/components/StatusBadge";
import { FactCard, InfoPanel } from "@/components/InfoCards";

export const dynamic = "force-dynamic";

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const [view, bets, match] = await Promise.all([
    getLiveMatch(id),
    prisma.bet.findMany({
      where: { market: { matchId: id } },
      orderBy: { placedAt: "desc" },
      include: { user: { select: { id: true, username: true } }, outcome: true, market: true },
    }),
    prisma.match.findUnique({
      where: { id },
      include: { homeTeam: true, awayTeam: true },
    }),
  ]);
  if (!view || !match) notFound();

  const factSeed = id.charCodeAt(id.length - 1);

  return (
    <div className="space-y-6">
      <Link href="/matches" className="text-sm text-slate-400 transition hover:text-white">
        ← All fixtures
      </Link>

      <LiveMatch initial={view} signedIn={!!user} balance={user.balance} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <section className="card p-4">
            <h2 className="mb-3 font-semibold">All bets on this match</h2>
            {bets.length === 0 ? (
              <p className="text-sm text-slate-500">No bets placed on this match yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-400">
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
                          <Link href={`/players/${b.user.id}`} className="hover:text-accent-soft">
                            {b.user.username}
                          </Link>
                        </td>
                        <td className="table-cell text-slate-300">{b.outcome.label}</td>
                        <td className="table-cell text-right font-mono">{formatPoints(b.stake)}</td>
                        <td className="table-cell text-right font-mono text-gold-soft">
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

        <div className="space-y-4">
          <InfoPanel title="Match info">
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Kick-off</dt>
                <dd className="text-slate-300">{formatKickoff(match.kickoff)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Teams</dt>
                <dd className="text-slate-300">
                  {match.homeTeam.code} v {match.awayTeam.code}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Betting</dt>
                <dd>
                  <StatusBadge status={match.status} />
                </dd>
              </div>
            </dl>
          </InfoPanel>
          <FactCard index={factSeed} />
        </div>
      </div>
    </div>
  );
}
