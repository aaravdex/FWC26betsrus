import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatKickoff, relativeToNow, matchStatusLabel } from "@/lib/format";
import { formatPoints } from "@/lib/points";
import { oddsToNumber } from "@/lib/money";
import { getUserMatchResults } from "@/lib/live";
import { resultCardClass } from "@/lib/results";
import { StatusBadge } from "@/components/StatusBadge";
import { FactBanner } from "@/components/FactBanner";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const user = await requireUser();

  const [matches, results] = await Promise.all([
    prisma.match.findMany({
      orderBy: { kickoff: "asc" },
      include: {
        homeTeam: true,
        awayTeam: true,
        markets: {
          select: {
            kind: true,
            bets: { select: { stake: true } },
            outcomes: { select: { selectionKey: true, odds: true } },
          },
        },
      },
    }),
    getUserMatchResults(user.id),
  ]);

  const factSeed = Math.floor(Date.now() / 7000);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Fixtures</h1>
        <p className="text-sm text-slate-400">
          Bet on the match winner for each fixture — odds shown below. Markets lock automatically at
          kickoff. Settled matches you bet on are tinted green (won) or red (lost).
        </p>
      </header>

      <FactBanner startIndex={factSeed} />

      {matches.length === 0 ? (
        <p className="text-slate-400">No matches yet. Check back soon.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {matches.map((m) => {
            const mw = m.markets.find((mk) => mk.kind === "MATCH_WINNER");
            const oddOf = (key: string) => {
              const o = mw?.outcomes.find((x) => x.selectionKey === key);
              return o ? oddsToNumber(o.odds) : null;
            };
            const bets = m.markets.flatMap((mk) => mk.bets);
            const staked = bets.reduce((s, b) => s + b.stake, 0n);
            const settled = m.status === "SETTLED";
            const result = results[m.id] ?? null;
            const pills = [
              { label: m.homeTeam.code, odds: oddOf("HOME") },
              { label: "Draw", odds: oddOf("DRAW") },
              { label: m.awayTeam.code, odds: oddOf("AWAY") },
            ];

            return (
              <Link
                key={m.id}
                href={`/matches/${m.id}`}
                className={`card block p-4 transition hover:border-white/25 ${resultCardClass(result)}`}
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

                {/* Inline match-winner odds (decimal payout) — no click needed */}
                <div className="mt-3 grid grid-cols-3 gap-1.5">
                  {pills.map((p) => (
                    <div
                      key={p.label}
                      className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-center"
                    >
                      <div className="truncate text-[10px] uppercase tracking-wide text-slate-500">
                        {p.label}
                      </div>
                      <div className="font-mono text-sm font-semibold text-gold-soft">
                        {p.odds != null ? p.odds.toFixed(2) : "—"}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2 text-xs text-slate-500">
                  <span>
                    {bets.length} bet{bets.length === 1 ? "" : "s"} · {formatPoints(staked)} staked
                  </span>
                  {result === "won" && <span className="font-medium text-up">✓ your bet won</span>}
                  {result === "lost" && <span className="font-medium text-down">✗ your bet lost</span>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
