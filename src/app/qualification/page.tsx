import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { marketInclude, toMarketView } from "@/lib/views";
import { MarketPanel } from "@/components/MarketPanel";
import { FactBanner } from "@/components/FactBanner";
import { formatKickoff } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function QualificationPage() {
  const user = await requireUser();

  const market = await prisma.market.findFirst({
    where: { kind: "ROUND_OF_16" },
    include: marketInclude,
  });

  const factSeed = Math.floor(Date.now() / 7000) + 3;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Round of 16 — qualification</h1>
        <p className="text-sm text-slate-400">
          Back every team you think advances from the group stage. A pick pays your stake × its odds
          if that team reaches the Round of 16, and loses if it doesn’t.
          {market && <> Betting locks at {formatKickoff(market.locksAt)}.</>}
        </p>
      </header>

      <FactBanner startIndex={factSeed} />

      {market ? (
        <MarketPanel market={toMarketView(market)} signedIn={!!user} balance={user.balance} />
      ) : (
        <p className="text-slate-400">
          The Round of 16 market hasn’t been set up yet. It’s created automatically on the next
          deploy, or an admin can add the odds from the admin panel.
        </p>
      )}
    </div>
  );
}
