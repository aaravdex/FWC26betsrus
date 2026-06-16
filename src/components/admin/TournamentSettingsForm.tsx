"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPatch } from "@/lib/client";

export function TournamentSettingsForm({
  name,
  startsAtLocal,
  startingBalance,
}: {
  name: string;
  startsAtLocal: string;
  startingBalance: number;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    name,
    startsAt: startsAtLocal,
    startingBalance: String(startingBalance),
  });
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!form.startsAt) return setMsg({ type: "err", text: "Set a tournament start time." });
    setPending(true);
    const res = await apiPatch("/api/admin/tournament-settings", {
      name: form.name || undefined,
      startsAt: form.startsAt,
      startingBalance: form.startingBalance ? Number(form.startingBalance) : undefined,
    });
    setPending(false);
    if (res.ok) {
      setMsg({ type: "ok", text: "Settings saved. Tournament markets re-locked to the new start time." });
      router.refresh();
    } else {
      setMsg({ type: "err", text: res.error });
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <label>
          <span className="label">Tournament name</span>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
        </label>
        <label>
          <span className="label">Start / lock time</span>
          <input
            type="datetime-local"
            className="input"
            value={form.startsAt}
            onChange={(e) => setForm((p) => ({ ...p, startsAt: e.target.value }))}
          />
        </label>
        <label>
          <span className="label">Starting balance (new users)</span>
          <input
            className="input font-mono"
            inputMode="numeric"
            value={form.startingBalance}
            onChange={(e) => setForm((p) => ({ ...p, startingBalance: e.target.value.replace(/[^\d]/g, "") }))}
          />
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button className="btn-secondary" disabled={pending}>
          {pending ? "Saving…" : "Save tournament settings"}
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
