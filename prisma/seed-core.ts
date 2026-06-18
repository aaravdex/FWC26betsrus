/**
 * Core seed data + idempotent-friendly creation logic, shared by:
 *   - prisma/seed.ts       (full reset seed for local/dev, optional demo data)
 *   - prisma/bootstrap.ts  (runs on deploy start; populates markets if empty)
 *
 * PLAY-MONEY ONLY. Loads the three supplied odds tables exactly.
 */
import { PrismaClient, Prisma } from "@prisma/client";
import { applyLedgerEntry } from "../src/lib/ledger";
import { hashPasswordSync } from "../src/lib/password";

export const STARTING_BALANCE = BigInt(Number.parseInt(process.env.STARTING_BALANCE ?? "1000", 10));
export const hours = (n: number) => new Date(Date.now() + n * 60 * 60 * 1000);

// --- 1. Tournament Winner table: [name, code, decimal payout] ---------------
export const TEAMS: Array<[string, string, number]> = [
  ["Spain", "ESP", 6.99],
  ["France", "FRA", 7.69],
  ["England", "ENG", 8.93],
  ["Argentina", "ARG", 9.62],
  ["Portugal", "POR", 14.29],
  ["Brazil", "BRA", 16.13],
  ["Germany", "GER", 16.67],
  ["Netherlands", "NED", 27.78],
  ["Norway", "NOR", 28.57],
  ["Belgium", "BEL", 41.67],
  ["Colombia", "COL", 47.62],
  ["Morocco", "MAR", 52.63],
  ["Croatia", "CRO", 62.5],
  ["Ecuador", "ECU", 71.43],
  ["United States", "USA", 83.33],
  ["Uruguay", "URU", 90.91],
  ["Switzerland", "SUI", 90.91],
  ["Japan", "JPN", 100.0],
  ["Mexico", "MEX", 100.0],
  ["Senegal", "SEN", 100.0],
  ["Canada", "CAN", 125.0],
  ["Paraguay", "PAR", 125.0],
  ["Austria", "AUT", 125.0],
  ["Sweden", "SWE", 142.86],
  ["Turkey", "TUR", 142.86],
  ["Ivory Coast", "CIV", 142.86],
  ["South Korea", "KOR", 200.0],
  ["Czechia", "CZE", 250.0],
  ["Egypt", "EGY", 250.0],
  ["Saudi Arabia", "SAU", 250.0],
  ["Australia", "AUS", 333.33],
  ["Iran", "IRN", 333.33],
  ["Algeria", "ALG", 333.33],
  ["Ghana", "GHA", 333.33],
  ["Tunisia", "TUN", 400.0],
  ["Bosnia and Herzegovina", "BIH", 400.0],
  ["Qatar", "QAT", 500.0],
  ["Scotland", "SCO", 500.0],
  ["South Africa", "RSA", 1000.0],
  ["Uzbekistan", "UZB", 1000.0],
  ["Jordan", "JOR", 1000.0],
  ["New Zealand", "NZL", 1000.0],
  ["Panama", "PAN", 1250.0],
  ["Iraq", "IRQ", 1250.0],
  ["DR Congo", "COD", 1250.0],
  ["Cape Verde", "CPV", 1666.67],
  ["Haiti", "HAI", 25000.0],
  ["Curaçao", "CUW", 50000.0],
];

// Match-table team tokens that differ from the canonical Tournament-table name.
export const TEAM_ALIAS: Record<string, string> = {
  USA: "United States",
  Türkiye: "Turkey",
  Bosnia: "Bosnia and Herzegovina",
};

