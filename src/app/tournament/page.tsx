import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { marketInclude, toMarketView } from "@/lib/views";
import { MarketPanel } from "@/components/MarketPanel";
import { formatKickoff } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TournamentPage() {
  const user = await requireUser();

  const market = await prisma.market.findFirst({
    where: { kind: "TOURNAMENT_WINNER" },
    include: marketInclude,
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Tournament winner</h1>
        <p className="text-sm text-slate-400">
          Back the team you think lifts the trophy. Longer odds = bigger payout.
          {market && <> Betting locks at {formatKickoff(market.locksAt)}.</>}
        </p>
      </header>

      {market ? (
        <MarketPanel market={toMarketView(market)} signedIn={!!user} balance={user.balance} />
      ) : (
        <p className="text-slate-400">
          The tournament-winner market hasn’t been set up yet. An admin can add teams and odds from
          the admin panel.
        </p>
      )}
    </div>
  );
}
