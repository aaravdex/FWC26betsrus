import { Prisma } from "@prisma/client";
import { formatOddsNum } from "@/lib/points";

// Server-side, BigInt-exact money math. Points are whole bigints; odds are
// decimals with at most 2 dp. A payout is round(stake * odds), computed without
// floating point: we scale odds to integer hundredths and divide with rounding.
// The result is stored on the bet at placement time, so settlement is exactly
// reproducible.

export { formatPoints, formatPointsSigned } from "@/lib/points";

export type DecimalLike = Prisma.Decimal | number | string;

export function oddsToNumber(odds: DecimalLike): number {
  if (odds instanceof Prisma.Decimal) return odds.toNumber();
  return typeof odds === "string" ? Number.parseFloat(odds) : odds;
}

/** round(stake * odds) — the points credited if the bet wins (stake included). */
export function computePotentialReturn(stake: bigint, odds: DecimalLike): bigint {
  // Integer hundredths of the odds, e.g. 6.99 -> 699n, 50000.00 -> 5000000n.
  const hundredths = BigInt(new Prisma.Decimal(odds).times(100).toFixed(0));
  const product = stake * hundredths; // = stake * odds * 100
  // Round half up to the nearest whole point. stake, odds are non-negative.
  return (product + 50n) / 100n;
}

/** Net profit shown alongside the return: potentialReturn - stake. */
export function computeProfit(stake: bigint, odds: DecimalLike): bigint {
  return computePotentialReturn(stake, odds) - stake;
}

/** Decimal odds always shown with 2 dp: "1.25", "7.50". */
export function formatOdds(odds: DecimalLike): string {
  return formatOddsNum(oddsToNumber(odds));
}
