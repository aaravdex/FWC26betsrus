import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { marketInclude, toMarketView } from "@/lib/views";
import { formatKickoff, toDateTimeLocalValue } from "@/lib/format";
import { formatOddsNum } from "@/lib/points";
import { StatusBadge } from "@/components/StatusBadge";
import { BetActivity } from "@/components/BetActivity";
import { OddsEditor } from "@/components/admin/OddsEditor";
import { SettleMatchForm } from "@/components/admin/SettleMatchForm";
import { MatchLockControls } from "@/components/admin/MatchLockControls";
import { LiveControls } from "@/components/admin/LiveControls";
import { AddEventForm } from "@/components/admin/AddEventForm";
import { MarketSuspendToggle } from "@/components/admin/MarketSuspendToggle";

export const dynamic = "force-dynamic";

export default async function AdminMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      homeTeam: true,
      awayTeam: true,
      events: { orderBy: { createdAt: "desc" } },
      markets: { include: marketInclude },
    },
  });
  if (!match) notFound();

  const markets = match.markets;
  const settled = match.status === "SETTLED";
  const teamName = (teamId: string | null) =>
    teamId == null ? null : teamId === match.homeTeamId ? match.homeTeam.name : match.awayTeam.name;
  const eventRows = match.events.map((e) => ({
    id: e.id,
    type: e.type,
    minute: e.minute,
    teamName: teamName(e.teamId),
    description: e.description,
  }));

  return (
    <div className="space-y-6">
      <Link href="/admin/matches" className="text-sm text-slate-400 hover:text-white">
        ← All matches
      </Link>

      <header className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <div className="text-xs text-slate-400">{formatKickoff(match.kickoff)}</div>
          <h1 className="mt-1 text-2xl font-bold">
            {match.homeTeam.name} <span className="text-slate-500">vs</span> {match.awayTeam.name}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {(match.liveStatus !== "SCHEDULED" || settled) && (
            <div className="text-center">
              <div className="text-xs uppercase tracking-wide text-slate-500">Score</div>
              <div className="font-mono text-2xl text-gold-soft">
                {match.homeScore ?? 0} – {match.awayScore ?? 0}
              </div>
            </div>
          )}
          <StatusBadge status={match.liveStatus} />
          <StatusBadge status={match.status} />
        </div>
      </header>

      {/* Live Match Center (admin-driven; no external feed) */}
      <section className="card space-y-4 p-4">
        <div>
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 font-semibold">
              <span className="live-dot" /> Live Match Center
            </h2>
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(
                `${match.homeTeam.name} vs ${match.awayTeam.name} score`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary px-2.5 py-1 text-xs"
            >
              🔎 Look up score on Google ↗
            </a>
          </div>
          <p className="mb-3 text-xs text-slate-500">
            Set the score, play status and minute below — viewers&rsquo; screens update within a few
            seconds. The Google button opens a search in a new tab so you can check a real result;
            scores aren&rsquo;t fetched automatically.
          </p>
          <LiveControls
            matchId={match.id}
            homeName={match.homeTeam.name}
            awayName={match.awayTeam.name}
            initial={{
              liveStatus: match.liveStatus,
              minute: match.minute,
              homeScore: match.homeScore,
              awayScore: match.awayScore,
            }}
          />
        </div>
        <div className="border-t border-white/10 pt-4">
          <h2 className="mb-3 font-semibold">Timeline events</h2>
          <AddEventForm
            matchId={match.id}
            teams={[
              { id: match.homeTeamId, name: match.homeTeam.name },
              { id: match.awayTeamId, name: match.awayTeam.name },
            ]}
            events={eventRows}
          />
        </div>
      </section>

      {!settled && (
        <section className="card space-y-4 p-4">
          <div>
            <h2 className="mb-3 font-semibold">Lock &amp; schedule</h2>
            <MatchLockControls
              matchId={match.id}
              status={match.status}
              kickoffLocal={toDateTimeLocalValue(match.kickoff)}
            />
          </div>
          <div className="border-t border-white/10 pt-4">
            <h2 className="mb-1 font-semibold">Enter result</h2>
            <p className="mb-3 text-xs text-slate-500">
              Entering the final score settles the match-winner market and pays winners through the
              ledger. Idempotent — settling twice won’t pay twice.
            </p>
            <SettleMatchForm matchId={match.id} homeName={match.homeTeam.name} awayName={match.awayTeam.name} />
          </div>
        </section>
      )}

      <div className="space-y-4">
        {markets.map((market) => {
          const view = toMarketView(market);
          return (
            <section key={market.id} className="card p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold">{market.title}</h3>
                <div className="flex items-center gap-2">
                  <MarketSuspendToggle marketId={market.id} status={market.status} />
                  <StatusBadge status={market.status} />
                </div>
              </div>

              {market.status === "SETTLED" ? (
                <ul className="mb-3 space-y-1">
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
                <OddsEditor
                  marketId={market.id}
                  outcomes={view.outcomes.map((o) => ({ id: o.id, label: o.label, odds: o.odds }))}
                />
              )}

              <details className="mt-3 group">
                <summary className="cursor-pointer list-none text-xs font-medium uppercase tracking-wide text-slate-400 hover:text-slate-200">
                  Bet activity ({view.bets.length})
                </summary>
                <div className="mt-2">
                  <BetActivity bets={view.bets} />
                </div>
              </details>
            </section>
          );
        })}
      </div>
    </div>
  );
}
