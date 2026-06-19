import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getLeaderboard } from "@/lib/leaderboard";
import { PlayerProfile } from "@/components/PlayerProfile";

export const dynamic = "force-dynamic";

export default async function MePage() {
  const me = await requireUser();

  const [user, ledger, board] = await Promise.all([
    prisma.user.findUnique({
      where: { id: me.id },
      include: { bets: { include: { market: true, outcome: true }, orderBy: { placedAt: "desc" } } },
    }),
    prisma.ledgerEntry.findMany({
      where: { userId: me.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    getLeaderboard(),
  ]);

  if (!user) return null;

  const rank = board.rows.find((r) => r.userId === me.id)?.rank;
  return (
    <PlayerProfile
      user={user}
      ledger={ledger}
      isSelf
      rank={rank}
      totalPlayers={board.rows.length}
    />
  );
}
