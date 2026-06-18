import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAdmin } from "@/lib/api";
import { errorResponse, HttpError } from "@/lib/errors";

// Admin soft-delete a chat message. The row is kept for audit; the UI hides the
// body and shows "removed by an admin".
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireApiAdmin();
    const { id } = await params;

    const existing = await prisma.chatMessage.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Message not found");

    if (!existing.deletedAt) {
      await prisma.chatMessage.update({
        where: { id },
        data: { deletedAt: new Date(), deletedById: admin.id },
      });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
