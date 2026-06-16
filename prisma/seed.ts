/**
 * Full reset seed for local/dev (PLAY-MONEY ONLY).
 *
 * Clears the database, loads the three supplied odds tables (via seed-core),
 * and — when SEED_DEMO=true — also creates demo players, a spread of sample
 * bets, and one settled fixture so the leaderboard/profiles have data.
 *
 * Production deployments don't run this; they auto-populate via bootstrap.ts.
 */
import { PrismaClient } from "@prisma/client";
import { applyLedgerEntry } from "../src/lib/ledger";
import { settleMatch } from "../src/lib/markets";
import { computePotentialReturn } from "../src/lib/money";
import { seedCore, clearAll, createUser, outcomeByKey, slug } from "./seed-core";

const prisma = new PrismaClient();

/** Insert a bet directly (bypassing lock checks) with correct ledger accounting. */
async function seedBet(userId: string, outcomeId: string, stake: bigint) {
  return prisma.$transaction(async (tx) => {
    const outcome = await tx.outcome.findUniqueOrThrow({
      where: { id: outcomeId },
      include: { market: true },
    });
    const potentialReturn = computePotentialReturn(stake, outcome.odds);
    const bet = await tx.bet.create({
      data: {
        userId,
        marketId: outcome.marketId,
        outcomeId,
        stake,
        oddsAtPlacement: outcome.odds,
        potentialReturn,
        status: "OPEN",
      },
    });
    await applyLedgerEntry(tx, {
      userId,
      amount: -stake,
      type: "STAKE",
      description: `Stake on "${outcome.label}" — ${outcome.market.title}`,
      betId: bet.id,
    });
    return bet;
  });
}

async function main() {
  console.log("Clearing existing data...");
  await clearAll(prisma);

  const core = await seedCore(prisma);
  console.log("Loaded 48 teams, 56 fixtures, tournament-winner + top-scorer markets, admin.");

  const seedDemo = process.env.SEED_DEMO === "true";
  if (seedDemo) {
    const alice = await createUser(prisma, "alice", "password123", "PLAYER");
    const bob = await createUser(prisma, "bob", "password123", "PLAYER");
    const carla = await createUser(prisma, "carla", "password123", "PLAYER");
    const dan = await createUser(prisma, "dan", "password123", "PLAYER");

    const m = (i: number) => core.matchMarkets[i];
    // Fixture 0 (France vs Senegal) — settled France 2-0 below.
    await seedBet(alice.id, outcomeByKey(m(0), "HOME"), 100n); // France -> WIN
    await seedBet(bob.id, outcomeByKey(m(0), "AWAY"), 60n); // Senegal -> LOSE
    await seedBet(carla.id, outcomeByKey(m(0), "DRAW"), 40n); // Draw -> LOSE
    // Other fixtures (stay open)
    await seedBet(dan.id, outcomeByKey(m(1), "AWAY"), 50n); // Norway beat Iraq
    await seedBet(alice.id, outcomeByKey(m(5), "HOME"), 120n); // England beat Croatia
    await seedBet(bob.id, outcomeByKey(m(14), "HOME"), 30n); // Brazil beat Haiti
    // Tournament winner
    await seedBet(bob.id, outcomeByKey(core.winnerMarket, "ESP"), 100n);
    await seedBet(carla.id, outcomeByKey(core.winnerMarket, "ARG"), 50n);
    await seedBet(dan.id, outcomeByKey(core.winnerMarket, "BRA"), 40n);
    await seedBet(alice.id, outcomeByKey(core.winnerMarket, "FRA"), 200n);
    // Top scorer
    await seedBet(alice.id, outcomeByKey(core.scorerMarket, slug("Kylian Mbappé")), 60n);
    await seedBet(bob.id, outcomeByKey(core.scorerMarket, slug("Harry Kane")), 80n);
    await seedBet(dan.id, outcomeByKey(core.scorerMarket, slug("Erling Haaland")), 30n);
    await seedBet(carla.id, outcomeByKey(core.scorerMarket, "ANY_OTHER"), 40n);

    // Give the to-be-settled fixture a past kickoff so it reads naturally.
    const settledMatchId = core.matchMarkets[0].matchId!;
    await prisma.match.update({
      where: { id: settledMatchId },
      data: { kickoff: new Date(Date.now() - 3 * 60 * 60 * 1000) },
    });
    await settleMatch({ matchId: settledMatchId, homeScore: 2, awayScore: 0 });
    console.log("Seeded 4 demo players, sample bets, and settled France 2-0 Senegal.");
  } else {
    console.log("Production seed: markets + admin only (set SEED_DEMO=true for demo data).");
  }

  const finalUsers = await prisma.user.findMany({ orderBy: { balance: "desc" } });
  console.log("\n=========================================================");
  console.log(" Seed complete — PLAY-MONEY points only, no real currency.");
  console.log("=========================================================");
  console.log("\nMarkets ready: 48 tournament teams, 56 fixtures, top-scorer.");
  console.log("Open signup is enabled — anyone can register at /signup.\n");
  console.log(`  ADMIN login: admin / ${core.adminPassword}`);
  if (seedDemo) {
    console.log("  DEMO players: alice / bob / carla / dan   (password: password123)");
  }
  console.log("\nUsers after seed:");
  finalUsers.forEach((u, i) =>
    console.log(`  ${i + 1}. ${u.username.padEnd(10)} ${String(u.balance).padStart(6)} pts  (${u.role})`),
  );
  console.log("");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
