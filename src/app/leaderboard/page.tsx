import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatPoints } from "@/lib/points";
import { getLeaderboard } from "@/lib/leaderboard";
import { FactBanner } from "@/components/FactBanner";
import { ChatPanel } from "@/components/ChatPanel";
import { StatCard } from "@/components/InfoCards";

export const dynamic = "force-dynamic";

const rankAccent = ["text-gold-soft", "text-slate-200", "text-amber-700"];

export default async function LeaderboardPage() {
  const me = await requireUser();

  const [{ rows, start }, stakeAgg] = await Promise.all([
    getLeaderboard(),
    prisma.bet.aggregate({ _sum: { stake: true } }),
  ]);

  const factSeed = Math.floor(Date.now() / 7000) + 5;
  const leader = rows[0];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
          <p className="text-sm text-slate-400">
            Ranked by total points (free balance + points in open bets), updating as bets settle.
            Everyone started with {formatPoints(start)}.
          </p>
        </div>
        {me.role === "ADMIN" && (
          <a
            href="/api/admin/leaderboard"
            className="btn-secondary px-3 py-1.5 text-xs"
            download
          >
            ⬇ Export CSV
          </a>
        )}
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Players" value={rows.length} />
        <StatCard label="Current leader" value={leader?.username ?? "—"} tone="gold" />
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
                <th className="table-cell font-medium text-right">Bets</th>
                <th className="table-cell font-medium text-right">Won</th>
                <th className="table-cell font-medium text-right">Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.userId}
                  className={`border-b border-white/5 transition last:border-0 hover:bg-white/[0.03] ${
                    r.userId === me.id ? "bg-accent/[0.06]" : ""
                  }`}
                >
                  <td className={`table-cell font-mono font-semibold ${rankAccent[i] ?? "text-slate-500"}`}>
                    {r.rank}
                  </td>
                  <td className="table-cell">
                    <Link href={`/players/${r.userId}`} className="font-medium hover:text-accent-soft">
                      {r.username}
                    </Link>
                    {r.role === "ADMIN" && (
                      <span className="badge ml-2 border border-gold/30 bg-gold/10 text-gold-soft">
                        admin
                      </span>
                    )}
                    {r.isBanned && (
                      <span className="badge ml-2 border border-down/30 bg-down/10 text-down">
                        disabled
                      </span>
                    )}
                    {r.userId === me.id && <span className="ml-2 text-xs text-slate-500">(you)</span>}
                  </td>
                  <td className="table-cell text-right font-mono font-semibold text-gold-soft">
                    {formatPoints(r.total)}
                  </td>
                  <td className="table-cell text-right font-mono text-slate-300">
                    {formatPoints(r.liquidity)}
                    {r.inPlay > 0n && (
                      <span className="ml-1 text-[11px] text-slate-500">
                        (+{formatPoints(r.inPlay)} in play)
                      </span>
                    )}
                  </td>
                  <td
                    className={`table-cell text-right font-mono ${
                      r.pl > 0n ? "text-up" : r.pl < 0n ? "text-down" : "text-slate-400"
                    }`}
                  >
                    {r.pl > 0n ? "+" : ""}
                    {formatPoints(r.pl)}
                  </td>
                  <td className="table-cell text-right font-mono text-slate-300">{r.totalBets}</td>
                  <td className="table-cell text-right font-mono text-slate-300">{r.betsWon}</td>
                  <td className="table-cell text-right font-mono">
                    {r.accuracyPct === null ? (
                      <span className="text-slate-600">—</span>
                    ) : (
                      <span className="text-slate-200">
                        {r.accuracyPct}%
                        <span className="ml-1 text-[10px] text-slate-500">
                          ({r.betsWon}/{r.settledBets})
                        </span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-white/5 px-3 py-2 text-[11px] text-slate-500">
            <span className="text-gold-soft">Total points</span> = free balance + points in open bets ·{" "}
            <span className="text-slate-300">Liquidity</span> = free to stake now ·{" "}
            <span className="text-up">P/L</span> = total vs your {formatPoints(start)} start ·{" "}
            <span className="text-slate-300">Accuracy</span> = bets won ÷ settled (&ldquo;—&rdquo; until
            you have a settled bet)
          </p>
        </div>

        <div className="lg:col-span-2">
          <ChatPanel me={{ id: me.id, username: me.username, role: me.role }} />
        </div>
      </div>
    </div>
  );
}
