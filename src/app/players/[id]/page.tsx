import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PlayerProfile } from "@/components/PlayerProfile";

export const dynamic = "force-dynamic";

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: { bets: { include: { market: true, outcome: true }, orderBy: { placedAt: "desc" } } },
  });
  if (!user) notFound();

  // A player's own ledger is shown only on their own /me page.
  return <PlayerProfile user={user} isSelf={user.id === me.id} />;
}
