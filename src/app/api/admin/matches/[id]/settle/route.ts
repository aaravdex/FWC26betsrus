import { settleMatchSchema } from "@/lib/validation";
import { settleMatch } from "@/lib/markets";
import { requireApiAdmin, readJson, json } from "@/lib/api";
import { errorResponse } from "@/lib/errors";

// Enter the final score; settles the match-winner market and pays out winning
// bets through the ledger. Idempotent — a second call is refused.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiAdmin();
    const { id } = await params;
    const { homeScore, awayScore } = settleMatchSchema.parse(await readJson(req));

    const result = await settleMatch({ matchId: id, homeScore, awayScore });
    return json({ ok: true, ...result });
  } catch (err) {
    return errorResponse(err);
  }
}
