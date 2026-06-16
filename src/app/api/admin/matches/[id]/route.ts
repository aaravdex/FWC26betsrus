import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiAdmin, readJson } from "@/lib/api";
import { errorResponse, HttpError } from "@/lib/errors";

const patchSchema = z.object({
  kickoff: z.coerce.date().optional(),
  action: z.enum(["lock", "unlock"]).optional(),
});

// Update a match: reschedule kickoff (syncing market lock times) and/or
// manually lock/unlock betting on its markets.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiAdmin();
    const { id } = await params;
    const { kickoff, action } = patchSchema.parse(await readJson(req));

    const match = await prisma.match.findUnique({ where: { id } });
    if (!match) throw new HttpError(404, "Match not found");
    if (match.status === "SETTLED") throw new HttpError(409, "This match is already settled");

    await prisma.$transaction(async (tx) => {
      if (kickoff) {
        await tx.match.update({ where: { id }, data: { kickoff } });
        // Keep match-market lock times in sync with the new kickoff.
        await tx.market.updateMany({
          where: { matchId: id, status: { not: "SETTLED" } },
          data: { locksAt: kickoff },
        });
      }
      if (action === "lock") {
        await tx.match.update({ where: { id }, data: { status: "LOCKED" } });
        await tx.market.updateMany({
          where: { matchId: id, status: "OPEN" },
          data: { status: "LOCKED" },
        });
      } else if (action === "unlock") {
        await tx.match.update({ where: { id }, data: { status: "SCHEDULED" } });
        await tx.market.updateMany({
          where: { matchId: id, status: "LOCKED" },
          data: { status: "OPEN" },
        });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
