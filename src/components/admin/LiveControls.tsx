"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPatch } from "@/lib/client";

type Initial = {
  liveStatus: string;
  minute: number | null;
  homeScore: number | null;
  awayScore: number | null;
};

const STATUSES = ["SCHEDULED", "LIVE", "HALFTIME", "FULLTIME"];

export function LiveControls({
  matchId,
  homeName,
  awayName,
  initial,
}: {
  matchId: string;
  homeName: string;
  awayName: string;
  initial: Initial;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initial.liveStatus);
  const [minute, setMinute] = useState(initial.minute?.toString() ?? "");
  const [home, setHome] = useState(initial.homeScore ?? 0);
  const [away, setAway] = useState(initial.awayScore ?? 0);
  const [msg, setMsg] = useState<string | null>(null);

  async function patch(data: Record<string, unknown>) {
    setMsg(null);
    const res = await apiPatch(`/api/admin/matches/${matchId}/live`, data);
    if (res.ok) router.refresh();
    else setMsg(res.error);
  }

  function bump(side: "home" | "away", delta: number) {
    if (side === "home") {
      const v = Math.max(0, home + delta);
      setHome(v);
      patch({ homeScore: v });
    } else {
      const v = Math.max(0, away + delta);
      setAway(v);
      patch({ awayScore: v });
    }
  }

  const Stepper = ({ side, name, value }: { side: "home" | "away"; name: string; value: number }) => (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
      <span className="truncate text-sm">{name}</span>
      <div className="flex items-center gap-2">
        <button type="button" className="btn-secondary px-2 py-1 text-xs" onClick={() => bump(side, -1)}>
          −
        </button>
        <span className="w-6 text-center font-mono text-lg font-semibold text-gold-soft">{value}</span>
        <button type="button" className="btn-primary px-2 py-1 text-xs" onClick={() => bump(side, +1)}>
          +
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <Stepper side="home" name={homeName} value={home} />
        <Stepper side="away" name={awayName} value={away} />
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <label className="grow">
          <span className="label">Play status</span>
          <select
            className="input"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              patch({ liveStatus: e.target.value });
            }}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="w-28">
          <span className="label">Minute</span>
          <input
            className="input font-mono"
            inputMode="numeric"
            placeholder="e.g. 67"
            value={minute}
            onChange={(e) => setMinute(e.target.value.replace(/[^\d]/g, ""))}
          />
        </label>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => patch({ minute: minute === "" ? null : Number(minute) })}
        >
          Set minute
        </button>
      </div>
      {msg && <p className="text-sm text-down">{msg}</p>}
      <p className="text-xs text-slate-500">
        Score changes broadcast to viewers within a few seconds (they animate on screen).
      </p>
    </div>
  );
}
