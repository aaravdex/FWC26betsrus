import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTeamSchema } from "@/lib/validation";
import { requireApiAdmin, readJson } from "@/lib/api";
import { errorResponse, HttpError } from "@/lib/errors";

export async function POST(req: Request) {
  try {
    await requireApiAdmin();
    const { name, code, group } = createTeamSchema.parse(await readJson(req));

    const existing = await prisma.team.findUnique({ where: { code } });
    if (existing) throw new HttpError(400, `A team with code ${code} already exists`);

    const team = await prisma.team.create({ data: { name, code, group } });
    return NextResponse.json({ ok: true, team });
  } catch (err) {
    return errorResponse(err);
  }
}
