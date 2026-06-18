import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { marketStatusSchema } from "@/lib/validation";
import { requireApiAdmin, readJson } from "@/lib/api";
import { errorResponse, HttpError } from "@/lib/errors";

// Suspend / resume betting on a market (reversible). Suspending shows a
// "betting paused" overlay; resuming restores it. Cannot touch a locked or
// settled market.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiAdmin();
    const { id } = await params;
    const { status } = marketStatusSchema.parse(await readJson(req));

    const market = await prisma.market.findUnique({ where: { id } });
    if (!market) throw new HttpError(404, "Market not found");
    if (market.status !== "OPEN" && market.status !== "SUSPENDED") {
      throw new HttpError(409, `Cannot change a ${market.status.toLowerCase()} market`);
    }

    await prisma.market.update({ where: { id }, data: { status } });
    return NextResponse.json({ ok: true, status });
  } catch (err) {
    return errorResponse(err);
  }
}
