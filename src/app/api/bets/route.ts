import { placeBetSchema } from "@/lib/validation";
import { placeBet } from "@/lib/markets";
import { requireApiUser, readJson, json } from "@/lib/api";
import { errorResponse } from "@/lib/errors";

// Place a bet on one outcome. Validates the stake, enforces the lock window,
// snapshots the odds, deducts the stake through the ledger — all atomically.
export async function POST(req: Request) {
  try {
    const user = await requireApiUser();
    const { outcomeId, stake } = placeBetSchema.parse(await readJson(req));
    const result = await placeBet({ userId: user.id, outcomeId, stake: BigInt(stake) });
    // result carries bigint points -> json() serializes them as strings.
    return json({ ok: true, ...result });
  } catch (err) {
    return errorResponse(err);
  }
}
