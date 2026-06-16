import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validation";
import { setUserPassword } from "@/lib/auth";
import { requireApiAdmin, readJson } from "@/lib/api";
import { errorResponse, HttpError } from "@/lib/errors";

// Admin-only password reset (there is no email, so no self-service reset).
// Setting a new password also invalidates the target's existing sessions.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiAdmin();
    const { id } = await params;
    const { password } = resetPasswordSchema.parse(await readJson(req));

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) throw new HttpError(404, "User not found");

    await setUserPassword(id, password);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
