import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPoints } from "@/lib/points";
import { AdjustBalanceForm } from "@/components/admin/AdjustBalanceForm";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const [userCount, matchCount, openMarkets, settledMarkets, stakeAgg, users] = await Promise.all([
    prisma.user.count(),
    prisma.match.count(),
    prisma.market.count({ where: { status: "OPEN" } }),
    prisma.market.count({ where: { status: "SETTLED" } }),
    prisma.bet.aggregate({ _sum: { stake: true } }),
    prisma.user.findMany({ orderBy: { balance: "desc" }, include: { _count: { select: { bets: true } } } }),
  ]);

  const stats = [
    { label: "Users", value: String(userCount) },
    { label: "Matches", value: String(matchCount) },
    { label: "Open markets", value: String(openMarkets) },
    { label: "Settled markets", value: String(settledMarkets) },
    { label: "Total staked", value: formatPoints(stakeAgg._sum.stake ?? 0n) },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Admin overview</h1>
        <p className="text-sm text-slate-400">
          Manage matches, odds and results. All values are play-money points.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="card p-3 text-center">
            <div className="text-xs uppercase tracking-wide text-slate-500">{s.label}</div>
            <div className="mt-1 font-mono text-lg">{s.value}</div>
          </div>
        ))}
      </div>

      <section className="card p-4">
        <h2 className="mb-3 font-semibold">Users &amp; balances</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="table-cell font-medium">Username</th>
                <th className="table-cell font-medium">Role</th>
                <th className="table-cell font-medium text-right">Bets</th>
                <th className="table-cell font-medium text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-white/5 last:border-0">
                  <td className="table-cell">
                    <Link href={`/players/${u.id}`} className="hover:text-accent">
                      {u.username}
                    </Link>
                  </td>
                  <td className="table-cell text-slate-300">{u.role}</td>
                  <td className="table-cell text-right font-mono text-slate-400">{u._count.bets}</td>
                  <td className="table-cell text-right font-mono">{formatPoints(u.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card p-4">
        <h2 className="mb-1 font-semibold">Manual balance adjustment</h2>
        <p className="mb-3 text-xs text-slate-500">
          Recorded in the ledger as an ADJUSTMENT so balances stay auditable.
        </p>
        <AdjustBalanceForm
          users={users.map((u) => ({ id: u.id, username: u.username, balance: u.balance }))}
        />
      </section>
    </div>
  );
}
