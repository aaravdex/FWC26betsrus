import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatKickoff } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { CreateMatchForm } from "@/components/admin/CreateMatchForm";

export const dynamic = "force-dynamic";

export default async function AdminMatchesPage() {
  const [teams, matches] = await Promise.all([
    prisma.team.findMany({ orderBy: { name: "asc" } }),
    prisma.match.findMany({
      orderBy: { kickoff: "asc" },
      include: { homeTeam: true, awayTeam: true, _count: { select: { markets: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Matches</h1>
        <p className="text-sm text-slate-400">
          Creating a match auto-builds its match-winner market (Team A / Draw / Team B) with default
          payouts you can edit. Set the real kickoff time on each match.
        </p>
      </header>

      <section className="card p-4">
        <h2 className="mb-3 font-semibold">Create a match</h2>
        {teams.length < 2 ? (
          <p className="text-sm text-amber-300">
            Add at least two teams first on the Teams &amp; players page.
          </p>
        ) : (
          <CreateMatchForm teams={teams.map((t) => ({ id: t.id, name: t.name }))} />
        )}
      </section>

      <section className="card p-4">
        <h2 className="mb-3 font-semibold">All matches ({matches.length})</h2>
        {matches.length === 0 ? (
          <p className="text-sm text-slate-500">No matches yet.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {matches.map((m) => (
              <Link
                key={m.id}
                href={`/admin/matches/${m.id}`}
                className="flex items-center justify-between gap-4 px-1 py-3 hover:bg-white/5"
              >
                <div>
                  <div className="font-medium">
                    {m.homeTeam.name} <span className="text-slate-500">vs</span> {m.awayTeam.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {formatKickoff(m.kickoff)} · {m._count.markets} markets
                    {m.status === "SETTLED" && (
                      <> · {m.homeScore}–{m.awayScore}</>
                    )}
                  </div>
                </div>
                <StatusBadge status={m.status} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
