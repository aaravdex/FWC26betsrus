import { voidMarket } from "@/lib/markets";
import { requireApiAdmin, json } from "@/lib/api";
import { errorResponse } from "@/lib/errors";

// Void/cancel a market: refunds every open bet's stake through the ledger.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiAdmin();
    const { id } = await params;
    const result = await voidMarket(id);
    return json({ ok: true, ...result });
  } catch (err) {
    return errorResponse(err);
  }
}
