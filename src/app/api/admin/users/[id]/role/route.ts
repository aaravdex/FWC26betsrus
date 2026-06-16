import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateRoleSchema } from "@/lib/validation";
import { requireApiAdmin, readJson } from "@/lib/api";
import { errorResponse, HttpError } from "@/lib/errors";

// Promote a player to admin (or demote back). Manual role management, as an
// alternative/complement to the ADMIN_EMAILS allowlist.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireApiAdmin();
    const { id } = await params;
    const { role } = updateRoleSchema.parse(await readJson(req));

    if (id === admin.id) {
      throw new HttpError(400, "You can’t change your own role");
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) throw new HttpError(404, "User not found");

    const updated = await prisma.user.update({ where: { id }, data: { role } });
    return NextResponse.json({ ok: true, role: updated.role });
  } catch (err) {
    return errorResponse(err);
  }
}
