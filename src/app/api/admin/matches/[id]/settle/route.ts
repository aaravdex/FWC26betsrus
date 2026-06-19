import { settleMatchSchema } from "@/lib/validation";
import { settleMatch } from "@/lib/markets";
import { requireApiAdmin, readJson, json } from "@/lib/api";
import { errorResponse } from "@/lib/errors";
import { getRankSnapshot, notifyMarketSettled } from "@/lib/notifications";

// Enter the final score; settles the match-winner market and pays out winning
// bets through the ledger. Idempotent — a second call is refused.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiAdmin();
    const { id } = await params;
    const { homeScore, awayScore } = settleMatchSchema.parse(await readJson(req));

    const before = await getRankSnapshot();
    const result = await settleMatch({ matchId: id, homeScore, awayScore });
    // In-app notifications for each bettor + any rank moves (best-effort).
    for (const s of result.summaries) await notifyMarketSettled(s.marketId, before);
    return json({ ok: true, ...result });
  } catch (err) {
    return errorResponse(err);
  }
}