// --- 2. Match Odds table: [Team A, A payout, Team B, B payout, Draw payout] --
export const MATCHES: Array<[string, number, string, number, number]> = [
  ["France", 1.4, "Senegal", 7.0, 4.5],
  ["Iraq", 12.0, "Norway", 1.18, 7.5],
  ["Argentina", 1.4, "Algeria", 7.5, 4.5],
  ["Austria", 1.33, "Jordan", 8.5, 5.0],
  ["Portugal", 1.25, "DR Congo", 10.0, 6.0],
  ["England", 1.7, "Croatia", 5.0, 3.6],
  ["Ghana", 2.2, "Panama", 3.3, 3.2],
  ["Uzbekistan", 8.5, "Colombia", 1.36, 4.6],
  ["Czechia", 1.75, "South Africa", 4.5, 3.6],
  ["Switzerland", 1.53, "Bosnia", 6.0, 4.0],
  ["Canada", 1.25, "Qatar", 10.0, 5.75],
  ["Mexico", 1.95, "South Korea", 3.9, 3.25],
  ["USA", 1.57, "Australia", 5.0, 4.2],
  ["Scotland", 5.25, "Morocco", 1.67, 3.5],
  ["Brazil", 1.09, "Haiti", 15.0, 10.5],
  ["Türkiye", 1.95, "Paraguay", 3.9, 3.3],
  ["Netherlands", 1.67, "Sweden", 4.8, 3.75],
  ["Germany", 1.5, "Ivory Coast", 5.5, 4.33],
  ["Ecuador", 1.08, "Curaçao", 19.0, 10.5],
  ["Tunisia", 7.0, "Japan", 1.5, 3.9],
  ["Spain", 1.1, "Saudi Arabia", 15.0, 10.0],
  ["Belgium", 1.4, "Iran", 7.5, 4.5],
  ["Uruguay", 1.44, "Cape Verde", 6.5, 4.2],
  ["New Zealand", 5.5, "Egypt", 1.57, 4.0],
  ["Argentina", 1.62, "Austria", 5.25, 3.75],
  ["France", 1.09, "Iraq", 19.0, 9.5],
  ["Norway", 2.15, "Senegal", 3.2, 3.4],
  ["Jordan", 6.25, "Algeria", 1.5, 4.0],
  ["Portugal", 1.22, "Uzbekistan", 10.5, 6.25],
  ["England", 1.29, "Ghana", 9.0, 5.5],
  ["Panama", 6.25, "Croatia", 1.5, 4.0],
  ["Colombia", 1.44, "DR Congo", 6.5, 4.2],
  ["Switzerland", 2.05, "Canada", 3.5, 3.3],
  ["Bosnia", 1.53, "Qatar", 5.5, 4.2],
  ["Morocco", 1.29, "Haiti", 9.0, 5.5],
  ["Scotland", 6.5, "Brazil", 1.4, 4.8],
  ["South Africa", 5.5, "South Korea", 1.55, 4.2],
  ["Czechia", 4.5, "Mexico", 1.8, 3.4],
  ["Curaçao", 13.0, "Ivory Coast", 1.14, 8.0],
  ["Ecuador", 5.0, "Germany", 1.67, 3.75],
  ["Japan", 2.05, "Sweden", 3.5, 3.4],
  ["Tunisia", 8.0, "Netherlands", 1.33, 5.25],
  ["Paraguay", 2.15, "Australia", 3.25, 3.25],
  ["Türkiye", 2.75, "USA", 2.3, 3.6],
  ["Senegal", 1.4, "Iraq", 7.5, 4.33],
  ["Norway", 4.33, "France", 1.8, 3.6],
  ["Cape Verde", 2.7, "Saudi Arabia", 2.4, 3.5],
  ["Uruguay", 5.5, "Spain", 1.57, 3.8],
  ["New Zealand", 10.5, "Belgium", 1.22, 6.25],
  ["Egypt", 2.2, "Iran", 3.4, 3.1],
  ["Panama", 8.0, "England", 1.25, 6.25],
  ["Croatia", 1.6, "Ghana", 5.5, 3.75],
  ["Colombia", 3.4, "Portugal", 2.05, 3.3],
  ["DR Congo", 2.3, "Uzbekistan", 3.1, 3.1],
  ["Jordan", 13.0, "Argentina", 1.17, 6.5],
  ["Algeria", 3.3, "Austria", 2.15, 3.25],
];

// --- 3. Top Scorer table: [name, team, decimal payout] ----------------------
export const TOP_SCORERS: Array<[string, string, number]> = [
  ["Kylian Mbappé", "France", 6.5],
  ["Harry Kane", "England", 7.5],
  ["Erling Haaland", "Norway", 13.0],
  ["Lionel Messi", "Argentina", 15.0],
  ["Cristiano Ronaldo", "Portugal", 19.0],
  ["Julián Álvarez", "Argentina", 29.0],
];
// Admin-set odds for the catch-all option (editable in the admin panel).
export const ANY_OTHER_ODDS = 2.0;

