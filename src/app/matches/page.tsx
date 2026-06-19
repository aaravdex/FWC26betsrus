import Link from "next/link";
import { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatKickoff, relativeToNow } from "@/lib/format";
import { formatPoints } from "@/lib/points";
import { oddsToNumber } from "@/lib/money";
import { getUserMatchResults } from "@/lib/live";
import { resultCardClass, type MatchResult } from "@/lib/results";
import { matchDisplayStatus } from "@/lib/matchStatus";
import { FactBanner } from "@/components/FactBanner";
import { OddsRows } from "@/components/OddsRows";
import { MatchStatusBadge } from "@/components/MatchStatusBadge";
import { Countdown } from "@/components/Countdown";

export const dynamic = "force-dynamic";

const matchListInclude = {
  homeTeam: true,
  awayTeam: true,
  markets: {
    select: {
      kind: true,
      bets: { select: { stake: true } },
      outcomes: { select: { selectionKey: true, odds: true } },
    },
  },
} satisfies Prisma.MatchInclude;

type MatchListItem = Prisma.MatchGetPayload<{ include: typeof matchListInclude }>;

// Shared fixture card — used by both the Upcoming and Completed sections so the
// inline odds, score, and per-user green/red colouring all stay identical.
function MatchCard({ m, result }: { m: MatchListItem; result: MatchResult }) {
  const mw = m.markets.find((mk) => mk.kind === "MATCH_WINNER");
  const oddOf = (key: string) => {
    const o = mw?.outcomes.find((x) => x.selectionKey === key);
    return o ? oddsToNumber(o.odds) : null;
  };
  const bets = m.markets.flatMap((mk) => mk.bets);
  const staked = bets.reduce((s, b) => s + b.stake, 0n);
  const settled = m.status === "SETTLED";
  const display = matchDisplayStatus(m);
  const isUpcoming = display.key === "upcoming";

  return (
    <Link
      href={`/matches/${m.id}`}
      className={`card block p-4 transition hover:border-white/25 ${resultCardClass(result)}`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xs text-slate-400">{formatKickoff(m.kickoff)}</div>
          {m.venue && (
            <div className="mt-0.5 truncate text-[11px] text-slate-500">📍 {m.venue}</div>
          )}
        </div>
        <MatchStatusBadge match={m} />
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
          <div className="text-right text-xs text-slate-500">{relativeToNow(m.kickoff)}</div>
        )}
      </div>

      {/* Live countdown to kickoff while betting is still open (item 4). */}
      {isUpcoming && (
        <div className="mt-2 rounded-lg border border-accent/20 bg-accent/[0.06] px-2.5 py-1.5 text-center text-xs font-medium text-accent-soft">
          <Countdown to={m.kickoff.toISOString()} />
        </div>
      )}

      {/* Match-winner odds: outcome name + decimal payout, stacked */}
      <OddsRows
        rows={[
          { label: m.homeTeam.name, odds: oddOf("HOME") },
          { label: "Draw", odds: oddOf("DRAW") },
          { label: m.awayTeam.name, odds: oddOf("AWAY") },
        ]}
      />

      <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2 text-xs text-slate-500">
        <span>
          {bets.length} bet{bets.length === 1 ? "" : "s"} · {formatPoints(staked)} staked
        </span>
        {result === "won" && <span className="font-medium text-up">✓ your bet won</span>}
        {result === "lost" && <span className="font-medium text-down">✗ your bet lost</span>}
      </div>
    </Link>
  );
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">{title}</h2>
      <span className="text-xs text-slate-600">{count}</span>
      <div className="rule flex-1" />
    </div>
  );
}

export default async function MatchesPage() {
  const user = await requireUser();

  const [matches, results] = await Promise.all([
    prisma.match.findMany({ orderBy: { kickoff: "asc" }, include: matchListInclude }),
    getUserMatchResults(user.id),
  ]);

  // Upcoming/live = not yet settled (kickoff soonest first, already sorted).
  const upcoming = matches.filter((m) => m.status !== "SETTLED");
  // Completed = settled, most-recently-finished first.
  const completed = matches
    .filter((m) => m.status === "SETTLED")
    .sort((a, b) => (b.settledAt ?? b.kickoff).getTime() - (a.settledAt ?? a.kickoff).getTime());

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
        <>
          <section className="space-y-3">
            <SectionHeader title="Upcoming Matches" count={upcoming.length} />
            {upcoming.length === 0 ? (
              <p className="text-sm text-slate-500">No upcoming matches — every fixture is settled.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {upcoming.map((m) => (
                  <MatchCard key={m.id} m={m} result={results[m.id] ?? null} />
                ))}
              </div>
            )}
          </section>

          {completed.length > 0 && (
            <section className="space-y-3">
              <SectionHeader title="Completed Matches" count={completed.length} />
              <div className="grid gap-4 sm:grid-cols-2">
                {completed.map((m) => (
                  <MatchCard key={m.id} m={m} result={results[m.id] ?? null} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
