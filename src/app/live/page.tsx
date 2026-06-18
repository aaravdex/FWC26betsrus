import { requireUser } from "@/lib/session";
import { getLiveSummaries } from "@/lib/live";
import { LiveHub } from "@/components/LiveHub";
import { FactBanner } from "@/components/FactBanner";

export const dynamic = "force-dynamic";

export default async function LivePage() {
  const user = await requireUser();
  const matches = await getLiveSummaries(user.id);
  const factSeed = Math.floor(Date.now() / 7000) + 9;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <span className="live-dot" /> Match Center
        </h1>
        <p className="text-sm text-slate-400">
          Live scores, status and timelines — updated by the admin, no external feed. Scores refresh
          automatically.
        </p>
      </header>

      <FactBanner startIndex={factSeed} />

      <LiveHub initial={matches} />
    </div>
  );
}
