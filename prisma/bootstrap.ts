/**
 * Deploy-time bootstrap (runs on every start via `npm run start:railway`).
 *
 * If the database has no markets yet (fresh deploy), it loads the teams,
 * fixtures and markets + the initial admin. If markets already exist it does
 * nothing — so it's safe to run on every boot and never wipes live data.
 *
 * No demo players/bets here: a real deployment starts with a clean leaderboard.
 */
import { PrismaClient } from "@prisma/client";
import { seedCore, clearAll, ensureRoundOf16Market, ensureGroupStageOpeners } from "./seed-core";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.market.count();
  if (existing > 0) {
    console.log(`[bootstrap] ${existing} markets already present — skipping full seed.`);
  } else {
    console.log("[bootstrap] Empty database — loading teams, fixtures and markets…");
    try {
      const core = await seedCore(prisma);
      console.log(
        `[bootstrap] Done: 48 teams, 56 fixtures, tournament + top-scorer markets. Admin: admin / ${core.adminPassword}`,
      );
    } catch (err) {
      // Roll back any partial rows so the next boot can retry from a clean slate.
      console.error("[bootstrap] Seed failed, clearing partial data:", err);
      await clearAll(prisma).catch(() => {});
      throw err;
    }
  }

  // Always ensure newer markets exist — adds the Round of 16 market to
  // already-seeded production databases without touching existing data.
  await ensureRoundOf16Market(prisma);
  console.log("[bootstrap] Round of 16 qualification market ready.");

  const openers = await ensureGroupStageOpeners(prisma);
  console.log(`[bootstrap] Group-stage opener fixtures ensured (${openers} created).`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("[bootstrap] fatal:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
