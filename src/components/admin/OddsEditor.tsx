"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPatch } from "@/lib/client";

type Outcome = { id: string; label: string; odds: number };

// Edit decimal odds for every outcome of a market at once. Saving does not
// affect already-placed bets (they locked their odds at placement).
export function OddsEditor({
  marketId,
  outcomes,
  disabled,
}: {
  marketId: string;
  outcomes: Outcome[];
  disabled?: boolean;
}) {
  const router = useRouter();
  const [vals, setVals] = useState<Record<string, string>>(
    Object.fromEntries(outcomes.map((o) => [o.id, o.odds.toFixed(2)])),
  );
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function save() {
    setMsg(null);
    const odds = Object.entries(vals).map(([outcomeId, v]) => ({ outcomeId, odds: Number(v) }));
    const bad = odds.find((o) => !Number.isFinite(o.odds) || o.odds < 1.01);
    if (bad) {
      setMsg({ type: "err", text: "Every outcome needs odds of at least 1.01." });
      return;
    }
    setPending(true);
    const res = await apiPatch(`/api/admin/markets/${marketId}/odds`, { odds });
    setPending(false);
    if (res.ok) {
      setMsg({ type: "ok", text: "Odds saved." });
      router.refresh();
    } else {
      setMsg({ type: "err", text: res.error });
    }
  }

  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-3">
        {outcomes.map((o) => (
          <label key={o.id} className="block">
            <span className="label">{o.label}</span>
            <input
              className="input font-mono"
              inputMode="decimal"
              disabled={disabled}
              value={vals[o.id] ?? ""}
              onChange={(e) => setVals((p) => ({ ...p, [o.id]: e.target.value }))}
            />
          </label>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button className="btn-secondary" onClick={save} disabled={pending || disabled}>
          {pending ? "Saving…" : "Save odds"}
        </button>
        {msg && (
          <span className={`text-sm ${msg.type === "ok" ? "text-accent" : "text-red-300"}`}>
            {msg.text}
          </span>
        )}
      </div>
    </div>
  );
}
