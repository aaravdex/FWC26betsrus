import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { marketInclude, toMarketView } from "@/lib/views";
import { MarketPanel } from "@/components/MarketPanel";
import { formatKickoff } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TopScorerPage() {
  const user = await requireUser();

  const market = await prisma.market.findFirst({
    where: { kind: "TOP_SCORER" },
    include: marketInclude,
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Top scorer</h1>
          <p className="text-sm text-slate-400">
            Pick the player who scores the most goals across the tournament.
            {market && <> Betting locks at {formatKickoff(market.locksAt)}.</>}
          </p>
        </div>
        <a
          href="https://www.google.com/search?q=fifa+world+cup+2026+top+scorers"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary shrink-0 text-xs"
        >
          View live top scorers ↗
        </a>
      </header>
      <p className="-mt-3 text-xs text-slate-500">
        Live standings open on Google in a new tab — for reference only; they don’t affect this
        game’s odds or markets.
      </p>

      {market ? (
        <MarketPanel market={toMarketView(market)} signedIn={!!user} balance={user.balance} />
      ) : (
        <p className="text-slate-400">
          The top-scorer market hasn’t been set up yet. An admin can add players and odds from the
          admin panel.
        </p>
      )}
    </div>
  );
}
