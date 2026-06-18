"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost, apiDelete } from "@/lib/client";

type Team = { id: string; name: string };
type EventRow = {
  id: string;
  type: string;
  minute: number | null;
  teamName: string | null;
  description: string | null;
};

const TYPES = [
  "GOAL",
  "OWN_GOAL",
  "PENALTY_SCORED",
  "PENALTY_MISSED",
  "YELLOW_CARD",
  "RED_CARD",
  "SUBSTITUTION",
  "INJURY",
  "VAR",
  "KICKOFF",
  "HALFTIME",
  "FULLTIME",
  "NOTE",
];

export function AddEventForm({
  matchId,
  teams,
  events,
}: {
  matchId: string;
  teams: Team[];
  events: EventRow[];
}) {
  const router = useRouter();
  const [type, setType] = useState("GOAL");
  const [minute, setMinute] = useState("");
  const [teamId, setTeamId] = useState("");
  const [description, setDescription] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await apiPost(`/api/admin/matches/${matchId}/events`, {
      type,
      minute: minute === "" ? null : Number(minute),
      teamId: teamId || null,
      description: description || undefined,
    });
    if (res.ok) {
      setMinute("");
      setDescription("");
      router.refresh();
    } else {
      setMsg(res.error);
    }
  }

  async function remove(id: string) {
    const res = await apiDelete(`/api/admin/matches/${matchId}/events/${id}`);
    if (res.ok) router.refresh();
  }

  return (
    <div className="space-y-3">
      <form onSubmit={add} className="space-y-2">
        <div className="grid gap-2 sm:grid-cols-4">
          <label>
            <span className="label">Type</span>
            <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, " ").toLowerCase()}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="label">Minute</span>
            <input
              className="input font-mono"
              inputMode="numeric"
              placeholder="67"
              value={minute}
              onChange={(e) => setMinute(e.target.value.replace(/[^\d]/g, ""))}
            />
          </label>
          <label>
            <span className="label">Team</span>
            <select className="input" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
              <option value="">—</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="label">Note</span>
            <input
              className="input"
              placeholder="Scorer, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-primary">Add event</button>
          {msg && <span className="text-sm text-down">{msg}</span>}
        </div>
      </form>

      {events.length > 0 && (
        <ul className="divide-y divide-white/5 rounded-xl border border-white/10">
          {events.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <span className="text-slate-300">
                <span className="font-mono text-xs text-slate-500">
                  {e.minute != null ? `${e.minute}'` : "—"}
                </span>{" "}
                {e.type.replace(/_/g, " ").toLowerCase()}
                {e.teamName && <span className="text-slate-500"> · {e.teamName}</span>}
                {e.description && <span className="text-slate-500"> — {e.description}</span>}
              </span>
              <button onClick={() => remove(e.id)} className="text-xs text-down/70 hover:text-down">
                remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
