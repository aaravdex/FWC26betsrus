import { prisma } from "@/lib/prisma";
import { startingBalance } from "@/lib/env";

// Shared leaderboard computation used by both the leaderboard page and the
// admin CSV export. All stats are honest: accuracy is won / settled, and is
// null (rendered "—") when a player has no settled bets yet.

export type LeaderboardRow = {
  rank: number;
  userId: string;
  username: string;
  role: string;
  isBanned: boolean;
  liquidity: bigint; // free balance
  inPlay: bigint; // points tied up in open bets
  total: bigint; // liquidity + inPlay (net worth)
  pl: bigint; // total − starting balance
  totalBets: number;
  betsWon: number;
  settledBets: number;
  accuracyPct: number | null;
};

export async function getLeaderboard(): Promise<{ rows: LeaderboardRow[]; start: bigint }> {
  const start = startingBalance();

  const [users, openStakes, statusGroups] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, username: true, role: true, balance: true, bannedAt: true },
    }),
    prisma.bet.groupBy({ by: ["userId"], where: { status: "OPEN" }, _sum: { stake: true } }),
    prisma.bet.groupBy({ by: ["userId", "status"], _count: { _all: true } }),
  ]);

  const inPlayByUser = new Map(openStakes.map((g) => [g.userId, g._sum.stake ?? 0n]));

  // Per-user bet tallies: total placed, wins, and settled (won + lost).
  const counts = new Map<string, { total: number; won: number; settled: number }>();
  for (const g of statusGroups) {
    const c = counts.get(g.userId) ?? { total: 0, won: 0, settled: 0 };
    const n = g._count._all;
    c.total += n;
    if (g.status === "WON") {
      c.won += n;
      c.settled += n;
    } else if (g.status === "LOST") {
      c.settled += n;
    }
    counts.set(g.userId, c);
  }

  const rows: LeaderboardRow[] = users
    .map((u) => {
      const liquidity = u.balance;
      const inPlay = inPlayByUser.get(u.id) ?? 0n;
      const total = liquidity + inPlay;
      const c = counts.get(u.id) ?? { total: 0, won: 0, settled: 0 };
      const accuracyPct =
        c.settled === 0 ? null : Math.round((c.won / c.settled) * 1000) / 10;
      return {
        rank: 0,
        userId: u.id,
        username: u.username,
        role: u.role,
        isBanned: u.bannedAt != null,
        liquidity,
        inPlay,
        total,
        pl: total - start,
        totalBets: c.total,
        betsWon: c.won,
        settledBets: c.settled,
        accuracyPct,
      };
    })
    .sort((a, b) =>
      b.total > a.total ? 1 : b.total < a.total ? -1 : a.username.localeCompare(b.username),
    );

  rows.forEach((r, i) => {
    r.rank = i + 1;
  });

  return { rows, start };
}
