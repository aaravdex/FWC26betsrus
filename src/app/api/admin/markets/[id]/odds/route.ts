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

    const valid = new Set(market.outcomes.map((o) => o.id));
    for (const u of odds) {
      if (!valid.has(u.outcomeId)) throw new HttpError(400, "An outcome does not belong to this market");
    }

    await prisma.$transaction(
      odds.map((u) =>
        prisma.outcome.update({
          where: { id: u.outcomeId },
          data: { odds: new Prisma.Decimal(u.odds) },
        }),
      ),
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
