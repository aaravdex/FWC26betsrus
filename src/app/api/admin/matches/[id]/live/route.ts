import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateLiveSchema } from "@/lib/validation";
import { requireApiAdmin, readJson } from "@/lib/api";
import { errorResponse, HttpError } from "@/lib/errors";

// Live Match Center: admin sets play status, minute and the current score.
// (Final settlement of bets is a separate action and is unaffected here.)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiAdmin();
    const { id } = await params;
    const data = updateLiveSchema.parse(await readJson(req));

    const match = await prisma.match.findUnique({ where: { id } });
    if (!match) throw new HttpError(404, "Match not found");

    await prisma.match.update({
      where: { id },
      data: {
        ...(data.liveStatus !== undefined ? { liveStatus: data.liveStatus } : {}),
        ...(data.minute !== undefined ? { minute: data.minute } : {}),
        ...(data.homeScore !== undefined ? { homeScore: data.homeScore } : {}),
        ...(data.awayScore !== undefined ? { awayScore: data.awayScore } : {}),
      },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
