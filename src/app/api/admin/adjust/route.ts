import { prisma } from "@/lib/prisma";
import { adjustBalanceSchema } from "@/lib/validation";
import { applyLedgerEntry } from "@/lib/ledger";
import { requireApiAdmin, readJson, json } from "@/lib/api";
import { errorResponse, HttpError } from "@/lib/errors";

// Manual ledger correction (e.g. fixing a mistake, awarding bonus points).
// Flows through the same ledger so balances stay reconstructable.
export async function POST(req: Request) {
  try {
    await requireApiAdmin();
    const { userId, amount, description } = adjustBalanceSchema.parse(await readJson(req));

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) throw new HttpError(404, "User not found");

    const { balanceAfter } = await prisma.$transaction((tx) =>
      applyLedgerEntry(tx, {
        userId,
        amount: BigInt(amount),
        type: "ADJUSTMENT",
        description: `Admin adjustment: ${description}`,
      }),
    );

    return json({ ok: true, balanceAfter });
  } catch (err) {
    return errorResponse(err);
  }
}
