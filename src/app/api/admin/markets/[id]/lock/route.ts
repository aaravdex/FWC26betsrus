import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateMarketLockSchema } from "@/lib/validation";
import { requireApiAdmin, readJson } from "@/lib/api";
import { errorResponse, HttpError } from "@/lib/errors";

// Set a market's lock datetime (the Round of 16 group-stage lock). Betting on
// the market closes at this instant, mirroring the tournament-level markets.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiAdmin();
    const { id } = await params;
    const { locksAt } = updateMarketLockSchema.parse(await readJson(req));

    const market = await prisma.market.findUnique({ where: { id } });
    if (!market) throw new HttpError(404, "Market not found");
    if (market.status === "SETTLED") throw new HttpError(409, "This market is already settled");

    await prisma.market.update({ where: { id }, data: { locksAt } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
