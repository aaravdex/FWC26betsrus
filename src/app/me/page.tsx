import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PlayerProfile } from "@/components/PlayerProfile";

export const dynamic = "force-dynamic";

export default async function MePage() {
  const me = await requireUser();

  const [user, ledger] = await Promise.all([
    prisma.user.findUnique({
      where: { id: me.id },
      include: { bets: { include: { market: true, outcome: true }, orderBy: { placedAt: "desc" } } },
    }),
    prisma.ledgerEntry.findMany({
      where: { userId: me.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  if (!user) return null;

  return <PlayerProfile user={user} ledger={ledger} isSelf />;
}
