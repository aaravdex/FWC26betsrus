import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addMatchEventSchema } from "@/lib/validation";
import { requireApiAdmin, readJson } from "@/lib/api";
import { errorResponse, HttpError } from "@/lib/errors";

// Append a timeline event (goal/card/sub/etc.) to a match. Admin-entered only —
// no external feed.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiAdmin();
    const { id } = await params;
    const data = addMatchEventSchema.parse(await readJson(req));

    const match = await prisma.match.findUnique({ where: { id } });
    if (!match) throw new HttpError(404, "Match not found");

    if (data.teamId && data.teamId !== match.homeTeamId && data.teamId !== match.awayTeamId) {
      throw new HttpError(400, "That team is not in this match");
    }

    const event = await prisma.matchEvent.create({
      data: {
        matchId: id,
        type: data.type,
        minute: data.minute ?? null,
        teamId: data.teamId ?? null,
        description: data.description?.trim() || null,
      },
    });
    return NextResponse.json({ ok: true, eventId: event.id });
  } catch (err) {
    return errorResponse(err);
  }
}
