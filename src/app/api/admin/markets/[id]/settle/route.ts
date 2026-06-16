import { settleMarketSchema } from "@/lib/validation";
import { settleMarketByOutcome } from "@/lib/markets";
import { requireApiAdmin, readJson, json } from "@/lib/api";
import { errorResponse } from "@/lib/errors";

// Settle a tournament-level market (winner / top scorer) by choosing the
// winning outcome. Idempotent — a second call is refused.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiAdmin();
    const { id } = await params;
    const { winningOutcomeId } = settleMarketSchema.parse(await readJson(req));

    const summary = await settleMarketByOutcome({ marketId: id, winningOutcomeId });
    return json({ ok: true, ...summary });
  } catch (err) {
    return errorResponse(err);
  }
}
