import { prisma } from "@/lib/prisma";

// In-app notifications only — no email, no external push. Generated from real
// app events and persisted per user; the bell polls and marks them read.

export type NewNotification = {
  userId: string;
  type: string; // SETTLEMENT | RANK | KICKOFF_SOON | ANNOUNCEMENT
  title: string;
  body: string;
  href?: string | null;
  dedupeKey?: string | null;
};

export async function createNotifications(items: NewNotification[]): Promise<void> {
  if (items.length === 0) return;
  await prisma.notification.createMany({
    data: items.map((n) => ({
      userId: n.userId,
      type: n.type,
      title: n.title,
      body: n.body,
      href: n.href ?? null,
      dedupeKey: n.dedupeKey ?? null,
    })),
    skipDuplicates: true,
  });
}

// Leaderboard rank snapshot (by total points = balance + open stakes), matching
// the leaderboard's ordering. Used to detect rank moves around a settlement.
export async function getRankSnapshot(): Promise<Map<string, number>> {
  const [users, openStakes] = await Promise.all([
    prisma.user.findMany({ select: { id: true, balance: true } }),
    prisma.bet.groupBy({ by: ["userId"], where: { status: "OPEN" }, _sum: { stake: true } }),
  ]);
  const inPlay = new Map(openStakes.map((g) => [g.userId, g._sum.stake ?? 0n]));
  const sorted = users
    .map((u) => ({ id: u.id, total: u.balance + (inPlay.get(u.id) ?? 0n) }))
    .sort((a, b) => (b.total > a.total ? 1 : b.total < a.total ? -1 : 0));
  return new Map(sorted.map((u, i) => [u.id, i + 1]));
}

const marketHref = (kind: string, matchId: string | null) =>
  matchId
    ? `/matches/${matchId}`
    : kind === "TOURNAMENT_WINNER"
      ? "/tournament"
      : kind === "TOP_SCORER"
        ? "/top-scorer"
        : kind === "ROUND_OF_16"
          ? "/qualification"
          : null;

// After a market settles: tell each bettor their result, then notify anyone
// whose leaderboard rank moved (vs the pre-settlement snapshot).
export async function notifyMarketSettled(
  marketId: string,
  beforeRanks?: Map<string, number>,
): Promise<void> {
  const market = await prisma.market.findUnique({
    where: { id: marketId },
    include: { match: { include: { homeTeam: true, awayTeam: true } } },
  });
  if (!market) return;

  const bets = await prisma.bet.findMany({
    where: { marketId, status: { in: ["WON", "LOST"] } },
    include: { outcome: true },
  });
  const label = market.match
    ? `${market.match.homeTeam.name} v ${market.match.awayTeam.name}`
    : market.title;
  const href = marketHref(market.kind, market.matchId);

  await createNotifications(
    bets.map((b) => ({
      userId: b.userId,
      type: "SETTLEMENT",
      title: b.status === "WON" ? "You won a prediction! 🎉" : "Prediction settled",
      body:
        b.status === "WON"
          ? `Your pick "${b.outcome.label}" (${label}) won — +${b.potentialReturn} points.`
          : `Your pick "${b.outcome.label}" (${label}) didn't come in.`,
      href,
      dedupeKey: `settled:${b.id}`,
    })),
  );

  if (beforeRanks) {
    const after = await getRankSnapshot();
    const affected = [...new Set(bets.map((b) => b.userId))];
    const rankItems: NewNotification[] = [];
    for (const uid of affected) {
      const a = after.get(uid);
      const b = beforeRanks.get(uid);
      if (a == null || b == null || a === b) continue;
      rankItems.push({
        userId: uid,
        type: "RANK",
        title: a < b ? "You climbed the leaderboard 📈" : "You slipped down the leaderboard 📉",
        body:
          a < b
            ? `You moved up to #${a} (from #${b}).`
            : `Someone overtook you — you're now #${a} (was #${b}).`,
        href: "/leaderboard",
      });
    }
    await createNotifications(rankItems);
  }
}

// After a market is voided (e.g. a cancelled match): tell each refunded bettor.
export async function notifyMarketVoided(marketId: string): Promise<void> {
  const market = await prisma.market.findUnique({
    where: { id: marketId },
    include: { match: { include: { homeTeam: true, awayTeam: true } } },
  });
  if (!market) return;
  const label = market.match
    ? `${market.match.homeTeam.name} v ${market.match.awayTeam.name}`
    : market.title;
  const bets = await prisma.bet.findMany({
    where: { marketId, status: "VOID" },
    include: { outcome: true },
  });
  await createNotifications(
    bets.map((b) => ({
      userId: b.userId,
      type: "SETTLEMENT",
      title: "Bet refunded",
      body: `${label} was voided — your ${b.stake} points on "${b.outcome.label}" were refunded.`,
      href: marketHref(market.kind, market.matchId),
      dedupeKey: `void:${b.id}`,
    })),
  );
}

// Tell everyone holding an open bet on a match about a change to it
// (e.g. postponed / rescheduled). Cancellations use notifyMarketVoided instead.
export async function notifyMatchUpdate(
  matchId: string,
  title: string,
  body: string,
): Promise<void> {
  const bets = await prisma.bet.findMany({
    where: { status: "OPEN", market: { matchId } },
    select: { userId: true },
  });
  const userIds = [...new Set(bets.map((b) => b.userId))];
  await createNotifications(
    userIds.map((userId) => ({ userId, type: "MATCH", title, body, href: `/matches/${matchId}` })),
  );
}

// Broadcast an admin announcement to every player via the notification centre.
export async function notifyAnnouncement(title: string, body: string): Promise<number> {
  const users = await prisma.user.findMany({ select: { id: true } });
  await createNotifications(
    users.map((u) => ({ userId: u.id, type: "ANNOUNCEMENT", title, body, href: null })),
  );
  return users.length;
}

// Lazily create "betting closes soon" notifications for the polling user's
// open-bet matches that kick off within the next hour. Idempotent per match.
export async function generateKickoffSoon(userId: string): Promise<void> {
  const now = new Date();
  const soon = new Date(now.getTime() + 60 * 60 * 1000);
  const bets = await prisma.bet.findMany({
    where: {
      userId,
      status: "OPEN",
      market: { match: { status: "SCHEDULED", kickoff: { gt: now, lte: soon } } },
    },
    select: {
      market: {
        select: {
          match: {
            select: {
              id: true,
              kickoff: true,
              homeTeam: { select: { name: true } },
              awayTeam: { select: { name: true } },
            },
          },
        },
      },
    },
  });
  const byMatch = new Map<string, { name: string; mins: number }>();
  for (const bet of bets) {
    const m = bet.market.match;
    if (!m) continue;
    const mins = Math.max(0, Math.round((m.kickoff.getTime() - now.getTime()) / 60000));
    byMatch.set(m.id, { name: `${m.homeTeam.name} v ${m.awayTeam.name}`, mins });
  }
  await createNotifications(
    [...byMatch.entries()].map(([matchId, m]) => ({
      userId,
      type: "KICKOFF_SOON",
      title: "Betting closing soon ⏳",
      body: `${m.name} kicks off in about ${m.mins} min — betting closes at kickoff.`,
      href: `/matches/${matchId}`,
      dedupeKey: `kickoff:${matchId}`,
    })),
  );
}
