"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/client";

// Add (or re-price) a team/player selection in a tournament-level market.
export function AddSelectionForm({
  endpoint,
  fieldLabel,
  idField,
  options,
}: {
  endpoint: string;
  fieldLabel: string;
  idField: "teamId" | "playerId";
  options: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [id, setId] = useState("");
  const [odds, setOdds] = useState("");
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function add() {
    setMsg(null);
    const o = Number(odds);
    if (!id) return setMsg({ type: "err", text: `Select a ${fieldLabel.toLowerCase()}.` });
    if (!Number.isFinite(o) || o < 1.01) return setMsg({ type: "err", text: "Odds must be ≥ 1.01." });

    setPending(true);
    const res = await apiPost(endpoint, { [idField]: id, odds: o });
    setPending(false);
    if (res.ok) {
      setMsg({ type: "ok", text: "Saved." });
      setOdds("");
      router.refresh();
    } else {
      setMsg({ type: "err", text: res.error });
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="grow">
        <span className="label">{fieldLabel}</span>
        <select className="input" value={id} onChange={(e) => setId(e.target.value)}>
          <option value="">— select —</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label className="w-28">
        <span className="label">Odds</span>
        <input
          className="input font-mono"
          inputMode="decimal"
          placeholder="e.g. 5.00"
          value={odds}
          onChange={(e) => setOdds(e.target.value)}
        />
      </label>
      <button className="btn-secondary" onClick={add} disabled={pending}>
        {pending ? "Saving…" : "Add / update"}
      </button>
      {msg && (
        <span className={`text-sm ${msg.type === "ok" ? "text-accent" : "text-red-300"}`}>
          {msg.text}
        </span>
      )}
    </div>
  );
}
