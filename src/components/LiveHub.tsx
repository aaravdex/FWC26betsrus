"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { LiveSummary } from "@/lib/live";
import { apiGet } from "@/lib/client";
import { resultCardClass } from "@/lib/results";
import { StatusBadge } from "@/components/StatusBadge";
import { AnimatedScore } from "@/components/AnimatedScore";
import { OddsRows } from "@/components/OddsRows";

const POLL_MS = 4000;

function MatchRow({ m }: { m: LiveSummary }) {
  const started = m.liveStatus !== "SCHEDULED";
  const min =
    m.liveStatus === "LIVE" ? (m.minute != null ? `${m.minute}'` : "Live") : "";
  return (
    <Link href={`/matches/${m.id}`} className={`card card-hover block p-4 ${resultCardClass(m.result)}`}>
      <div className="mb-2 flex items-center justify-between">
        <StatusBadge status={m.liveStatus} />
        <span className="text-xs text-slate-500">
          {min}
          {m.suspended && <span className="ml-2 text-gold-soft">⏸ paused</span>}
          {m.result === "won" && <span className="ml-2 font-medium text-up">✓ won</span>}
          {m.result === "lost" && <span className="ml-2 font-medium text-down">✗ lost</span>}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="truncate font-medium">{m.homeTeam.name}</div>
          <div className="truncate font-medium">{m.awayTeam.name}</div>
        </div>
        {started ? (
          <div className="flex flex-col items-end gap-1 text-right">
            <AnimatedScore value={m.homeScore ?? 0} className="text-xl text-gold-soft" />
            <AnimatedScore value={m.awayScore ?? 0} className="text-xl text-gold-soft" />
          </div>
        ) : (
          <div className="text-xs text-slate-500">vs</div>
        )}
      </div>
      <OddsRows
        rows={[
          { label: m.homeTeam.name, odds: m.odds.home },
          { label: "Draw", odds: m.odds.draw },
          { label: m.awayTeam.name, odds: m.odds.away },
        ]}
      />
    </Link>
  );
}

export function LiveHub({ initial }: { initial: LiveSummary[] }) {
  const [matches, setMatches] = useState(initial);

  useEffect(() => {
    let active = true;
    async function poll() {
      const res = await apiGet<{ matches: LiveSummary[] }>("/api/live");
      if (active && res.ok) setMatches(res.data.matches);
    }
    const id = setInterval(poll, POLL_MS);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const order = (s: string) =>
    s === "LIVE" ? 0 : s === "HALFTIME" ? 1 : s === "SCHEDULED" ? 2 : 3;
  const live = matches.filter((m) => m.liveStatus === "LIVE" || m.liveStatus === "HALFTIME");
  const scheduled = matches.filter((m) => m.liveStatus === "SCHEDULED");
  const finished = matches.filter((m) => m.liveStatus === "FULLTIME");

  const Section = ({ title, items }: { title: string; items: LiveSummary[] }) =>
    items.length === 0 ? null : (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">{title}</h2>
          <div className="rule flex-1" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.sort((a, b) => order(a.liveStatus) - order(b.liveStatus)).map((m) => (
            <MatchRow key={m.id} m={m} />
          ))}
        </div>
      </div>
    );

  return (
    <div className="space-y-8">
      <Section title="Live now" items={live} />
      <Section title="Upcoming" items={scheduled} />
      <Section title="Full-time" items={finished} />
    </div>
  );
}
