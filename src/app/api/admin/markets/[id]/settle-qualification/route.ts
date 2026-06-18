import { settleQualificationSchema } from "@/lib/validation";
import { settleQualificationMarket } from "@/lib/markets";
import { requireApiAdmin, readJson, json } from "@/lib/api";
import { errorResponse } from "@/lib/errors";

// Settle the Round of 16 market: mark the teams that qualified; the rest lose.
// Idempotent — a second call is refused by the settlement guard.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiAdmin();
    const { id } = await params;
    const { qualifiedOutcomeIds } = settleQualificationSchema.parse(await readJson(req));

    const summary = await settleQualificationMarket({ marketId: id, qualifiedOutcomeIds });
    return json({ ok: true, ...summary });
  } catch (err) {
    return errorResponse(err);
  }
}
