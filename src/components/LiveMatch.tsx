"use client";

import { useEffect, useState } from "react";
import type { LiveMatchView, LiveMarket, LiveEvent } from "@/lib/live";
import { apiGet } from "@/lib/client";
import { BetBox } from "@/components/BetBox";
import { StatusBadge } from "@/components/StatusBadge";
import { AnimatedScore } from "@/components/AnimatedScore";

const POLL_MS = 3000;

const EVENT_META: Record<string, { icon: string; label: string }> = {
  KICKOFF: { icon: "▶️", label: "Kick-off" },
  GOAL: { icon: "⚽", label: "Goal" },
  OWN_GOAL: { icon: "🥅", label: "Own goal" },
  PENALTY_SCORED: { icon: "⚽", label: "Penalty scored" },
  PENALTY_MISSED: { icon: "❌", label: "Penalty missed" },
  YELLOW_CARD: { icon: "🟨", label: "Yellow card" },
  RED_CARD: { icon: "🟥", label: "Red card" },
  SUBSTITUTION: { icon: "🔁", label: "Substitution" },
  INJURY: { icon: "🚑", label: "Injury" },
  VAR: { icon: "📺", label: "VAR" },
  HALFTIME: { icon: "⏸️", label: "Half-time" },
  FULLTIME: { icon: "🏁", label: "Full-time" },
  NOTE: { icon: "📝", label: "Note" },
};

function minuteLabel(view: LiveMatchView): string {
  if (view.liveStatus === "HALFTIME") return "Half-time";
  if (view.liveStatus === "FULLTIME") return "Full-time";
  if (view.liveStatus === "LIVE") return view.minute != null ? `${view.minute}'` : "Live";
  return "Scheduled";
}

function Scoreboard({ view }: { view: LiveMatchView }) {
  const home = view.homeScore ?? 0;
  const away = view.awayScore ?? 0;
  const showScore = view.liveStatus !== "SCHEDULED" || view.status === "SETTLED";
  return (
    <div className="card relative overflow-hidden p-6">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-accent/[0.06] to-transparent" />
      <div className="relative flex items-center justify-between gap-4">
        <div className="flex-1 text-center sm:text-right">
          <div className="text-lg font-semibold sm:text-xl">{view.homeTeam.name}</div>
          <div className="text-xs uppercase tracking-widest text-slate-500">{view.homeTeam.code}</div>
        </div>
        <div className="flex flex-col items-center gap-1 px-2">
          {showScore ? (
            <div className="flex items-center gap-3">
              <AnimatedScore value={home} className="text-4xl" />
              <span className="text-2xl text-slate-600">–</span>
              <AnimatedScore value={away} className="text-4xl" />
            </div>
          ) : (
            <div className="text-sm text-slate-500">vs</div>
          )}
          <div className="mt-1 flex items-center gap-2">
            <StatusBadge status={view.liveStatus} />
            <span className="text-xs text-slate-400">{minuteLabel(view)}</span>
          </div>
        </div>
        <div className="flex-1 text-center sm:text-left">
          <div className="text-lg font-semibold sm:text-xl">{view.awayTeam.name}</div>
          <div className="text-xs uppercase tracking-widest text-slate-500">{view.awayTeam.code}</div>
        </div>
      </div>
    </div>
  );
}

function MarketCard({
  market,
  signedIn,
  balance,
}: {
  market: LiveMarket;
  signedIn: boolean;
  balance: bigint;
}) {
  const timePassed = new Date(market.locksAt).getTime() <= Date.now();
  const suspended = market.status === "SUSPENDED";
  const locked = market.status !== "OPEN" || timePassed;
  const lockLabel = suspended
    ? "Betting paused"
    : market.status === "SETTLED"
      ? "This market is settled"
      : locked
        ? "Betting closed"
        : null;

  return (
    <section className="card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">{market.title}</h3>
        <StatusBadge status={market.status} />
      </div>
      <BetBox
        marketId={market.id}
        outcomes={market.outcomes.map((o) => ({
          id: o.id,
          label: o.label,
          odds: o.odds,
          previousOdds: o.previousOdds,
        }))}
        locked={locked}
        lockLabel={lockLabel}
        suspended={suspended}
        signedIn={signedIn}
        balance={balance}
      />
    </section>
  );
}

function Timeline({ view }: { view: LiveMatchView }) {
  const sideName = (e: LiveEvent) => e.teamName ?? "";
  return (
    <div className="card p-4">
      <h3 className="mb-3 flex items-center gap-2 font-semibold">
        <span aria-hidden>🗒️</span> Match timeline
      </h3>
      {view.events.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">
          No events yet. The admin adds goals, cards and subs as they happen.
        </p>
      ) : (
        <ol className="space-y-3">
          {view.events.map((e) => {
            const meta = EVENT_META[e.type] ?? { icon: "•", label: e.type };
            return (
              <li key={e.id} className="flex gap-3 text-sm animate-slideUp">
                <div className="w-9 shrink-0 text-right font-mono text-xs text-slate-500">
                  {e.minute != null ? `${e.minute}'` : "—"}
                </div>
                <div className="text-base leading-none">{meta.icon}</div>
                <div className="min-w-0">
                  <div className="font-medium text-slate-200">
                    {meta.label}
                    {sideName(e) && <span className="text-slate-400"> · {sideName(e)}</span>}
                  </div>
                  {e.description && <div className="text-slate-400">{e.description}</div>}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

export function LiveMatch({
  initial,
  signedIn,
  balance,
}: {
  initial: LiveMatchView;
  signedIn: boolean;
  balance: bigint;
}) {
  const [view, setView] = useState<LiveMatchView>(initial);

  useEffect(() => {
    let active = true;
    async function poll() {
      const res = await apiGet<LiveMatchView>(`/api/matches/${initial.id}/live`);
      if (active && res.ok) setView(res.data);
    }
    const id = setInterval(poll, POLL_MS);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [initial.id]);

  return (
    <div className="space-y-6">
      <Scoreboard view={view} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {view.markets.map((mk) => (
            <MarketCard key={mk.id} market={mk} signedIn={signedIn} balance={balance} />
          ))}
        </div>
        <Timeline view={view} />
      </div>
    </div>
  );
}
