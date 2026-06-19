import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getLeaderboard } from "@/lib/leaderboard";
import { PlayerProfile } from "@/components/PlayerProfile";

export const dynamic = "force-dynamic";

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  const { id } = await params;

  const [user, board] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      include: { bets: { include: { market: true, outcome: true }, orderBy: { placedAt: "desc" } } },
    }),
    getLeaderboard(),
  ]);
  if (!user) notFound();

  const rank = board.rows.find((r) => r.userId === user.id)?.rank;
  // A player's own ledger is shown only on their own /me page.
  return (
    <PlayerProfile
      user={user}
      isSelf={user.id === me.id}
      rank={rank}
      totalPlayers={board.rows.length}
    />
  );
}
