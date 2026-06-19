"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/client";

// Cancel (void + refund) or postpone / reschedule a match. Cancelling voids the
// match-winner market and refunds every open stake through the ledger; the match
// row and bets are preserved.
export function MatchLifecycleControls({
  matchId,
  status,
  kickoffLocal,
}: {
  matchId: string;
  status: string;
  kickoffLocal: string;
}) {
  const router = useRouter();
  const [kickoff, setKickoff] = useState(kickoffLocal);
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const cancelled = status === "CANCELLED";

  async function call(path: string, body: Record<string, unknown>, okText: string) {
    setMsg(null);
    setPending(true);
    const res = await apiPost(`/api/admin/matches/${matchId}/${path}`, body);
    setPending(false);
    if (res.ok) {
      setMsg({ type: "ok", text: okText });
      router.refresh();
    } else {
      setMsg({ type: "err", text: res.error });
    }
  }

  return (
    <div className="space-y-3">
      {cancelled ? (
        <p className="text-sm text-down">
          This match is cancelled — all open bets were voided and refunded.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-end gap-3">
            <label className="grow">
              <span className="label">Reschedule to (reopens betting)</span>
              <input
                type="datetime-local"
                className="input"
                value={kickoff}
                onChange={(e) => setKickoff(e.target.value)}
              />
            </label>
            <button
              className="btn-secondary"
              disabled={pending}
              onClick={() => call("postpone", { kickoff }, "Match rescheduled — betting reopened.")}
            >
              Reschedule
            </button>
            <button
              className="btn-secondary"
              disabled={pending}
              onClick={() =>
                call("postpone", {}, "Match postponed — betting closed until rescheduled.")
              }
            >
              Postpone (close betting)
            </button>
          </div>
          <div className="border-t border-white/10 pt-3">
            <button
              className="btn-danger"
              disabled={pending}
              onClick={() => {
                if (
                  confirm(
                    "Cancel this match? All open bets will be voided and their stakes refunded. This can't be undone.",
                  )
                ) {
                  call("cancel", {}, "Match cancelled — open bets voided and refunded.");
                }
              }}
            >
              Cancel match &amp; refund bets
            </button>
          </div>
        </>
      )}
      {msg && (
        <span className={`text-sm ${msg.type === "ok" ? "text-accent" : "text-red-300"}`}>
          {msg.text}
        </span>
      )}
    </div>
  );
}
