import { cancelMatchSchema } from "@/lib/validation";
import { cancelMatch } from "@/lib/markets";
import { requireApiAdmin, readJson, json } from "@/lib/api";
import { errorResponse } from "@/lib/errors";
import { notifyMarketVoided } from "@/lib/notifications";

// Cancel a match: voids its markets, refunds every open stake through the
// ledger (REFUND entries document each refund), and marks the match CANCELLED.
// Bets and the match row are preserved — nothing is hard-deleted.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiAdmin();
    const { id } = await params;
    cancelMatchSchema.parse(await readJson(req));

    const result = await cancelMatch(id);
    for (const marketId of result.voidedMarketIds) await notifyMarketVoided(marketId);
    return json({ ok: true, ...result });
  } catch (err) {
    return errorResponse(err);
  }
}