// --- Round of 16 qualification: [team, bookmaker-friendly decimal payout] ----
// Each team is a yes/qualifies outcome. Names use the supplied table; aliases
// (e.g. Türkiye) resolve to the canonical team via TEAM_ALIAS.
export const ROUND_OF_16_PAYOUTS: Array<[string, number]> = [
  ["France", 1.09],
  ["Spain", 1.17],
  ["England", 1.18],
  ["Argentina", 1.19],
  ["Portugal", 1.2],
  ["Germany", 1.25],
  ["Belgium", 1.29],
  ["Brazil", 1.32],
  ["United States", 1.34],
  ["Mexico", 1.4],
  ["Norway", 1.44],
  ["Netherlands", 1.64],
  ["Switzerland", 1.67],
  ["Colombia", 1.7],
  ["Morocco", 1.82],
  ["South Korea", 1.86],
  ["Canada", 2.0],
  ["Japan", 2.05],
  ["Uruguay", 3.17],
  ["Croatia", 3.17],
  ["Ecuador", 3.33],
  ["Austria", 3.33],
  ["Senegal", 3.48],
  ["Sweden", 3.65],
  ["Egypt", 3.65],
  ["Ivory Coast", 4.09],
  ["Australia", 4.09],
  ["Türkiye", 4.39],
  ["Czechia", 4.68],
  ["Scotland", 4.84],
  ["Algeria", 4.84],
  ["Bosnia and Herzegovina", 5.23],
  ["Ghana", 5.51],
  ["Paraguay", 5.79],
  ["Iran", 6.78],
  ["DR Congo", 8.75],
  ["Cape Verde", 9.37],
  ["Saudi Arabia", 9.88],
  ["Uzbekistan", 10.95],
  ["Panama", 10.95],
  ["South Africa", 12.12],
  ["Qatar", 16.24],
  ["New Zealand", 18.18],
  ["Tunisia", 19.76],
  ["Jordan", 28.41],
  ["Iraq", 39.53],
  ["Curaçao", 90.91],
  ["Haiti", 90.91],
];

export const slug = (s: string) =>
  s.normalize("NFD").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 16);

export function outcomeByKey(
  market: { outcomes: { id: string; selectionKey: string }[] },
  key: string,
) {
  const o = market.outcomes.find((x) => x.selectionKey === key);
  if (!o) throw new Error(`Outcome ${key} not found`);
  return o.id;
}

/** Delete all data in FK-safe order. */
export async function clearAll(prisma: PrismaClient) {
  await prisma.ledgerEntry.deleteMany();
  await prisma.bet.deleteMany();
  await prisma.outcome.deleteMany();
  await prisma.market.deleteMany();
  await prisma.match.deleteMany();
  await prisma.player.deleteMany();
  await prisma.session.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tournamentSettings.deleteMany();
}

export async function createUser(
  prisma: PrismaClient,
  username: string,
  password: string,
  role: "ADMIN" | "PLAYER",
) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { username, passwordHash: hashPasswordSync(password), role, balance: 0n },
    });
    await applyLedgerEntry(tx, {
      userId: user.id,
      amount: STARTING_BALANCE,
      type: "INITIAL_GRANT",
      description: `Welcome grant of ${STARTING_BALANCE} points`,
    });
    return user;
  });
}

type OutcomeSeed = { key: string; label: string; odds: number; teamId?: string; playerId?: string };

type MarketWithOutcomes = Prisma.MarketGetPayload<{ include: { outcomes: true } }>;

export type SeedCoreResult = {
  adminPassword: string;
  teamByName: Record<string, { id: string; name: string; code: string }>;
  winnerMarket: MarketWithOutcomes;
  scorerMarket: MarketWithOutcomes;
  matchMarkets: MarketWithOutcomes[];
};

/**
 * Create everything betting-related from the three supplied tables, plus the
 * initial admin account. Does NOT clear data — callers decide that. Kickoff
 * times are placeholders for the admin to set.
 */
