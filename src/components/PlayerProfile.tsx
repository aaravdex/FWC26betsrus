import Link from "next/link";
import { Prisma } from "@prisma/client";
import { formatPoints, formatPointsSigned, formatOddsNum } from "@/lib/points";
import { oddsToNumber } from "@/lib/money";
import { marketHref } from "@/lib/views";
import { formatKickoff } from "@/lib/format";
import { startingBalance } from "@/lib/env";
import { StatusBadge } from "@/components/StatusBadge";

type UserWithBets = Prisma.UserGetPayload<{
  include: { bets: { include: { market: true; outcome: true } } };
}>;

type LedgerRow = Prisma.LedgerEntryGetPayload<object>;

function BetTable({
  bets,
  settled,
}: {
  bets: UserWithBets["bets"];
  settled: boolean;
}) {
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
            <th className="table-cell font-medium text-right">{settled ? "Result" : "Potential return"}</th>
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
                <td className="table-cell text-right">
                  {settled ? (
                    <span className="inline-flex items-center gap-2">
                      {b.status === "WON" && (
                        <span className="font-mono text-accent">
                          {formatPointsSigned(b.potentialReturn)}
                        </span>
                      )}
                      {b.status === "VOID" && (
                        <span className="font-mono text-slate-400">
                          {formatPointsSigned(b.stake)}
                        </span>
                      )}
                      <StatusBadge status={b.status} />
                    </span>
                  ) : (
                    <span className="font-mono text-slate-300">{formatPoints(b.potentialReturn)}</span>
                  )}
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
}: {
  user: UserWithBets;
  ledger?: LedgerRow[];
  isSelf: boolean;
}) {
  const open = user.bets.filter((b) => b.status === "OPEN");
  const settled = user.bets.filter((b) => b.status !== "OPEN");
  const totalStaked = user.bets.reduce((s, b) => s + b.stake, 0n);
  const won = settled.filter((b) => b.status === "WON");
  const pl = user.balance - startingBalance();

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
                pl > 0n ? "text-accent" : pl < 0n ? "text-red-300" : "text-slate-300"
              }`}
            >
              {pl > 0n ? "+" : ""}
              {formatPoints(pl)}
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Open bets", value: String(open.length) },
          { label: "Settled bets", value: String(settled.length) },
          { label: "Wins", value: String(won.length) },
          { label: "Total staked", value: formatPoints(totalStaked) },
        ].map((s) => (
          <div key={s.label} className="card p-3 text-center">
            <div className="text-xs uppercase tracking-wide text-slate-500">{s.label}</div>
            <div className="mt-1 font-mono text-lg">{s.value}</div>
          </div>
        ))}
      </div>

      <section className="card p-4">
        <h2 className="mb-3 font-semibold">Open bets</h2>
        <BetTable bets={open} settled={false} />
      </section>

      <section className="card p-4">
        <h2 className="mb-3 font-semibold">Settled bets</h2>
        <BetTable bets={settled} settled />
      </section>

      {isSelf && ledger && (
        <section className="card p-4">
          <h2 className="mb-1 font-semibold">Your points ledger</h2>
          <p className="mb-3 text-xs text-slate-500">
            Every change to your balance, newest first. This is the immutable audit trail.
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
                        l.amount >= 0n ? "text-accent" : "text-red-300"
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
