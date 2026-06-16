import { prisma } from "@/lib/prisma";
import { marketInclude, toMarketView } from "@/lib/views";
import { toDateTimeLocalValue } from "@/lib/format";
import { formatOddsNum } from "@/lib/points";
import { StatusBadge } from "@/components/StatusBadge";
import { BetActivity } from "@/components/BetActivity";
import { OddsEditor } from "@/components/admin/OddsEditor";
import { SettleMarketForm } from "@/components/admin/SettleMarketForm";
import { AddSelectionForm } from "@/components/admin/AddSelectionForm";
import { TournamentSettingsForm } from "@/components/admin/TournamentSettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminTournamentPage() {
  const [settings, teams, market] = await Promise.all([
    prisma.tournamentSettings.findUnique({ where: { id: 1 } }),
    prisma.team.findMany({ orderBy: { name: "asc" } }),
    prisma.market.findFirst({ where: { kind: "TOURNAMENT_WINNER" }, include: marketInclude }),
  ]);

  const startsAt = settings?.startsAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const view = market ? toMarketView(market) : null;
  const settled = market?.status === "SETTLED";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Tournament winner</h1>
        <p className="text-sm text-slate-400">Set odds per team and settle once the trophy is lifted.</p>
      </header>

      <section className="card p-4">
        <h2 className="mb-3 font-semibold">Tournament settings</h2>
        <TournamentSettingsForm
          name={settings?.name ?? "World Cup 2026"}
          startsAtLocal={toDateTimeLocalValue(startsAt)}
          startingBalance={Number(settings?.startingBalance ?? 1000n)}
        />
      </section>

      <section className="card p-4">
        <h2 className="mb-1 font-semibold">Add or re-price a team</h2>
        <p className="mb-3 text-xs text-slate-500">
          Adds the team to the tournament-winner market (creating it if needed). Re-submitting a team
          updates its odds.
        </p>
        <AddSelectionForm
          endpoint="/api/admin/tournament/outcomes"
          fieldLabel="Team"
          idField="teamId"
          options={teams.map((t) => ({ id: t.id, label: t.name }))}
        />
      </section>

      {view && (
        <section className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Odds &amp; settlement</h2>
            <StatusBadge status={view.status} />
          </div>

          {view.outcomes.length === 0 ? (
            <p className="text-sm text-slate-500">No teams added yet.</p>
          ) : settled ? (
            <ul className="space-y-1">
              {view.outcomes.map((o) => (
                <li key={o.id} className="flex items-center justify-between text-sm">
                  <span>
                    {o.label} <span className="font-mono text-accent">{formatOddsNum(o.odds)}</span>
                  </span>
                  <StatusBadge status={o.result} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="space-y-4">
              <OddsEditor
                marketId={view.id}
                outcomes={view.outcomes.map((o) => ({ id: o.id, label: o.label, odds: o.odds }))}
              />
              <div className="border-t border-white/10 pt-4">
                <h3 className="mb-2 text-sm font-semibold">Settle (pick the winner)</h3>
                <SettleMarketForm
                  marketId={view.id}
                  outcomes={view.outcomes.map((o) => ({ id: o.id, label: o.label }))}
                />
              </div>
            </div>
          )}

          <details className="mt-4 group">
            <summary className="cursor-pointer list-none text-xs font-medium uppercase tracking-wide text-slate-400 hover:text-slate-200">
              Bet activity ({view.bets.length})
            </summary>
            <div className="mt-2">
              <BetActivity bets={view.bets} />
            </div>
          </details>
        </section>
      )}
    </div>
  );
}
