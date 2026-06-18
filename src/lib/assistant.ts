import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { oddsToNumber, computeProfit, computePotentialReturn } from "@/lib/money";
import { riskFromOdds } from "@/lib/risk";

export const ASSISTANT_MODEL = "claude-sonnet-4-6";

export function hasApiKey(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

// The boundary is stated explicitly and repeatedly: BetSmart AI is informational
// only. It never places, confirms, or modifies bets, only uses the real data we
// pass it, and refuses to invent stats or predict outcomes.
const SYSTEM_PROMPT = `You are "BetSmart AI", a helpful, concise assistant inside a PRIVATE, PLAY-MONEY World Cup 2026 prediction game. Everything is fictional "points" — there is no real money, no deposits, and no withdrawals.

YOUR HARD BOUNDARIES — these are absolute:
- You are INFORMATIONAL ONLY. You NEVER place, confirm, change, or cancel a bet, and you have no ability to do so. If a user wants to bet, explain the options and then tell them to use the normal bet button on the page, which has its own confirmation step.
- You ONLY use the real data provided to you in the CONTEXT block below (the user's balance, their own open/settled bets, the markets/odds/status shown, and their leaderboard standing). If you are asked for something you do NOT have — head-to-head records, team form, injuries, news, predictions of who will win, or any outside stat — say plainly that you don't have that data. NEVER invent or estimate stats, form, or results.
- You do NOT predict or guarantee outcomes. No outcome is guaranteed.

WHAT YOU CAN DO:
- Explain how decimal odds work: a winning stake returns stake × odds in total, and profit is stake × (odds − 1). A losing stake is forfeited.
- For a specific stake and odds the user gives (or that appear in context), compute the potential return and profit.
- Explain a selection's cosmetic risk label (Low / Medium / High). State clearly that this label is derived openly from the odds (shorter odds = lower label, bigger implied chance) and is NOT a prediction or forecast.
- Explain a market's status (open / suspended / settled) and what it means for betting.
- Encourage responsible, for-fun play. If the user asks, help them pick a sensible self-imposed per-session points limit and gently remind them it's just for fun. Never shame anyone.

STYLE: friendly, brief, and concrete. Use "points" (never "$" or real currency). When you show a calculation, show the numbers. If unsure, say so.`;

type Ctx = { userId: string; matchId?: string | null };

export async function buildContext({ userId, matchId }: Ctx): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return "No account data available.";

  const [openBets, settledBets, betterCount, totalPlayers] = await Promise.all([
    prisma.bet.findMany({
      where: { userId, status: "OPEN" },
      include: { market: true, outcome: true },
      orderBy: { placedAt: "desc" },
      take: 25,
    }),
    prisma.bet.findMany({
      where: { userId, status: { in: ["WON", "LOST", "VOID"] } },
      include: { market: true, outcome: true },
      orderBy: { settledAt: "desc" },
      take: 10,
    }),
    // rank = how many players have a strictly higher balance + 1
    prisma.user.count({ where: { balance: { gt: user.balance } } }),
    prisma.user.count(),
  ]);

  const lines: string[] = [];
  lines.push(`ACCOUNT: username=${user.username}, balance=${user.balance} points, leaderboard rank=${betterCount + 1} of ${totalPlayers}.`);

  if (openBets.length === 0) {
    lines.push("OPEN BETS: none.");
  } else {
    lines.push("OPEN BETS:");
    for (const b of openBets) {
      const odds = oddsToNumber(b.oddsAtPlacement);
      lines.push(
        `- "${b.outcome.label}" on [${b.market.title}] — stake ${b.stake} @ ${odds.toFixed(2)}, potential return ${b.potentialReturn} (profit ${b.potentialReturn - b.stake}), ${riskFromOdds(odds).level} risk.`,
      );
    }
  }

  if (settledBets.length > 0) {
    lines.push("RECENT SETTLED BETS:");
    for (const b of settledBets) {
      const delta = b.status === "WON" ? `+${b.potentialReturn - b.stake}` : b.status === "VOID" ? "refunded" : `-${b.stake}`;
      lines.push(`- "${b.outcome.label}" on [${b.market.title}] — ${b.status} (${delta} points).`);
    }
  }

  if (matchId) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { homeTeam: true, awayTeam: true, markets: { include: { outcomes: { orderBy: { odds: "asc" } } } } },
    });
    if (match) {
      lines.push(
        `FOCUSED MATCH: ${match.homeTeam.name} vs ${match.awayTeam.name} — play status ${match.liveStatus}${match.minute != null ? ` (${match.minute}')` : ""}, score ${match.homeScore ?? 0}-${match.awayScore ?? 0}.`,
      );
      for (const mk of match.markets) {
        lines.push(`  MARKET [${mk.title}] status=${mk.status}:`);
        for (const o of mk.outcomes) {
          const odds = oddsToNumber(o.odds);
          lines.push(`    - ${o.label}: odds ${odds.toFixed(2)} (${riskFromOdds(odds).level} risk; 100 points would return ${computePotentialReturn(100n, o.odds)}, profit ${computeProfit(100n, o.odds)}).`);
        }
      }
    }
  }

  return lines.join("\n");
}

export type ChatTurn = { role: "user" | "assistant"; content: string };

export async function askBetSmart(messages: ChatTurn[], context: string): Promise<string> {
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment
  const response = await client.messages.create({
    model: ASSISTANT_MODEL,
    max_tokens: 1024,
    system: `${SYSTEM_PROMPT}\n\n----- LIVE CONTEXT (the ONLY real data you may use) -----\n${context}`,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });
  return response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}
