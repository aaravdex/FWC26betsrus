import { prisma } from "@/lib/prisma";
import { CreateTeamForm } from "@/components/admin/CreateTeamForm";
import { CreatePlayerForm } from "@/components/admin/CreatePlayerForm";

export const dynamic = "force-dynamic";

export default async function AdminTeamsPage() {
  const [teams, players] = await Promise.all([
    prisma.team.findMany({ orderBy: { name: "asc" } }),
    prisma.player.findMany({ orderBy: { name: "asc" }, include: { team: true } }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Teams &amp; players</h1>
        <p className="text-sm text-slate-400">
          Teams power matches and the tournament-winner market. Players power the top-scorer market.
        </p>
      </header>

      <section className="card p-4">
        <h2 className="mb-3 font-semibold">Add a team</h2>
        <CreateTeamForm />
        <div className="mt-4 flex flex-wrap gap-2">
          {teams.map((t) => (
            <span key={t.id} className="badge bg-white/5 text-slate-200">
              {t.name} <span className="ml-1 font-mono text-slate-500">{t.code}</span>
              {t.group && <span className="ml-1 text-slate-500">· Grp {t.group}</span>}
            </span>
          ))}
          {teams.length === 0 && <span className="text-sm text-slate-500">No teams yet.</span>}
        </div>
      </section>

      <section className="card p-4">
        <h2 className="mb-3 font-semibold">Add a player</h2>
        <CreatePlayerForm teams={teams.map((t) => ({ id: t.id, name: t.name }))} />
        <div className="mt-4 flex flex-wrap gap-2">
          {players.map((p) => (
            <span key={p.id} className="badge bg-white/5 text-slate-200">
              {p.name}
              {p.team && <span className="ml-1 text-slate-500">· {p.team.name}</span>}
            </span>
          ))}
          {players.length === 0 && <span className="text-sm text-slate-500">No players yet.</span>}
        </div>
      </section>
    </div>
  );
}
