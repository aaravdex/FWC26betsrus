import { Prisma } from "@prisma/client";
import { oddsToNumber } from "@/lib/money";
import { marketBettingClosed, lockReason } from "@/lib/markets";

// Prisma payload with everything a market panel needs.
export type MarketWithBets = Prisma.MarketGetPayload<{
  include: { outcomes: true; bets: { include: { user: true } } };
}>;

export type OutcomeView = {
  id: string;
  label: string;
  odds: number;
  previousOdds: number | null;
  result: string;
};

export type BetView = {
  id: string;
  playerId: string;
  playerName: string;
  outcomeLabel: string;
  stake: bigint;
  potentialReturn: bigint;
  status: string;
};

export type MarketView = {
  id: string;
  kind: string;
  title: string;
  status: string;
  locked: boolean;
  lockLabel: string | null;
  outcomes: OutcomeView[];
  bets: BetView[];
  totalStaked: bigint;
};

/**
 * Convert a Prisma market (with outcomes + bets + bettors) into a plain view
 * model. Odds Decimals become numbers; point bigints stay bigint (React can
 * serialize bigint across the server/client boundary).
 */
export function toMarketView(market: MarketWithBets, now = new Date()): MarketView {
  const outcomeLabelById = new Map(market.outcomes.map((o) => [o.id, o.label]));

  const bets: BetView[] = market.bets
    .slice()
    .sort((a, b) => b.placedAt.getTime() - a.placedAt.getTime())
    .map((b) => ({
      id: b.id,
      playerId: b.userId,
      playerName: b.user.username,
      outcomeLabel: outcomeLabelById.get(b.outcomeId) ?? "—",
      stake: b.stake,
      potentialReturn: b.potentialReturn,
      status: b.status,
    }));

  return {
    id: market.id,
    kind: market.kind,
    title: market.title,
    status: market.status,
    locked: marketBettingClosed(market, now),
    lockLabel: lockReason(market, now),
    outcomes: market.outcomes.map((o) => ({
      id: o.id,
      label: o.label,
      odds: oddsToNumber(o.odds),
      previousOdds: o.previousOdds ? oddsToNumber(o.previousOdds) : null,
      result: o.result,
    })),
    bets,
    totalStaked: market.bets.reduce((sum, b) => sum + b.stake, 0n),
  };
}

export const marketInclude = {
  outcomes: { orderBy: { odds: "asc" } },
  bets: { include: { user: true } },
} satisfies Prisma.MarketInclude;

/** Where a market lives in the UI, for linking bets back to their page. */
export function marketHref(kind: string, matchId: string | null): string | null {
  switch (kind) {
    case "MATCH_WINNER":
      return matchId ? `/matches/${matchId}` : null;
    case "TOURNAMENT_WINNER":
      return "/tournament";
    case "TOP_SCORER":
      return "/top-scorer";
    default:
      return null;
  }
}
