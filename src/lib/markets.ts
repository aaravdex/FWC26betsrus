import type { Market, Match, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { applyLedgerEntry } from "@/lib/ledger";
import { computePotentialReturn } from "@/lib/money";
import { HttpError } from "@/lib/errors";

// --- Lock logic -------------------------------------------------------------

type LockCheckMarket = Pick<Market, "status" | "locksAt">;

/** True when no new bets may be placed (manually locked/settled, or time passed). */
export function marketBettingClosed(market: LockCheckMarket, now = new Date()): boolean {
  return market.status !== "OPEN" || market.locksAt.getTime() <= now.getTime();
}

export function lockReason(market: LockCheckMarket, now = new Date()): string | null {
  if (market.status === "SETTLED") return "This market is settled";
  if (market.status === "SUSPENDED") return "Betting paused";
  if (market.status === "LOCKED") return "This market is locked";
  if (market.locksAt.getTime() <= now.getTime()) return "Betting has closed";
  return null;
}

// --- Placing a bet ----------------------------------------------------------

export type PlaceBetResult = {
  betId: string;
  stake: bigint;
  oddsAtPlacement: string;
  potentialReturn: bigint;
  newBalance: bigint;
};

/**
 * Place a bet on a single outcome:
 *  1. Verify the market is still open for betting (status + lock time).
 *  2. Snapshot the odds and compute the potential return.
 *  3. Create the bet, then deduct the stake through the ledger (which enforces
 *     balance >= stake atomically). All in one transaction.
 */
export async function placeBet(args: {
  userId: string;
  outcomeId: string;
  stake: bigint;
}): Promise<PlaceBetResult> {
  const { userId, outcomeId, stake } = args;

  if (typeof stake !== "bigint" || stake <= 0n) {
    throw new HttpError(400, "Stake must be a positive whole number of points");
  }

  return prisma.$transaction(async (tx) => {
    const outcome = await tx.outcome.findUnique({
      where: { id: outcomeId },
      include: { market: { include: { match: true } } },
    });
    if (!outcome) {
      throw new HttpError(404, "That outcome no longer exists");
    }

    const { market } = outcome;

    // Lock enforcement — both the market's own lock time and, for match
    // markets, the match status (kickoff auto-locks betting).
    if (marketBettingClosed(market)) {
      throw new HttpError(409, lockReason(market) ?? "Betting is closed for this market");
    }
    if (market.match && market.match.status !== "SCHEDULED") {
      throw new HttpError(409, "This match is locked — betting has closed");
    }

    const potentialReturn = computePotentialReturn(stake, outcome.odds);

    const bet = await tx.bet.create({
      data: {
        userId,
        marketId: market.id,
        outcomeId: outcome.id,
        stake,
        oddsAtPlacement: outcome.odds,
        potentialReturn,
        status: "OPEN",
      },
    });

    // Deduct the stake. Throws InsufficientFundsError -> rolls back the bet.
    const { balanceAfter } = await applyLedgerEntry(tx, {
      userId,
      amount: -stake,
      type: "STAKE",
      description: `Stake on "${outcome.label}" — ${market.title}`,
      betId: bet.id,
    });

    return {
      betId: bet.id,
      stake,
      oddsAtPlacement: outcome.odds.toFixed(2),
      potentialReturn,
      newBalance: balanceAfter,
    };
  });
}

// --- Settlement -------------------------------------------------------------

export type SettleSummary = {
  marketId: string;
  wonBets: number;
  lostBets: number;
  pointsPaid: bigint;
};

/**
 * Settle one market given a predicate identifying winning outcomes. Idempotent:
 * the market is atomically claimed (status -> SETTLED) up front; a second call
 * sees it already settled and refuses, so payouts can never double-apply. Only
 * bets still OPEN are paid, which is a second independent guard.
 *
 * Must be called inside a transaction.
 */
async function settleMarketCore(
  tx: Prisma.TransactionClient,
  marketId: string,
  isWinner: (outcome: { id: string; selectionKey: string }) => boolean,
): Promise<SettleSummary> {
  // Atomic claim: only one settlement can flip OPEN/LOCKED -> SETTLED.
  const claim = await tx.market.updateMany({
    where: { id: marketId, status: { not: "SETTLED" } },
    data: { status: "SETTLED", settledAt: new Date() },
  });
  if (claim.count === 0) {
    throw new HttpError(409, "This market is already settled");
  }

  const outcomes = await tx.outcome.findMany({ where: { marketId } });
  const winningIds = new Set<string>();
  for (const o of outcomes) {
    const won = isWinner(o);
    if (won) winningIds.add(o.id);
    await tx.outcome.update({
      where: { id: o.id },
      data: { result: won ? "WON" : "LOST" },
    });
  }

  // Only OPEN bets are processed — already-settled bets are never touched.
  const bets = await tx.bet.findMany({ where: { marketId, status: "OPEN" } });

  let wonBets = 0;
  let lostBets = 0;
  let pointsPaid = 0n;

  for (const bet of bets) {
    if (winningIds.has(bet.outcomeId)) {
      await tx.bet.update({
        where: { id: bet.id },
        data: { status: "WON", settledAt: new Date() },
      });
      await applyLedgerEntry(tx, {
        userId: bet.userId,
        amount: bet.potentialReturn,
        type: "PAYOUT",
        description: `Winning payout — bet ${bet.id}`,
        betId: bet.id,
      });
      wonBets += 1;
      pointsPaid += bet.potentialReturn;
    } else {
      // Loss: the stake was already removed at placement, nothing more to debit.
      await tx.bet.update({
        where: { id: bet.id },
        data: { status: "LOST", settledAt: new Date() },
      });
      lostBets += 1;
    }
  }

  return { marketId, wonBets, lostBets, pointsPaid };
}

/** Settle a match: derive the result for its match-winner market from the score. */
export async function settleMatch(args: {
  matchId: string;
  homeScore: number;
  awayScore: number;
}): Promise<{ summaries: SettleSummary[] }> {
  const { matchId, homeScore, awayScore } = args;

  return prisma.$transaction(async (tx) => {
    const match = await tx.match.findUnique({
      where: { id: matchId },
      include: { markets: true },
    });
    if (!match) throw new HttpError(404, "Match not found");
    if (match.status === "SETTLED") {
      throw new HttpError(409, "This match is already settled");
    }

    const matchWinnerKey =
      homeScore > awayScore ? "HOME" : homeScore < awayScore ? "AWAY" : "DRAW";

    const summaries: SettleSummary[] = [];

    for (const market of match.markets) {
      if (market.status === "SETTLED") continue; // already settled individually
      if (market.kind === "MATCH_WINNER") {
        summaries.push(
          await settleMarketCore(tx, market.id, (o) => o.selectionKey === matchWinnerKey),
        );
      }
    }

    await tx.match.update({
      where: { id: matchId },
      data: { homeScore, awayScore, status: "SETTLED", settledAt: new Date() },
    });

    return { summaries };
  });
}

/** Settle a tournament-level market (winner / top scorer) by chosen outcome. */
export async function settleMarketByOutcome(args: {
  marketId: string;
  winningOutcomeId: string;
}): Promise<SettleSummary> {
  const { marketId, winningOutcomeId } = args;

  return prisma.$transaction(async (tx) => {
    const market = await tx.market.findUnique({
      where: { id: marketId },
      include: { outcomes: true },
    });
    if (!market) throw new HttpError(404, "Market not found");

    const winner = market.outcomes.find((o) => o.id === winningOutcomeId);
    if (!winner) {
      throw new HttpError(400, "That outcome does not belong to this market");
    }

    return settleMarketCore(tx, marketId, (o) => o.id === winningOutcomeId);
  });
}

/**
 * Void a market: refund every open bet's stake and mark the market settled with
 * no winners. Idempotent via the same atomic claim. Used to cancel a market.
 */
export async function voidMarket(
  marketId: string,
): Promise<{ refunded: number; pointsRefunded: bigint }> {
  return prisma.$transaction(async (tx) => {
    const claim = await tx.market.updateMany({
      where: { id: marketId, status: { not: "SETTLED" } },
      data: { status: "SETTLED", settledAt: new Date() },
    });
    if (claim.count === 0) {
      throw new HttpError(409, "This market is already settled");
    }

    await tx.outcome.updateMany({ where: { marketId }, data: { result: "VOID" } });

    const bets = await tx.bet.findMany({ where: { marketId, status: "OPEN" } });
    let pointsRefunded = 0n;
    for (const bet of bets) {
      await tx.bet.update({
        where: { id: bet.id },
        data: { status: "VOID", settledAt: new Date() },
      });
      await applyLedgerEntry(tx, {
        userId: bet.userId,
        amount: bet.stake,
        type: "REFUND",
        description: `Refund — voided market (bet ${bet.id})`,
        betId: bet.id,
      });
      pointsRefunded += bet.stake;
    }

    return { refunded: bets.length, pointsRefunded };
  });
}

// --- Singleton tournament-level markets ------------------------------------

/** Find (or lazily create) the single tournament-winner / top-scorer market. */
export async function ensureSingletonMarket(
  kind: "TOURNAMENT_WINNER" | "TOP_SCORER",
): Promise<Market> {
  const existing = await prisma.market.findFirst({ where: { kind } });
  if (existing) return existing;

  const settings = await prisma.tournamentSettings.findUnique({ where: { id: 1 } });
  const locksAt = settings?.startsAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const title =
    kind === "TOURNAMENT_WINNER"
      ? "Tournament winner — who lifts the World Cup?"
      : "Top scorer — most goals in the tournament";

  return prisma.market.create({ data: { kind, title, locksAt } });
}

// --- Helpers for creating markets ------------------------------------------

/** Auto-create the match-winner market (Team A / Draw / Team B) for a match. */
export async function createMatchMarkets(
  tx: Prisma.TransactionClient,
  match: Pick<Match, "id" | "homeTeamId" | "awayTeamId" | "kickoff">,
  opts: {
    home: { name: string };
    away: { name: string };
    homeOdds?: number;
    drawOdds?: number;
    awayOdds?: number;
  },
): Promise<void> {
  const locksAt = match.kickoff;
  const title = `${opts.home.name} vs ${opts.away.name}`;

  await tx.market.create({
    data: {
      kind: "MATCH_WINNER",
      title: `Match winner — ${title}`,
      matchId: match.id,
      locksAt,
      outcomes: {
        create: [
          { selectionKey: "HOME", label: `${opts.home.name} win`, odds: opts.homeOdds ?? 2.0 },
          { selectionKey: "DRAW", label: "Draw", odds: opts.drawOdds ?? 3.2 },
          { selectionKey: "AWAY", label: `${opts.away.name} win`, odds: opts.awayOdds ?? 3.8 },
        ],
      },
    },
  });
}
