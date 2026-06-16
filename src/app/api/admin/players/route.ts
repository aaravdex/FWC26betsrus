import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPlayerSchema } from "@/lib/validation";
import { requireApiAdmin, readJson } from "@/lib/api";
import { errorResponse, HttpError } from "@/lib/errors";

export async function POST(req: Request) {
  try {
    await requireApiAdmin();
    const { name, teamId, position } = createPlayerSchema.parse(await readJson(req));

    if (teamId) {
      const team = await prisma.team.findUnique({ where: { id: teamId } });
      if (!team) throw new HttpError(400, "That team does not exist");
    }

    const player = await prisma.player.create({ data: { name, teamId, position } });
    return NextResponse.json({ ok: true, player });
  } catch (err) {
    return errorResponse(err);
  }
}
