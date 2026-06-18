/**
 * Match the official IST group-stage schedule to the existing fixtures by team
 * pairing, then emit the SQL for a data migration that updates each matched
 * match's kickoff (and its non-settled market lock time) — preserving match IDs
 * and attached bets. Unmatched rows (either direction) are REPORTED, never
 * guessed, created, or dropped.
 *
 * Times are given in IST (UTC+5:30); the TIMESTAMP(3) columns store UTC, so we
 * convert each IST instant to its UTC literal.
 *
 * Run: tsx prisma/update-kickoffs.ts [outputSqlPath]
 */
import { writeFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Schedule team names that differ from the stored canonical name.
const ALIAS: Record<string, string> = { Türkiye: "Turkey" };
const norm = (s: string) => ALIAS[s] ?? s;

// [home, away, IST datetime ISO]. 72 group-stage rows from the supplied table.
const SCHEDULE: Array<[string, string, string]> = [
  ["Mexico", "South Africa", "2026-06-12T00:30:00+05:30"],
  ["South Korea", "Czechia", "2026-06-12T07:30:00+05:30"],
  ["Canada", "Bosnia and Herzegovina", "2026-06-13T00:30:00+05:30"],
  ["United States", "Paraguay", "2026-06-13T06:30:00+05:30"],
  ["Qatar", "Switzerland", "2026-06-14T00:30:00+05:30"],
  ["Brazil", "Morocco", "2026-06-14T03:30:00+05:30"],
  ["Haiti", "Scotland", "2026-06-14T06:30:00+05:30"],
  ["Australia", "Türkiye", "2026-06-14T09:30:00+05:30"],
  ["Germany", "Curaçao", "2026-06-14T22:30:00+05:30"],
  ["Netherlands", "Japan", "2026-06-15T01:30:00+05:30"],
  ["Ivory Coast", "Ecuador", "2026-06-15T04:30:00+05:30"],
  ["Sweden", "Tunisia", "2026-06-15T07:30:00+05:30"],
  ["Spain", "Cape Verde", "2026-06-15T21:30:00+05:30"],
  ["Belgium", "Egypt", "2026-06-16T00:30:00+05:30"],
  ["Saudi Arabia", "Uruguay", "2026-06-16T03:30:00+05:30"],
  ["Iran", "New Zealand", "2026-06-16T06:30:00+05:30"],
  ["France", "Senegal", "2026-06-17T00:30:00+05:30"],
  ["Iraq", "Norway", "2026-06-17T03:30:00+05:30"],
  ["Argentina", "Algeria", "2026-06-17T06:30:00+05:30"],
  ["Austria", "Jordan", "2026-06-17T09:30:00+05:30"],
  ["Portugal", "DR Congo", "2026-06-17T22:30:00+05:30"],
  ["England", "Croatia", "2026-06-18T01:30:00+05:30"],
  ["Ghana", "Panama", "2026-06-18T04:30:00+05:30"],
  ["Uzbekistan", "Colombia", "2026-06-18T07:30:00+05:30"],
  ["Czechia", "South Africa", "2026-06-18T21:30:00+05:30"],
  ["Switzerland", "Bosnia and Herzegovina", "2026-06-19T00:30:00+05:30"],
  ["Canada", "Qatar", "2026-06-19T03:30:00+05:30"],
  ["Mexico", "South Korea", "2026-06-19T06:30:00+05:30"],
  ["United States", "Australia", "2026-06-20T00:30:00+05:30"],
  ["Scotland", "Morocco", "2026-06-20T03:30:00+05:30"],
  ["Brazil", "Haiti", "2026-06-20T06:00:00+05:30"],
  ["Türkiye", "Paraguay", "2026-06-20T08:30:00+05:30"],
  ["Netherlands", "Sweden", "2026-06-20T22:30:00+05:30"],
  ["Germany", "Ivory Coast", "2026-06-21T01:30:00+05:30"],
  ["Ecuador", "Curaçao", "2026-06-21T05:30:00+05:30"],
  ["Tunisia", "Japan", "2026-06-21T09:30:00+05:30"],
  ["Spain", "Saudi Arabia", "2026-06-21T21:30:00+05:30"],
  ["Belgium", "Iran", "2026-06-22T00:30:00+05:30"],
  ["Uruguay", "Cape Verde", "2026-06-22T03:30:00+05:30"],
  ["New Zealand", "Egypt", "2026-06-22T06:30:00+05:30"],
  ["Argentina", "Austria", "2026-06-22T22:30:00+05:30"],
  ["France", "Iraq", "2026-06-23T02:30:00+05:30"],
  ["Norway", "Senegal", "2026-06-23T05:30:00+05:30"],
  ["Jordan", "Algeria", "2026-06-23T08:30:00+05:30"],
  ["Portugal", "Uzbekistan", "2026-06-23T22:30:00+05:30"],
  ["England", "Ghana", "2026-06-24T01:30:00+05:30"],
  ["Panama", "Croatia", "2026-06-24T04:30:00+05:30"],
  ["Colombia", "DR Congo", "2026-06-24T07:30:00+05:30"],
  ["Switzerland", "Canada", "2026-06-25T00:30:00+05:30"],
  ["Bosnia and Herzegovina", "Qatar", "2026-06-25T00:30:00+05:30"],
  ["Scotland", "Brazil", "2026-06-25T03:30:00+05:30"],
  ["Morocco", "Haiti", "2026-06-25T03:30:00+05:30"],
  ["Czechia", "Mexico", "2026-06-25T06:30:00+05:30"],
  ["South Africa", "South Korea", "2026-06-25T06:30:00+05:30"],
  ["Ecuador", "Germany", "2026-06-26T01:30:00+05:30"],
  ["Curaçao", "Ivory Coast", "2026-06-26T01:30:00+05:30"],
  ["Tunisia", "Netherlands", "2026-06-26T04:30:00+05:30"],
  ["Japan", "Sweden", "2026-06-26T04:30:00+05:30"],
  ["Türkiye", "United States", "2026-06-26T07:30:00+05:30"],
  ["Paraguay", "Australia", "2026-06-26T07:30:00+05:30"],
  ["Norway", "France", "2026-06-27T00:30:00+05:30"],
  ["Senegal", "Iraq", "2026-06-27T00:30:00+05:30"],
  ["Uruguay", "Spain", "2026-06-27T05:30:00+05:30"],
  ["Cape Verde", "Saudi Arabia", "2026-06-27T05:30:00+05:30"],
  ["New Zealand", "Belgium", "2026-06-27T08:30:00+05:30"],
  ["Egypt", "Iran", "2026-06-27T08:30:00+05:30"],
  ["Panama", "England", "2026-06-28T02:30:00+05:30"],
  ["Croatia", "Ghana", "2026-06-28T02:30:00+05:30"],
  ["Colombia", "Portugal", "2026-06-28T05:00:00+05:30"],
  ["DR Congo", "Uzbekistan", "2026-06-28T05:00:00+05:30"],
  ["Jordan", "Argentina", "2026-06-28T07:30:00+05:30"],
  ["Algeria", "Austria", "2026-06-28T07:30:00+05:30"],
];

const toUtcLiteral = (iso: string) =>
  new Date(iso).toISOString().replace("T", " ").replace(/\.\d{3}Z$/, "");
const sqlStr = (s: string) => s.replace(/'/g, "''");

async function main() {
  const outPath = process.argv[2] ?? "/tmp/kickoff.sql";
  const matches = await prisma.match.findMany({ include: { homeTeam: true, awayTeam: true } });
  const dbByKey = new Map<string, (typeof matches)[number]>();
  for (const m of matches) dbByKey.set(`${m.homeTeam.name}|${m.awayTeam.name}`, m);
  const reverseKeys = new Set(matches.map((m) => `${m.awayTeam.name}|${m.homeTeam.name}`));

  const matched: { m: (typeof matches)[number]; iso: string }[] = [];
  const scheduleOnly: Array<[string, string, string, boolean]> = []; // + reversedExists flag
  const usedDbIds = new Set<string>();

  for (const [home, away, iso] of SCHEDULE) {
    const key = `${norm(home)}|${norm(away)}`;
    const m = dbByKey.get(key);
    if (m) {
      matched.push({ m, iso });
      usedDbIds.add(m.id);
    } else {
      scheduleOnly.push([home, away, iso, reverseKeys.has(key)]);
    }
  }
  const dbOnly = matches.filter((m) => !usedDbIds.has(m.id));

  // Emit migration SQL — name-joined + UTC literals (portable across databases).
  const lines: string[] = ["-- Update group-stage kickoff times to the official IST schedule.", ""];
  for (const { m, iso } of matched) {
    const utc = toUtcLiteral(iso);
    const h = sqlStr(m.homeTeam.name);
    const a = sqlStr(m.awayTeam.name);
    const matchSel = `(SELECT id FROM "Team" WHERE name = '${h}')`;
    const awaySel = `(SELECT id FROM "Team" WHERE name = '${a}')`;
    const where = `"homeTeamId" = ${matchSel} AND "awayTeamId" = ${awaySel}`;
    lines.push(`UPDATE "Match" SET "kickoff" = TIMESTAMP '${utc}' WHERE ${where};`);
    lines.push(
      `UPDATE "Market" SET "locksAt" = TIMESTAMP '${utc}' WHERE status <> 'SETTLED' AND "matchId" = (SELECT id FROM "Match" WHERE ${where});`,
    );
  }
  writeFileSync(outPath, lines.join("\n") + "\n");

  // Report.
  console.log("\n================= KICKOFF MATCH REPORT =================");
  console.log(`Existing fixtures in DB:        ${matches.length}`);
  console.log(`Schedule rows provided:         ${SCHEDULE.length}`);
  console.log(`Matched & will be updated:      ${matched.length}`);
  console.log(`\nSCHEDULE ROWS WITH NO MATCHING FIXTURE (${scheduleOnly.length}) — not created:`);
  scheduleOnly.forEach(([h, a, iso, rev]) =>
    console.log(`  • ${h} vs ${a}  [${iso}]${rev ? "  (NB: reverse pairing exists in DB)" : ""}`),
  );
  console.log(`\nDB FIXTURES WITH NO SCHEDULE ROW (${dbOnly.length}) — left unchanged:`);
  dbOnly.forEach((m) => console.log(`  • ${m.homeTeam.name} vs ${m.awayTeam.name}`));
  console.log(`\nSQL written to: ${outPath}`);
  console.log("=======================================================\n");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
