"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { apiPost } from "@/lib/client";
import { formatPoints, formatOddsNum, returnForStake } from "@/lib/points";

type OutcomeView = { id: string; label: string; odds: number };

type Props = {
  marketId: string;
  outcomes: OutcomeView[];
  locked: boolean;
  lockLabel?: string | null;
  signedIn: boolean;
  balance: bigint;
};

type Msg = { type: "ok" | "err"; text: string } | null;

export function BetBox({ outcomes, locked, lockLabel, signedIn, balance }: Props) {
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

  if (!signedIn) {
    return (
      <div className="rounded-lg border border-white/10 bg-pitch-850/60 p-3 text-sm text-slate-400">
        <Link href="/login" className="text-accent hover:underline">
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
    const res = await apiPost<{ newBalance: string; potentialReturn: string }>("/api/bets", {
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
      router.refresh(); // re-sync lock state if betting just closed
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-3">
        {outcomes.map((o) => {
          const active = o.id === selectedId;
          return (
            <button
              key={o.id}
              type="button"
              disabled={locked}
              onClick={() => setSelectedId(active ? null : o.id)}
              className={[
                "flex items-center justify-between rounded-lg border px-3 py-2 text-left transition",
                locked
                  ? "cursor-not-allowed border-white/10 bg-pitch-850/40 opacity-60"
                  : active
                    ? "border-accent bg-accent/15"
                    : "border-white/10 bg-pitch-850 hover:border-white/25",
              ].join(" ")}
            >
              <span className="text-sm font-medium">{o.label}</span>
              <span className="font-mono text-sm text-accent">{formatOddsNum(o.odds)}</span>
            </button>
          );
        })}
      </div>

      {locked ? (
        <p className="text-sm text-amber-300">{lockLabel ?? "Betting is closed."}</p>
      ) : (
        <div className="rounded-lg border border-white/10 bg-pitch-850/60 p-3">
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
            <button type="button" className="btn-primary" disabled={pending || !selected || !stakeValid || tooMuch} onClick={confirm}>
              {pending ? "Placing…" : "Place bet"}
            </button>
          </div>

          <div className="mt-2 flex flex-wrap justify-between gap-2 text-sm">
            <span className="text-slate-400">
              {selected ? (
                <>
                  Pick: <span className="text-slate-200">{selected.label}</span> @{" "}
                  <span className="font-mono text-accent">{formatOddsNum(selected.odds)}</span>
                </>
              ) : (
                "Select an outcome above"
              )}
            </span>
            <span className="text-slate-400">
              Potential return:{" "}
              <span className="font-mono text-slate-100">{formatPoints(potentialReturn)}</span>
              {potentialReturn > 0 && (
                <span className="text-slate-500"> (profit {formatPoints(potentialReturn - stake)})</span>
              )}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Your balance: {formatPoints(balance)}</p>
        </div>
      )}

      {msg && (
        <p className={`text-sm ${msg.type === "ok" ? "text-accent" : "text-red-300"}`}>{msg.text}</p>
      )}
    </div>
  );
}
