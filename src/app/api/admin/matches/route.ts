import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createMatchSchema } from "@/lib/validation";
import { createMatchMarkets } from "@/lib/markets";
import { requireApiAdmin, readJson } from "@/lib/api";
import { errorResponse, HttpError } from "@/lib/errors";

// Create a match and auto-scaffold its match-winner market (Team A / Draw /
// Team B). The admin edits the odds and kickoff afterwards.
export async function POST(req: Request) {
  try {
    await requireApiAdmin();
    const data = createMatchSchema.parse(await readJson(req));

    const [home, away] = await Promise.all([
      prisma.team.findUnique({ where: { id: data.homeTeamId } }),
      prisma.team.findUnique({ where: { id: data.awayTeamId } }),
    ]);
    if (!home || !away) throw new HttpError(400, "Both teams must exist");

    const matchId = await prisma.$transaction(async (tx) => {
      const match = await tx.match.create({
        data: { homeTeamId: home.id, awayTeamId: away.id, kickoff: data.kickoff },
      });
      await createMatchMarkets(tx, match, {
        home: { name: home.name },
        away: { name: away.name },
        homeOdds: data.homeOdds,
        drawOdds: data.drawOdds,
        awayOdds: data.awayOdds,
      });
      return match.id;
    });

    return NextResponse.json({ ok: true, matchId });
  } catch (err) {
    return errorResponse(err);
  }
}
