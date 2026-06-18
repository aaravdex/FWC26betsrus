import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatPoints } from "@/lib/points";
import { startingBalance } from "@/lib/env";
import { FactBanner } from "@/components/FactBanner";
import { ChatPanel } from "@/components/ChatPanel";
import { StatCard } from "@/components/InfoCards";

export const dynamic = "force-dynamic";

const rankAccent = ["text-gold-soft", "text-slate-200", "text-amber-700"];

export default async function LeaderboardPage() {
  const me = await requireUser();
  const start = startingBalance();

  const [users, openStakes, stakeAgg] = await Promise.all([
    prisma.user.findMany({ include: { _count: { select: { bets: true } } } }),
    // Points currently tied up in each player's unsettled bets.
    prisma.bet.groupBy({ by: ["userId"], where: { status: "OPEN" }, _sum: { stake: true } }),
    prisma.bet.aggregate({ _sum: { stake: true } }),
  ]);

  const inPlayByUser = new Map(openStakes.map((g) => [g.userId, g._sum.stake ?? 0n]));

  // Liquidity = free balance (stakes are deducted at placement).
  // Total points = liquidity + points in open bets (net worth).
  // P/L = total points − starting balance (realised profit/loss).
  const rows = users
    .map((u) => {
      const liquidity = u.balance;
      const inPlay = inPlayByUser.get(u.id) ?? 0n;
      const total = liquidity + inPlay;
      const pl = total - start;
      return { u, liquidity, inPlay, total, pl };
    })
    .sort((a, b) => (b.total > a.total ? 1 : b.total < a.total ? -1 : a.u.username.localeCompare(b.u.username)));

  const factSeed = Math.floor(Date.now() / 7000) + 5;
  const leader = rows[0];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
        <p className="text-sm text-slate-400">
          Ranked by total points (free balance + points in open bets), updating as bets settle.
          Everyone started with {formatPoints(start)}.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Players" value={rows.length} />
        <StatCard label="Current leader" value={leader?.u.username ?? "—"} tone="gold" />
        <StatCard label="Total staked" value={formatPoints(stakeAgg._sum.stake ?? 0n)} tone="accent" />
        <StatCard label="Starting stack" value={formatPoints(start)} />
      </div>

      <FactBanner startIndex={factSeed} />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="card overflow-x-auto lg:col-span-3">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-400">
                <th className="table-cell font-medium">#</th>
                <th className="table-cell font-medium">Player</th>
                <th className="table-cell font-medium text-right">Total points</th>
                <th className="table-cell font-medium text-right">Liquidity</th>
                <th className="table-cell font-medium text-right">P/L</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ u, liquidity, inPlay, total, pl }, i) => (
                <tr
                  key={u.id}
                  className={`border-b border-white/5 transition last:border-0 hover:bg-white/[0.03] ${
                    u.id === me.id ? "bg-accent/[0.06]" : ""
                  }`}
                >
                  <td className={`table-cell font-mono font-semibold ${rankAccent[i] ?? "text-slate-500"}`}>
                    {i + 1}
                  </td>
                  <td className="table-cell">
                    <Link href={`/players/${u.id}`} className="font-medium hover:text-accent-soft">
                      {u.username}
                    </Link>
                    {u.role === "ADMIN" && (
                      <span className="badge ml-2 border border-gold/30 bg-gold/10 text-gold-soft">
                        admin
                      </span>
                    )}
                    {u.id === me.id && <span className="ml-2 text-xs text-slate-500">(you)</span>}
                  </td>
                  <td className="table-cell text-right font-mono font-semibold text-gold-soft">
                    {formatPoints(total)}
                  </td>
                  <td className="table-cell text-right font-mono text-slate-300">
                    {formatPoints(liquidity)}
                    {inPlay > 0n && (
                      <span className="ml-1 text-[11px] text-slate-500">
                        (+{formatPoints(inPlay)} in play)
                      </span>
                    )}
                  </td>
                  <td
                    className={`table-cell text-right font-mono ${
                      pl > 0n ? "text-up" : pl < 0n ? "text-down" : "text-slate-400"
                    }`}
                  >
                    {pl > 0n ? "+" : ""}
                    {formatPoints(pl)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-white/5 px-3 py-2 text-[11px] text-slate-500">
            <span className="text-gold-soft">Total points</span> = free balance + points in open bets ·{" "}
            <span className="text-slate-300">Liquidity</span> = free to stake now ·{" "}
            <span className="text-up">P/L</span> = total vs your {formatPoints(start)} start
          </p>
        </div>

        <div className="lg:col-span-2">
          <ChatPanel me={{ id: me.id, username: me.username, role: me.role }} />
        </div>
      </div>
    </div>
  );
}
