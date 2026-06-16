"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/client";

// Enter the final score to settle a match's winner + team-goals markets.
export function SettleMatchForm({
  matchId,
  homeName,
  awayName,
}: {
  matchId: string;
  homeName: string;
  awayName: string;
}) {
  const router = useRouter();
  const [home, setHome] = useState("");
  const [away, setAway] = useState("");
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function settle() {
    setMsg(null);
    const h = Number.parseInt(home, 10);
    const a = Number.parseInt(away, 10);
    if (!Number.isInteger(h) || !Number.isInteger(a) || h < 0 || a < 0) {
      return setMsg({ type: "err", text: "Enter both scores as whole numbers." });
    }
    if (!window.confirm(`Settle ${homeName} ${h} – ${a} ${awayName}? This pays out and cannot be undone.`)) {
      return;
    }
    setPending(true);
    const res = await apiPost<{ summaries: { wonBets: number; pointsPaid: number }[] }>(
      `/api/admin/matches/${matchId}/settle`,
      { homeScore: h, awayScore: a },
    );
    setPending(false);
    if (res.ok) {
      const won = res.data.summaries.reduce((s, x) => s + x.wonBets, 0);
      const paid = res.data.summaries.reduce((s, x) => s + x.pointsPaid, 0);
      setMsg({ type: "ok", text: `Settled — ${won} winning bet(s), ${paid} pts paid.` });
      router.refresh();
    } else {
      setMsg({ type: "err", text: res.error });
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="w-28">
        <span className="label">{homeName}</span>
        <input className="input font-mono" inputMode="numeric" value={home} onChange={(e) => setHome(e.target.value.replace(/[^\d]/g, ""))} />
      </label>
      <span className="pb-2 text-slate-500">–</span>
      <label className="w-28">
        <span className="label">{awayName}</span>
        <input className="input font-mono" inputMode="numeric" value={away} onChange={(e) => setAway(e.target.value.replace(/[^\d]/g, ""))} />
      </label>
      <button className="btn-primary" onClick={settle} disabled={pending}>
        {pending ? "Settling…" : "Enter result & settle"}
      </button>
      {msg && (
        <span className={`text-sm ${msg.type === "ok" ? "text-accent" : "text-red-300"}`}>
          {msg.text}
        </span>
      )}
    </div>
  );
}
