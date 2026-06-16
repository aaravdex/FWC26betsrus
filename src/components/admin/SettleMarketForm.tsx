"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/client";

type Outcome = { id: string; label: string };

// Settle a tournament-level market by picking the winning outcome.
export function SettleMarketForm({
  marketId,
  outcomes,
}: {
  marketId: string;
  outcomes: Outcome[];
}) {
  const router = useRouter();
  const [winningOutcomeId, setWinningOutcomeId] = useState("");
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function settle() {
    setMsg(null);
    if (!winningOutcomeId) {
      setMsg({ type: "err", text: "Pick the winning outcome." });
      return;
    }
    const chosen = outcomes.find((o) => o.id === winningOutcomeId);
    if (!window.confirm(`Settle this market with "${chosen?.label}" as the winner? This pays out and cannot be undone.`)) {
      return;
    }
    setPending(true);
    const res = await apiPost<{ wonBets: number; pointsPaid: number }>(
      `/api/admin/markets/${marketId}/settle`,
      { winningOutcomeId },
    );
    setPending(false);
    if (res.ok) {
      setMsg({ type: "ok", text: `Settled — ${res.data.wonBets} winning bet(s), ${res.data.pointsPaid} pts paid.` });
      router.refresh();
    } else {
      setMsg({ type: "err", text: res.error });
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="grow">
        <span className="label">Winning outcome</span>
        <select
          className="input"
          value={winningOutcomeId}
          onChange={(e) => setWinningOutcomeId(e.target.value)}
        >
          <option value="">— select —</option>
          {outcomes.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <button className="btn-primary" onClick={settle} disabled={pending}>
        {pending ? "Settling…" : "Settle market"}
      </button>
      {msg && (
        <span className={`text-sm ${msg.type === "ok" ? "text-accent" : "text-red-300"}`}>
          {msg.text}
        </span>
      )}
    </div>
  );
}
