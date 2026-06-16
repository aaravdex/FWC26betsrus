import { prisma } from "@/lib/prisma";
import { updateTournamentSettingsSchema } from "@/lib/validation";
import { requireApiAdmin, readJson, json } from "@/lib/api";
import { errorResponse } from "@/lib/errors";

// Update tournament name / start time / starting balance. Changing the start
// time re-syncs the lock time on the (unsettled) tournament-level markets.
export async function PATCH(req: Request) {
  try {
    await requireApiAdmin();
    const { name, startsAt, startingBalance } = updateTournamentSettingsSchema.parse(await readJson(req));
    const startingBalanceBig = startingBalance === undefined ? undefined : BigInt(startingBalance);

    const settings = await prisma.tournamentSettings.upsert({
      where: { id: 1 },
      update: { name, startsAt, startingBalance: startingBalanceBig },
      create: {
        id: 1,
        name: name ?? "World Cup 2026",
        startsAt,
        startingBalance: startingBalanceBig ?? 1000n,
      },
    });

    await prisma.market.updateMany({
      where: { kind: { in: ["TOURNAMENT_WINNER", "TOP_SCORER"] }, status: { not: "SETTLED" } },
      data: { locksAt: startsAt },
    });

    return json({ ok: true, settings });
  } catch (err) {
    return errorResponse(err);
  }
}
