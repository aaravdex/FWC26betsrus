import { prisma } from "@/lib/prisma";
import { oddsToNumber } from "@/lib/money";
import type { MatchResult } from "@/lib/results";

// Serializable view models for the Live Match Center. Built server-side and
// consumed by both the initial server render and the polling client component.

export type LiveOutcome = {
  id: string;
  label: string;
  odds: number;
  previousOdds: number | null;
  result: string;
};

export type LiveMarket = {
  id: string;
  title: string;
  kind: string;
  status: string; // OPEN | SUSPENDED | LOCKED | SETTLED
  locksAt: string;
  outcomes: LiveOutcome[];
};

export type LiveEvent = {
  id: string;
  type: string;
  minute: number | null;
  side: "home" | "away" | null;
  teamName: string | null;
  description: string | null;
  createdAt: string;
};

export type LiveMatchView = {
  id: string;
  status: string;
  liveStatus: string;
  minute: number | null;
  homeScore: number | null;
  awayScore: number | null;
  kickoff: string;
  homeTeam: { name: string; code: string };
  awayTeam: { name: string; code: string };
  events: LiveEvent[];
  markets: LiveMarket[];
};

export type LiveSummary = {
  id: string;
  liveStatus: string;
  minute: number | null;
  homeScore: number | null;
  awayScore: number | null;
  kickoff: string;
  homeTeam: { name: string; code: string };
  awayTeam: { name: string; code: string };
  suspended: boolean;
  // The viewer's own bet outcome on this match, once settled (null otherwise).
  result: MatchResult;
};

const liveMatchInclude = {
  homeTeam: true,
  awayTeam: true,
  events: { orderBy: { createdAt: "desc" as const } },
  markets: { include: { outcomes: { orderBy: { odds: "asc" as const } } } },
};

export async function getLiveMatch(matchId: string): Promise<LiveMatchView | null> {
  const m = await prisma.match.findUnique({
    where: { id: matchId },
    include: liveMatchInclude,
  });
  if (!m) return null;

  const sideOf = (teamId: string | null): "home" | "away" | null =>
    teamId == null ? null : teamId === m.homeTeamId ? "home" : "away";
  const teamName = (teamId: string | null) =>
    teamId == null ? null : teamId === m.homeTeamId ? m.homeTeam.name : m.awayTeam.name;

  return {
    id: m.id,
    status: m.status,
    liveStatus: m.liveStatus,
    minute: m.minute,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    kickoff: m.kickoff.toISOString(),
    homeTeam: { name: m.homeTeam.name, code: m.homeTeam.code },
    awayTeam: { name: m.awayTeam.name, code: m.awayTeam.code },
    events: m.events.map((e) => ({
      id: e.id,
      type: e.type,
      minute: e.minute,
      side: sideOf(e.teamId),
      teamName: teamName(e.teamId),
      description: e.description,
      createdAt: e.createdAt.toISOString(),
    })),
    markets: m.markets.map((mk) => ({
      id: mk.id,
      title: mk.title,
      kind: mk.kind,
      status: mk.status,
      locksAt: mk.locksAt.toISOString(),
      outcomes: mk.outcomes.map((o) => ({
        id: o.id,
        label: o.label,
        odds: oddsToNumber(o.odds),
        previousOdds: o.previousOdds ? oddsToNumber(o.previousOdds) : null,
        result: o.result,
      })),
    })),
  };
}

export async function getLiveSummaries(userId?: string): Promise<LiveSummary[]> {
  const [matches, results] = await Promise.all([
    prisma.match.findMany({
      orderBy: [{ liveStatus: "asc" }, { kickoff: "asc" }],
      include: { homeTeam: true, awayTeam: true, markets: { select: { status: true } } },
    }),
    userId ? getUserMatchResults(userId) : Promise.resolve({} as Record<string, MatchResult>),
  ]);
  return matches.map((m) => ({
    id: m.id,
    liveStatus: m.liveStatus,
    minute: m.minute,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    kickoff: m.kickoff.toISOString(),
    homeTeam: { name: m.homeTeam.name, code: m.homeTeam.code },
    awayTeam: { name: m.awayTeam.name, code: m.awayTeam.code },
    suspended: m.markets.some((mk) => mk.status === "SUSPENDED"),
    result: results[m.id] ?? null,
  }));
}

/**
 * The logged-in user's own settled bet outcome per match, derived from their bet
 * records. Rule for multiple bets on one match: green ("won") if ANY bet won,
 * otherwise red ("lost") if any bet lost. Matches not present here are neutral
 * (no bet, only open/void bets, or not yet settled).
 */
export async function getUserMatchResults(userId: string): Promise<Record<string, MatchResult>> {
  const bets = await prisma.bet.findMany({
    where: { userId, status: { in: ["WON", "LOST"] }, market: { matchId: { not: null } } },
    select: { status: true, market: { select: { matchId: true } } },
  });
  const map: Record<string, MatchResult> = {};
  for (const b of bets) {
    const matchId = b.market.matchId;
    if (!matchId) continue;
    if (b.status === "WON") map[matchId] = "won";
    else if (map[matchId] !== "won") map[matchId] = "lost"; // won takes priority over lost
  }
  return map;
}
