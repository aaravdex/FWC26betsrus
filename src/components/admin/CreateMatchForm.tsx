"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/client";

type Team = { id: string; name: string };

// Create a match; its match-winner market is auto-scaffolded server-side.
export function CreateMatchForm({ teams }: { teams: Team[] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    homeTeamId: "",
    awayTeamId: "",
    kickoff: "",
    homeOdds: "",
    drawOdds: "",
    awayOdds: "",
  });
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!form.homeTeamId || !form.awayTeamId || !form.kickoff) {
      return setMsg({ type: "err", text: "Home team, away team and kickoff are required." });
    }
    if (form.homeTeamId === form.awayTeamId) {
      return setMsg({ type: "err", text: "Home and away teams must differ." });
    }

    const body: Record<string, unknown> = {
      homeTeamId: form.homeTeamId,
      awayTeamId: form.awayTeamId,
      kickoff: form.kickoff,
    };
    if (form.homeOdds) body.homeOdds = form.homeOdds;
    if (form.drawOdds) body.drawOdds = form.drawOdds;
    if (form.awayOdds) body.awayOdds = form.awayOdds;

    setPending(true);
    const res = await apiPost<{ matchId: string }>("/api/admin/matches", body);
    setPending(false);
    if (res.ok) {
      router.push(`/admin/matches/${res.data.matchId}`);
      router.refresh();
    } else {
      setMsg({ type: "err", text: res.error });
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label>
          <span className="label">Team A</span>
          <select className="input" value={form.homeTeamId} onChange={set("homeTeamId")}>
            <option value="">— select —</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">Team B</span>
          <select className="input" value={form.awayTeamId} onChange={set("awayTeamId")}>
            <option value="">— select —</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="label">Kickoff (local time)</span>
        <input type="datetime-local" className="input" value={form.kickoff} onChange={set("kickoff")} />
      </label>

      <fieldset className="rounded-lg border border-white/10 p-3">
        <legend className="px-1 text-xs uppercase tracking-wide text-slate-500">
          Match-winner payouts (optional — defaults applied, edit later)
        </legend>
        <div className="grid grid-cols-3 gap-2">
          <label>
            <span className="label">Team A</span>
            <input className="input font-mono" inputMode="decimal" placeholder="2.00" value={form.homeOdds} onChange={set("homeOdds")} />
          </label>
          <label>
            <span className="label">Draw</span>
            <input className="input font-mono" inputMode="decimal" placeholder="3.20" value={form.drawOdds} onChange={set("drawOdds")} />
          </label>
          <label>
            <span className="label">Team B</span>
            <input className="input font-mono" inputMode="decimal" placeholder="3.80" value={form.awayOdds} onChange={set("awayOdds")} />
          </label>
        </div>
      </fieldset>

      <div className="flex items-center gap-3">
        <button className="btn-primary" disabled={pending}>
          {pending ? "Creating…" : "Create match"}
        </button>
        {msg && (
          <span className={`text-sm ${msg.type === "ok" ? "text-accent" : "text-red-300"}`}>
            {msg.text}
          </span>
        )}
      </div>
    </form>
  );
}
