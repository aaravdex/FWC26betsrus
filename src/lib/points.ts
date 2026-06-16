// Client-safe points/odds helpers. No Prisma / server imports, so this module
// can be used inside "use client" components without bloating the bundle.
//
// Points can be bigint (server values) or number (client-side previews). Both
// are accepted for formatting.

const pointsFormatter = new Intl.NumberFormat("en-US");

/** "1,000 pts" — always labelled so play-money is never mistaken for cash. */
export function formatPoints(n: bigint | number): string {
  return `${pointsFormatter.format(n)} pts`;
}

/** Signed variant for ledger rows: "+250 pts" / "-100 pts". */
export function formatPointsSigned(n: bigint | number): string {
  const positive = typeof n === "bigint" ? n > 0n : n > 0;
  const sign = positive ? "+" : "";
  return `${sign}${pointsFormatter.format(n)} pts`;
}

/** Decimal odds always shown with 2 dp: "1.25", "7.50". */
export function formatOddsNum(odds: number): string {
  return odds.toFixed(2);
}

/**
 * round(stake * odds) — points credited if the bet wins (stake included).
 * Client-side preview only; the server recomputes this exactly with bigint at
 * placement time and stores it on the bet.
 */
export function returnForStake(stake: number, oddsNum: number): number {
  return Math.round(stake * oddsNum);
}
