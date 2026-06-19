import Link from "next/link";
import { Prisma } from "@prisma/client";
import { formatPoints, formatPointsSigned, formatOddsNum } from "@/lib/points";
import { oddsToNumber } from "@/lib/money";
import { marketHref } from "@/lib/views";
import { formatKickoff } from "@/lib/format";
import { startingBalance } from "@/lib/env";
import { computePlayerStats, type StatBet } from "@/lib/playerStats";
import { computeBadges } from "@/lib/badges";
import { StatusBadge } from "@/components/StatusBadge";
import { BadgeGrid } from "@/components/BadgeGrid";

type UserWithBets = Prisma.UserGetPayload<{
  include: { bets: { include: { market: true; outcome: true } } };
}>;

type LedgerRow = Prisma.LedgerEntryGetPayload<object>;

// Net points a settled/void bet moved the balance: win → profit, loss → −stake,
// void → 0 (stake refunded).
function netDelta(b: UserWithBets["bets"][number]): bigint {
  if (b.status === "WON") return b.potentialReturn - b.stake;
  if (b.status === "LOST") return -b.stake;
  return 0n; // VOID (refunded) / anything else
}

function DashboardCard({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "up" | "down" | "gold";
}) {
  const toneClass =
    tone === "up"
      ? "text-up"
      : tone === "down"
        ? "text-down"
        : tone === "gold"
          ? "text-gold-soft"
          : "text-slate-100";
  return (
    <div className="card p-3 text-center">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 font-mono text-lg font-semibold ${toneClass}`}>{value}</div>
      {sub && <div className="text-[11px] text-slate-500">{sub}</div>}
    </div>
  );
}

function OpenBetsTable({ bets }: { bets: UserWithBets["bets"] }) {
  if (bets.length === 0) {
    return <p className="px-1 py-2 text-sm text-slate-500">None.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-slate-400">
            <th className="table-cell font-medium">Market</th>
            <th className="table-cell font-medium">Pick</th>
            <th className="table-cell font-medium text-right">Stake</th>
            <th className="table-cell font-medium text-right">Odds</th>
            <th className="table-cell font-medium text-right">Potential return</th>
          </tr>
        </thead>
        <tbody>
          {bets.map((b) => {
            const href = marketHref(b.market.kind, b.market.matchId);
            return (
              <tr key={b.id} className="border-b border-white/5 last:border-0">
                <td className="table-cell">
                  {href ? (
                    <Link href={href} className="hover:text-accent">
                      {b.market.title}
                    </Link>
                  ) : (
                    b.market.title
                  )}
                </td>
                <td className="table-cell text-slate-300">{b.outcome.label}</td>
                <td className="table-cell text-right font-mono">{formatPoints(b.stake)}</td>
                <td className="table-cell text-right font-mono text-accent">
                  {formatOddsNum(oddsToNumber(b.oddsAtPlacement))}
                </td>
                <td className="table-cell text-right font-mono text-slate-300">
                  {formatPoints(b.potentialReturn)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Item 6: per-bet points history — market/match, pick, result, points delta.
function PointsHistoryTable({ bets }: { bets: UserWithBets["bets"] }) {
  if (bets.length === 0) {
    return (
      <p className="px-1 py-2 text-sm text-slate-500">
        No settled predictions yet — your results will appear here.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-slate-400">
            <th className="table-cell font-medium">Match / Market</th>
            <th className="table-cell font-medium">Pick</th>
            <th className="table-cell font-medium text-right">Stake</th>
            <th className="table-cell font-medium text-right">Result</th>
            <th className="table-cell font-medium text-right">Points</th>
          </tr>
        </thead>
        <tbody>
          {bets.map((b) => {
            const href = marketHref(b.market.kind, b.market.matchId);
            const delta = netDelta(b);
            return (
              <tr key={b.id} className="border-b border-white/5 last:border-0">
                <td className="table-cell">
                  {href ? (
                    <Link href={href} className="hover:text-accent">
                      {b.market.title}
                    </Link>
                  ) : (
                    b.market.title
                  )}
                </td>
                <td className="table-cell text-slate-300">{b.outcome.label}</td>
                <td className="table-cell text-right font-mono text-slate-400">
                  {formatPoints(b.stake)}
                </td>
                <td className="table-cell text-right">
                  <StatusBadge status={b.status} />
                </td>
                <td
                  className={`table-cell text-right font-mono ${
                    delta > 0n ? "text-up" : delta < 0n ? "text-down" : "text-slate-400"
                  }`}
                >
                  {b.status === "VOID" ? "refunded" : formatPointsSigned(delta)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function PlayerProfile({
  user,
  ledger,
  isSelf,
  rank,
  totalPlayers,
}: {
  user: UserWithBets;
  ledger?: LedgerRow[];
  isSelf: boolean;
  rank?: number;
  totalPlayers?: number;
}) {
  const open = user.bets.filter((b) => b.status === "OPEN");
  const history = user.bets.filter((b) => b.status !== "OPEN");
  const totalStaked = user.bets.reduce((s, b) => s + b.stake, 0n);
  const pl = user.balance - startingBalance();

  // Honest, computed-from-records stats (items 7/8).
  const statBets: StatBet[] = user.bets.map((b) => ({
    status: b.status,
    stake: b.stake,
    potentialReturn: b.potentialReturn,
    settledAt: b.settledAt,
    marketKind: b.market.kind,
  }));
  const stats = computePlayerStats(statBets);
  const badges = computeBadges(stats);

  return (
    <div className="space-y-6">
      <header className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <h1 className="text-2xl font-bold">
            {user.username}
            {user.role === "ADMIN" && (
              <span className="badge ml-2 align-middle bg-accent/15 text-accent">admin</span>
            )}
          </h1>
          <p className="text-sm text-slate-400">Joined {formatKickoff(user.createdAt)}</p>
        </div>
        <div className="flex gap-6 text-right">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Balance</div>
            <div className="font-mono text-xl font-semibold">{formatPoints(user.balance)}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Net P/L</div>
            <div
              className={`font-mono text-xl font-semibold ${
                pl > 0n ? "text-up" : pl < 0n ? "text-down" : "text-slate-300"
              }`}
            >
              {pl > 0n ? "+" : ""}
              {formatPoints(pl)}
            </div>
          </div>
        </div>
      </header>

      {/* Performance dashboard (item 7) — all computed from real records. */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Performance
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <DashboardCard
            label="Global rank"
            value={rank ? `#${rank}` : "—"}
            sub={totalPlayers ? `of ${totalPlayers}` : undefined}
            tone="gold"
          />
          <DashboardCard label="Predictions" value={String(stats.totalBets)} sub="placed" />
          <DashboardCard
            label="Win rate"
            value={stats.accuracyPct === null ? "—" : `${stats.accuracyPct}%`}
            sub={
              stats.settledBets === 0
                ? "no settled bets"
                : `${stats.betsWon}/${stats.settledBets} settled`
            }
          />
          <DashboardCard
            label="Best streak"
            value={stats.bestWinStreak > 0 ? String(stats.bestWinStreak) : "—"}
            sub="wins in a row"
          />
          <DashboardCard
            label="Biggest win"
            value={stats.biggestWin > 0n ? formatPointsSigned(stats.biggestWin) : "—"}
            sub="single bet profit"
            tone={stats.biggestWin > 0n ? "up" : "default"}
          />
          <DashboardCard label="Total staked" value={formatPoints(totalStaked)} />
        </div>
      </section>

      {/* Achievements (item 8) — earned + locked, from real activity. */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Achievements
        </h2>
        <BadgeGrid badges={badges} />
      </section>

      <section className="card p-4">
        <h2 className="mb-3 font-semibold">Open bets</h2>
        <OpenBetsTable bets={open} />
      </section>

      {/* Points history (item 6) — match/market, pick, result, points delta. */}
      <section className="card p-4">
        <h2 className="mb-1 font-semibold">Points history</h2>
        <p className="mb-3 text-xs text-slate-500">
          Every settled prediction and how it moved {isSelf ? "your" : "their"} points, newest first.
        </p>
        <PointsHistoryTable bets={history} />
      </section>

      {isSelf && ledger && (
        <section className="card p-4">
          <h2 className="mb-1 font-semibold">Full points ledger</h2>
          <p className="mb-3 text-xs text-slate-500">
            Every change to your balance, newest first — including grants and admin adjustments. This
            is the immutable audit trail.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="table-cell font-medium">When</th>
                  <th className="table-cell font-medium">Type</th>
                  <th className="table-cell font-medium">Detail</th>
                  <th className="table-cell font-medium text-right">Change</th>
                  <th className="table-cell font-medium text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((l) => (
                  <tr key={l.id} className="border-b border-white/5 last:border-0">
                    <td className="table-cell whitespace-nowrap text-slate-400">
                      {formatKickoff(l.createdAt)}
                    </td>
                    <td className="table-cell">
                      <span className="badge bg-white/5 text-slate-300">{l.type}</span>
                    </td>
                    <td className="table-cell text-slate-400">{l.description}</td>
                    <td
                      className={`table-cell text-right font-mono ${
                        l.amount >= 0n ? "text-up" : "text-down"
                      }`}
                    >
                      {formatPointsSigned(l.amount)}
                    </td>
                    <td className="table-cell text-right font-mono">{formatPoints(l.balanceAfter)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
