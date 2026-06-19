import { requireApiAdmin } from "@/lib/api";
import { errorResponse } from "@/lib/errors";
import { getLeaderboard } from "@/lib/leaderboard";

const csvEscape = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

// Export the full leaderboard (with honest stats) as a CSV download.
export async function GET() {
  try {
    await requireApiAdmin();
    const { rows } = await getLeaderboard();

    const header = [
      "Rank",
      "Username",
      "Role",
      "Status",
      "TotalPoints",
      "Liquidity",
      "InPlay",
      "ProfitLoss",
      "TotalBets",
      "BetsWon",
      "SettledBets",
      "AccuracyPct",
    ];
    const lines = [header.join(",")];
    for (const r of rows) {
      lines.push(
        [
          r.rank,
          csvEscape(r.username),
          r.role,
          r.isBanned ? "DISABLED" : "ACTIVE",
          r.total.toString(),
          r.liquidity.toString(),
          r.inPlay.toString(),
          r.pl.toString(),
          r.totalBets,
          r.betsWon,
          r.settledBets,
          r.accuracyPct == null ? "" : r.accuracyPct,
        ].join(","),
      );
    }
    const csv = lines.join("\n");
    const filename = `leaderboard-${new Date().toISOString().slice(0, 10)}.csv`;
    return new Response(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
