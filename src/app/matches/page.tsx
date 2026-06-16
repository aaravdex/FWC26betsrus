import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatKickoff, relativeToNow, matchStatusLabel } from "@/lib/format";
import { formatPoints } from "@/lib/points";
import { StatusBadge } from "@/components/StatusBadge";
import { FactBanner } from "@/components/FactBanner";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  await requireUser();

  const matches = await prisma.match.findMany({
    orderBy: { kickoff: "asc" },
    include: {
      homeTeam: true,
      awayTeam: true,
      markets: { select: { bets: { select: { stake: true } } } },
    },
  });

  const factSeed = Math.floor(Date.now() / 7000);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Fixtures</h1>
        <p className="text-sm text-slate-400">
          Bet on the match winner for each fixture. Markets lock automatically at kickoff. Kickoff
          times are placeholders until an admin sets them.
        </p>
      </header>

      <FactBanner startIndex={factSeed} />

      {matches.length === 0 ? (
        <p className="text-slate-400">No matches yet. Check back soon.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {matches.map((m) => {
            const bets = m.markets.flatMap((mk) => mk.bets);
            const staked = bets.reduce((s, b) => s + b.stake, 0n);
            const settled = m.status === "SETTLED";
            return (
              <Link
                key={m.id}
                href={`/matches/${m.id}`}
                className="card block p-4 transition hover:border-white/25"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs text-slate-400">{formatKickoff(m.kickoff)}</span>
                  <StatusBadge status={m.status} />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="font-semibold">{m.homeTeam.name}</div>
                    <div className="font-semibold">{m.awayTeam.name}</div>
                  </div>
                  {settled ? (
                    <div className="text-right font-mono text-xl">
                      <div>{m.homeScore}</div>
                      <div>{m.awayScore}</div>
                    </div>
                  ) : (
                    <div className="text-right text-xs text-slate-500">
                      {matchStatusLabel(m.status)} · {relativeToNow(m.kickoff)}
                    </div>
                  )}
                </div>
                <div className="mt-3 border-t border-white/5 pt-2 text-xs text-slate-500">
                  {bets.length} bet{bets.length === 1 ? "" : "s"} · {formatPoints(staked)} staked
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
