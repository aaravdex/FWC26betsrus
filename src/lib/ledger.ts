import type { Prisma, LedgerType } from "@prisma/client";

export class InsufficientFundsError extends Error {
  constructor(message = "Insufficient points balance") {
    super(message);
    this.name = "InsufficientFundsError";
  }
}

type ApplyArgs = {
  userId: string;
  amount: bigint; // signed; negative removes points
  type: LedgerType;
  description: string;
  betId?: string;
};

/**
 * Apply one balance movement INSIDE a transaction.
 *
 * - Updates the cached User.balance atomically. For deductions we use a guarded
 *   updateMany (balance >= |amount|) so two concurrent stakes can never drive a
 *   balance negative — if the guard fails we throw InsufficientFundsError.
 * - Writes the append-only LedgerEntry with a balanceAfter snapshot.
 *
 * The ledger is the source of truth; User.balance is a cache that always equals
 * SUM(ledger.amount) because both are written together here.
 */
export async function applyLedgerEntry(
  tx: Prisma.TransactionClient,
  { userId, amount, type, description, betId }: ApplyArgs,
) {
  if (typeof amount !== "bigint") {
    throw new Error("Ledger amounts must be bigint points");
  }
  if (amount === 0n) {
    throw new Error("Ledger amount cannot be zero");
  }

  if (amount < 0n) {
    const res = await tx.user.updateMany({
      where: { id: userId, balance: { gte: -amount } },
      data: { balance: { increment: amount } },
    });
    if (res.count === 0) {
      throw new InsufficientFundsError();
    }
  } else {
    await tx.user.update({
      where: { id: userId },
      data: { balance: { increment: amount } },
    });
  }

  const user = await tx.user.findUniqueOrThrow({
    where: { id: userId },
    select: { balance: true },
  });

  const entry = await tx.ledgerEntry.create({
    data: {
      userId,
      amount,
      type,
      description,
      betId,
      balanceAfter: user.balance,
    },
  });

  return { entry, balanceAfter: user.balance };
}
