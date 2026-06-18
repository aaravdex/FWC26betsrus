"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/client";
import { formatOddsNum } from "@/lib/points";

type Outcome = { id: string; label: string; odds: number };

// Mark which teams qualified for the Round of 16, then settle. Teams ticked here
// win (pay out); all others lose. Settlement is idempotent server-side.
export function QualificationSettleForm({
  marketId,
  outcomes,
}: {
  marketId: string;
  outcomes: Outcome[];
}) {
  const router = useRouter();
  const [qualified, setQualified] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  function toggle(id: string) {
    setQualified((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function settle() {
    if (
      !window.confirm(
        `Settle the Round of 16 market?\n\n${qualified.size} team(s) marked as qualified will be paid out; every other team loses. This cannot be undone.`,
      )
    ) {
      return;
    }
    setPending(true);
    setMsg(null);
    const res = await apiPost(`/api/admin/markets/${marketId}/settle-qualification`, {
      qualifiedOutcomeIds: [...qualified],
    });
    setPending(false);
    if (res.ok) {
      setMsg({ type: "ok", text: "Settled — payouts applied through the ledger." });
      router.refresh();
    } else {
      setMsg({ type: "err", text: res.error });
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        Tick every team that qualified for the Round of 16, then settle. Settling twice never pays
        twice.
      </p>
      <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
        {outcomes.map((o) => {
          const on = qualified.has(o.id);
          return (
            <label
              key={o.id}
              className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-sm transition ${
                on ? "border-up/40 bg-up/10" : "border-white/10 bg-white/[0.03] hover:border-white/20"
              }`}
            >
              <span className="flex items-center gap-2">
                <input type="checkbox" checked={on} onChange={() => toggle(o.id)} className="accent-up" />
                {o.label}
              </span>
              <span className="font-mono text-xs text-accent-soft">{formatOddsNum(o.odds)}</span>
            </label>
          );
        })}
      </div>
      <div className="flex items-center gap-3">
        <button onClick={settle} className="btn-primary" disabled={pending}>
          {pending ? "Settling…" : `Settle — ${qualified.size} qualified`}
        </button>
        {msg && (
          <span className={`text-sm ${msg.type === "ok" ? "text-up" : "text-down"}`}>{msg.text}</span>
        )}
      </div>
    </div>
  );
}
