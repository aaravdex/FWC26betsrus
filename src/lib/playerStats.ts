// Pure, client-safe stat computations over a player's real bet records. Nothing
// here is fabricated — accuracy/streak/biggest-win all come from settled bets,
// and callers show a neutral empty state when there isn't enough history.

export type StatBet = {
  status: string; // OPEN | WON | LOST | VOID
  stake: bigint;
  potentialReturn: bigint;
  settledAt: Date | null;
  marketKind: string; // MATCH_WINNER | TOURNAMENT_WINNER | ...
};

export type PlayerStats = {
  totalBets: number;
  settledBets: number;
  betsWon: number;
  accuracyPct: number | null; // won / settled, null when no settled bets yet
  bestWinStreak: number;
  biggestWin: bigint; // largest single-bet profit (potentialReturn − stake)
  maxStake: bigint;
  correctMatchBets: number; // WON match-winner (group-stage) bets
};

export function computePlayerStats(bets: StatBet[]): PlayerStats {
  const settled = bets.filter((b) => b.status === "WON" || b.status === "LOST");
  const won = settled.filter((b) => b.status === "WON");

  const accuracyPct =
    settled.length === 0 ? null : Math.round((won.length / settled.length) * 1000) / 10;

  // Longest run of consecutive wins, in settlement order.
  const ordered = [...settled].sort(
    (a, b) => (a.settledAt?.getTime() ?? 0) - (b.settledAt?.getTime() ?? 0),
  );
  let bestWinStreak = 0;
  let run = 0;
  for (const b of ordered) {
    if (b.status === "WON") {
      run += 1;
      bestWinStreak = Math.max(bestWinStreak, run);
    } else {
      run = 0;
    }
  }

  let biggestWin = 0n;
  let maxStake = 0n;
  for (const b of bets) {
    if (b.stake > maxStake) maxStake = b.stake;
    if (b.status === "WON") {
      const profit = b.potentialReturn - b.stake;
      if (profit > biggestWin) biggestWin = profit;
    }
  }

  const correctMatchBets = won.filter((b) => b.marketKind === "MATCH_WINNER").length;

  return {
    totalBets: bets.length,
    settledBets: settled.length,
    betsWon: won.length,
    accuracyPct,
    bestWinStreak,
    biggestWin,
    maxStake,
    correctMatchBets,
  };
}
