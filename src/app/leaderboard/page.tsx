import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatPoints } from "@/lib/points";
import { startingBalance } from "@/lib/env";
import { FactBanner } from "@/components/FactBanner";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const me = await requireUser();
  const start = startingBalance();

  const users = await prisma.user.findMany({
    orderBy: [{ balance: "desc" }, { username: "asc" }],
    include: { _count: { select: { bets: true } } },
  });

  const factSeed = Math.floor(Date.now() / 7000) + 5;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <p className="text-sm text-slate-400">
          Ranked by current points balance. Everyone started with {formatPoints(start)}.
        </p>
      </header>

      <FactBanner startIndex={factSeed} />

      <div className="card overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="table-cell font-medium">#</th>
              <th className="table-cell font-medium">Player</th>
              <th className="table-cell font-medium text-right">Bets</th>
              <th className="table-cell font-medium text-right">Net P/L</th>
              <th className="table-cell font-medium text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => {
              const pl = u.balance - start;
              return (
                <tr
                  key={u.id}
                  className={`border-b border-white/5 last:border-0 ${
                    u.id === me.id ? "bg-accent/5" : ""
                  }`}
                >
                  <td className="table-cell text-slate-500">{i + 1}</td>
                  <td className="table-cell">
                    <Link href={`/players/${u.id}`} className="font-medium hover:text-accent">
                      {u.username}
                    </Link>
                    {u.role === "ADMIN" && (
                      <span className="badge ml-2 bg-accent/15 text-accent">admin</span>
                    )}
                    {u.id === me.id && <span className="ml-2 text-xs text-slate-500">(you)</span>}
                  </td>
                  <td className="table-cell text-right font-mono text-slate-400">{u._count.bets}</td>
                  <td
                    className={`table-cell text-right font-mono ${
                      pl > 0n ? "text-accent" : pl < 0n ? "text-red-300" : "text-slate-400"
                    }`}
                  >
                    {pl > 0n ? "+" : ""}
                    {formatPoints(pl)}
                  </td>
                  <td className="table-cell text-right font-mono font-semibold">
                    {formatPoints(u.balance)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