export async function seedCore(prisma: PrismaClient): Promise<SeedCoreResult> {
  const createMarket = (data: {
    kind: "MATCH_WINNER" | "TOURNAMENT_WINNER" | "TOP_SCORER";
    title: string;
    locksAt: Date;
    matchId?: string;
    outcomes: OutcomeSeed[];
  }) =>
    prisma.market.create({
      data: {
        kind: data.kind,
        title: data.title,
        locksAt: data.locksAt,
        matchId: data.matchId,
        outcomes: {
          create: data.outcomes.map((o) => ({
            selectionKey: o.key,
            label: o.label,
            odds: new Prisma.Decimal(o.odds),
            teamId: o.teamId,
            playerId: o.playerId,
          })),
        },
      },
      include: { outcomes: true },
    });

  // Tournament settings (singleton). Tournament-level markets lock here.
  const tournamentStart = hours(24 * 14); // placeholder, admin-editable
  await prisma.tournamentSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: "World Cup 2026",
      startsAt: tournamentStart,
      startingBalance: STARTING_BALANCE,
    },
  });

  // Teams
  const teamByName: Record<string, { id: string; name: string; code: string }> = {};
  for (const [name, code] of TEAMS) {
    const created = await prisma.team.create({ data: { name, code } });
    teamByName[name] = { id: created.id, name, code };
  }
  const resolveTeam = (token: string) => {
    const team = teamByName[TEAM_ALIAS[token] ?? token];
    if (!team) throw new Error(`Unknown team token: ${token}`);
    return team;
  };

  // Tournament-winner market (one outcome per team)
  const winnerMarket = await createMarket({
    kind: "TOURNAMENT_WINNER",
    title: "Tournament winner — who lifts the World Cup?",
    locksAt: tournamentStart,
    outcomes: TEAMS.map(([name, code, odds]) => ({
      key: code,
      label: name,
      odds,
      teamId: teamByName[name].id,
    })),
  });

  // Top-scorer players + market
  const scorerOutcomes: OutcomeSeed[] = [];
  for (const [name, teamName, odds] of TOP_SCORERS) {
    const player = await prisma.player.create({
      data: { name, position: "FW", teamId: teamByName[teamName].id },
    });
    scorerOutcomes.push({ key: slug(name), label: name, odds, playerId: player.id });
  }
  scorerOutcomes.push({ key: "ANY_OTHER", label: "Any other player", odds: ANY_OTHER_ODDS });
  const scorerMarket = await createMarket({
    kind: "TOP_SCORER",
    title: "Top scorer — most goals in the tournament",
    locksAt: tournamentStart,
    outcomes: scorerOutcomes,
  });

  // Fixtures + match-winner markets
  const matchMarkets: MarketWithOutcomes[] = [];
  for (let i = 0; i < MATCHES.length; i++) {
    const [aTok, aOdds, bTok, bOdds, drawOdds] = MATCHES[i];
    const a = resolveTeam(aTok);
    const b = resolveTeam(bTok);
    const kickoff = hours(48 + i * 3); // staggered placeholder
    const match = await prisma.match.create({
      data: { homeTeamId: a.id, awayTeamId: b.id, kickoff },
    });
    const market = await createMarket({
      kind: "MATCH_WINNER",
      title: `Match winner — ${a.name} vs ${b.name}`,
      locksAt: kickoff,
      matchId: match.id,
      outcomes: [
        { key: "HOME", label: `${a.name} win`, odds: aOdds },
        { key: "DRAW", label: "Draw", odds: drawOdds },
        { key: "AWAY", label: `${b.name} win`, odds: bOdds },
      ],
    });
    matchMarkets.push(market);
  }

  // Round of 16 qualification market (one yes/qualifies outcome per team).
  await ensureRoundOf16Market(prisma);

  // Initial admin
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin12345";
  await createUser(prisma, "admin", adminPassword, "ADMIN");

  return { adminPassword, teamByName, winnerMarket, scorerMarket, matchMarkets };
}

/**
 * Create the Round of 16 qualification market if it doesn't exist yet. Idempotent
 * and safe to run on every deploy — used to add the market to already-seeded
 * production databases without touching existing data. Locks at the tournament
 * start by default; the admin can edit the lock datetime and odds afterwards.
 */
export async function ensureRoundOf16Market(prisma: PrismaClient) {
  const existing = await prisma.market.findFirst({ where: { kind: "ROUND_OF_16" } });
  if (existing) return existing;

  const settings = await prisma.tournamentSettings.findUnique({ where: { id: 1 } });
  const locksAt = settings?.startsAt ?? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const teams = await prisma.team.findMany();
  const byName = new Map(teams.map((t) => [t.name, t]));

  const outcomes: OutcomeSeed[] = [];
  for (const [name, payout] of ROUND_OF_16_PAYOUTS) {
    const team = byName.get(TEAM_ALIAS[name] ?? name);
    if (!team) {
      // eslint-disable-next-line no-console
      console.warn(`[round-of-16] skipping unknown team: ${name}`);
      continue;
    }
    outcomes.push({ key: team.code, label: team.name, odds: payout, teamId: team.id });
  }

  return prisma.market.create({
    data: {
      kind: "ROUND_OF_16",
      title: "Round of 16 — which teams qualify from the group stage?",
      locksAt,
      outcomes: {
        create: outcomes.map((o) => ({
          selectionKey: o.key,
          label: o.label,
          odds: new Prisma.Decimal(o.odds),
          teamId: o.teamId,
        })),
      },
    },
    include: { outcomes: true },
  });
}
