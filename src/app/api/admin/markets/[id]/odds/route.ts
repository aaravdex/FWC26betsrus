import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { updateOddsSchema } from "@/lib/validation";
import { requireApiAdmin, readJson } from "@/lib/api";
import { errorResponse, HttpError } from "@/lib/errors";

// Edit decimal odds for one or more outcomes of a market. Editing odds NEVER
// changes already-placed bets — those locked in the odds that were live when
// they were made.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiAdmin();
    const { id } = await params;
    const { odds } = updateOddsSchema.parse(await readJson(req));

    const market = await prisma.market.findUnique({ where: { id }, include: { outcomes: true } });
    if (!market) throw new HttpError(404, "Market not found");
    if (market.status === "SETTLED") throw new HttpError(409, "Cannot edit odds on a settled market");

    const byId = new Map(market.outcomes.map((o) => [o.id, o]));
    for (const u of odds) {
      if (!byId.has(u.outcomeId)) throw new HttpError(400, "An outcome does not belong to this market");
    }

    // Only write outcomes whose value actually changed. Record the prior value +
    // timestamp so the UI can show a green-up / red-down arrow vs the previous
    // odds. Already-placed bets are untouched (they locked their own odds).
    const now = new Date();
    const updates = [];
    for (const u of odds) {
      const current = byId.get(u.outcomeId)!;
      const next = new Prisma.Decimal(u.odds);
      if (current.odds.equals(next)) continue;
      updates.push(
        prisma.outcome.update({
          where: { id: u.outcomeId },
          data: { odds: next, previousOdds: current.odds, oddsUpdatedAt: now },
        }),
      );
    }
    if (updates.length > 0) await prisma.$transaction(updates);

    return NextResponse.json({ ok: true, changed: updates.length });
  } catch (err) {
    return errorResponse(err);
  }
}
