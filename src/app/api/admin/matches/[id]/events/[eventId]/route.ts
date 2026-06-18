import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAdmin } from "@/lib/api";
import { errorResponse, HttpError } from "@/lib/errors";

// Remove a timeline event (admin correction).
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; eventId: string }> },
) {
  try {
    await requireApiAdmin();
    const { id, eventId } = await params;

    const event = await prisma.matchEvent.findUnique({ where: { id: eventId } });
    if (!event || event.matchId !== id) throw new HttpError(404, "Event not found");

    await prisma.matchEvent.delete({ where: { id: eventId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
