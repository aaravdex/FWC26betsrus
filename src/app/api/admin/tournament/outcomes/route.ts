import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { addTournamentOutcomeSchema } from "@/lib/validation";
import { ensureSingletonMarket } from "@/lib/markets";
import { requireApiAdmin, readJson } from "@/lib/api";
import { errorResponse, HttpError } from "@/lib/errors";

// Add (or re-price) a team in the tournament-winner market.
export async function POST(req: Request) {
  try {
    await requireApiAdmin();
    const { teamId, odds } = addTournamentOutcomeSchema.parse(await readJson(req));

    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new HttpError(400, "That team does not exist");

    const market = await ensureSingletonMarket("TOURNAMENT_WINNER");
    if (market.status === "SETTLED") throw new HttpError(409, "The tournament-winner market is settled");

    const selectionKey = `TEAM:${teamId}`;
    await prisma.outcome.upsert({
      where: { marketId_selectionKey: { marketId: market.id, selectionKey } },
      update: { odds: new Prisma.Decimal(odds), label: team.name },
      create: { marketId: market.id, selectionKey, label: team.name, odds: new Prisma.Decimal(odds), teamId },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
