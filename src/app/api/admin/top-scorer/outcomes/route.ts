import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { addTopScorerOutcomeSchema } from "@/lib/validation";
import { ensureSingletonMarket } from "@/lib/markets";
import { requireApiAdmin, readJson } from "@/lib/api";
import { errorResponse, HttpError } from "@/lib/errors";

// Add (or re-price) a player in the top-scorer market.
export async function POST(req: Request) {
  try {
    await requireApiAdmin();
    const { playerId, odds } = addTopScorerOutcomeSchema.parse(await readJson(req));

    const player = await prisma.player.findUnique({ where: { id: playerId } });
    if (!player) throw new HttpError(400, "That player does not exist");

    const market = await ensureSingletonMarket("TOP_SCORER");
    if (market.status === "SETTLED") throw new HttpError(409, "The top-scorer market is settled");

    const selectionKey = `PLAYER:${playerId}`;
    await prisma.outcome.upsert({
      where: { marketId_selectionKey: { marketId: market.id, selectionKey } },
      update: { odds: new Prisma.Decimal(odds), label: player.name },
      create: { marketId: market.id, selectionKey, label: player.name, odds: new Prisma.Decimal(odds), playerId },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
