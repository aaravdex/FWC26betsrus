"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { apiPost } from "@/lib/client";
import { formatPoints, returnForStake } from "@/lib/points";
import { riskFromOdds } from "@/lib/risk";
import { OddsValue } from "@/components/OddsValue";

type OutcomeView = { id: string; label: string; odds: number; previousOdds?: number | null };

type Props = {
  marketId: string;
  outcomes: OutcomeView[];
  locked: boolean;
  lockLabel?: string | null;
  suspended?: boolean;
  signedIn: boolean;
  balance: bigint;
};

type Msg = { type: "ok" | "err"; text: string } | null;

export function BetBox({ outcomes, locked, lockLabel, suspended, signedIn, balance }: Props) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stakeRaw, setStakeRaw] = useState("");
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);

  const selected = outcomes.find((o) => o.id === selectedId) ?? null;
  const stake = Number.parseInt(stakeRaw, 10);
  const stakeValid = Number.isInteger(stake) && stake > 0;
  const potentialReturn = useMemo(
    () => (selected && stakeValid ? returnForStake(stake, selected.odds) : 0),
    [selected, stake, stakeValid],
  );
  const tooMuch = stakeValid && BigInt(stake) > balance;
  const selectedRisk = selected ? riskFromOdds(selected.odds) : null;

  if (!signedIn) {
    return (
      <div className="glass rounded-xl p-3 text-sm text-slate-400">
        <Link href="/login" className="text-accent-soft hover:underline">
          Sign in
        </Link>{" "}
        to place a bet.
      </div>
    );
  }

  async function confirm() {
    setMsg(null);
    if (!selected) return setMsg({ type: "err", text: "Pick an outcome first." });
    if (!stakeValid) return setMsg({ type: "err", text: "Enter a whole number of points to stake." });
    if (tooMuch) return setMsg({ type: "err", text: "Stake is more points than you hold." });

    setPending(true);
    const res = await apiPost<{ newBalance: string }>("/api/bets", {
      outcomeId: selected.id,
      stake,
    });
    setPending(false);

    if (res.ok) {
      setMsg({
        type: "ok",
        text: `Bet placed — ${formatPoints(stake)} on “${selected.label}”. Balance: ${formatPoints(
          BigInt(res.data.newBalance),
        )}.`,
      });
      setStakeRaw("");
      setSelectedId(null);
      router.refresh();
    } else {
      setMsg({ type: "err", text: res.error });
      router.refresh();
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-3">
        {outcomes.map((o) => {
          const active = o.id === selectedId;
          const risk = riskFromOdds(o.odds);
          return (
            <button
              key={o.id}
              type="button"
              disabled={locked}
              onClick={() => setSelectedId(active ? null : o.id)}
              className={[
                "flex flex-col gap-2 rounded-xl border px-3 py-2.5 text-left transition",
                locked
                  ? "cursor-not-allowed border-white/10 bg-white/[0.02] opacity-60"
                  : active
                    ? "border-accent bg-accent/10 shadow-glow"
                    : "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]",
              ].join(" ")}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{o.label}</span>
                <OddsValue odds={o.odds} previousOdds={o.previousOdds} />
              </div>
              <span className={`${risk.className} self-start`} title={risk.explanation}>
                {risk.level} risk
              </span>
            </button>
          );
        })}
      </div>

      {locked ? (
        suspended ? (
          <div className="flex items-center gap-2 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold-soft">
            <span>⏸</span>
            <span>
              <span className="font-semibold">Betting paused.</span> An admin temporarily suspended
              this market — it’ll reopen shortly.
            </span>
          </div>
        ) : (
          <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-300">
            {lockLabel ?? "Betting is closed."}
          </p>
        )
      ) : (
        <div className="glass rounded-xl p-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="grow">
              <label className="label">Stake (points)</label>
              <input
                className="input"
                inputMode="numeric"
                placeholder="e.g. 100"
                value={stakeRaw}
                onChange={(e) => setStakeRaw(e.target.value.replace(/[^\d]/g, ""))}
              />
            </div>
            <div className="flex gap-1">
              {[10, 50, 100].map((v) => (
                <button
                  key={v}
                  type="button"
                  className="btn-secondary px-2 py-1 text-xs"
                  onClick={() => setStakeRaw(String(v))}
                >
                  {v}
                </button>
              ))}
              <button
                type="button"
                className="btn-secondary px-2 py-1 text-xs"
                onClick={() => setStakeRaw(String(balance))}
              >
                Max
              </button>
            </div>
            <button
              type="button"
              className="btn-primary"
              disabled={pending || !selected || !stakeValid || tooMuch}
              onClick={confirm}
            >
              {pending ? "Placing…" : "Place bet"}
            </button>
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-slate-400">
              {selected ? (
                <>
                  Pick: <span className="text-slate-200">{selected.label}</span> @{" "}
                  <OddsValue odds={selected.odds} previousOdds={selected.previousOdds} />
                  {selectedRisk && (
                    <span className={`${selectedRisk.className} ml-2`} title={selectedRisk.explanation}>
                      {selectedRisk.level} risk
                    </span>
                  )}
                </>
              ) : (
                "Select an outcome above"
              )}
            </span>
            <span className="text-slate-400">
              Potential return:{" "}
              <span className="font-mono text-gold-soft">{formatPoints(potentialReturn)}</span>
              {potentialReturn > 0 && (
                <span className="text-slate-500"> (profit {formatPoints(potentialReturn - stake)})</span>
              )}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Your balance: {formatPoints(balance)}</p>
        </div>
      )}

      {msg && (
        <p className={`text-sm ${msg.type === "ok" ? "text-up" : "text-down"}`}>{msg.text}</p>
      )}
    </div>
  );
}
