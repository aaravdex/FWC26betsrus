"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/client";

type Team = { id: string; name: string };

export function CreatePlayerForm({ teams }: { teams: Team[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [teamId, setTeamId] = useState("");
  const [position, setPosition] = useState("");
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setPending(true);
    const res = await apiPost("/api/admin/players", {
      name,
      teamId: teamId || undefined,
      position: position || undefined,
    });
    setPending(false);
    if (res.ok) {
      setMsg({ type: "ok", text: `Added ${name}.` });
      setName("");
      setPosition("");
      router.refresh();
    } else {
      setMsg({ type: "err", text: res.error });
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
      <label className="grow">
        <span className="label">Player name</span>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Kylian Mbappé" />
      </label>
      <label className="w-44">
        <span className="label">Team</span>
        <select className="input" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
          <option value="">— none —</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
      <label className="w-24">
        <span className="label">Position</span>
        <input className="input" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="FW" />
      </label>
      <button className="btn-secondary" disabled={pending}>
        {pending ? "Adding…" : "Add player"}
      </button>
      {msg && (
        <span className={`text-sm ${msg.type === "ok" ? "text-accent" : "text-red-300"}`}>{msg.text}</span>
      )}
    </form>
  );
}
