import { prisma } from "@/lib/prisma";
import { marketInclude, toMarketView } from "@/lib/views";
import { formatOddsNum } from "@/lib/points";
import { StatusBadge } from "@/components/StatusBadge";
import { BetActivity } from "@/components/BetActivity";
import { OddsEditor } from "@/components/admin/OddsEditor";
import { SettleMarketForm } from "@/components/admin/SettleMarketForm";
import { AddSelectionForm } from "@/components/admin/AddSelectionForm";

export const dynamic = "force-dynamic";

export default async function AdminTopScorerPage() {
  const [players, market] = await Promise.all([
    prisma.player.findMany({ orderBy: { name: "asc" }, include: { team: true } }),
    prisma.market.findFirst({ where: { kind: "TOP_SCORER" }, include: marketInclude }),
  ]);

  const view = market ? toMarketView(market) : null;
  const settled = market?.status === "SETTLED";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Top scorer</h1>
        <p className="text-sm text-slate-400">Set odds per player and settle when the tournament ends.</p>
      </header>

      <section className="card p-4">
        <h2 className="mb-1 font-semibold">Add or re-price a player</h2>
        <p className="mb-3 text-xs text-slate-500">
          Adds the player to the top-scorer market (creating it if needed). Re-submitting a player
          updates their odds.
        </p>
        <AddSelectionForm
          endpoint="/api/admin/top-scorer/outcomes"
          fieldLabel="Player"
          idField="playerId"
          options={players.map((p) => ({
            id: p.id,
            label: p.team ? `${p.name} (${p.team.name})` : p.name,
          }))}
        />
      </section>

      {view && (
        <section className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Odds &amp; settlement</h2>
            <StatusBadge status={view.status} />
          </div>

          {view.outcomes.length === 0 ? (
            <p className="text-sm text-slate-500">No players added yet.</p>
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
