"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPatch } from "@/lib/client";

// Reschedule a match or manually lock/unlock its betting.
export function MatchLockControls({
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

  async function send(body: Record<string, unknown>, okText: string) {
    setMsg(null);
    setPending(true);
    const res = await apiPatch(`/api/admin/matches/${matchId}`, body);
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
      <div className="flex flex-wrap items-end gap-3">
        <label className="grow">
          <span className="label">Reschedule kickoff</span>
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
          onClick={() => send({ kickoff }, "Kickoff updated.")}
        >
          Save time
        </button>
        {status === "LOCKED" ? (
          <button
            className="btn-secondary"
            disabled={pending}
            onClick={() => send({ action: "unlock" }, "Betting reopened.")}
          >
            Unlock betting
          </button>
        ) : (
          <button
            className="btn-danger"
            disabled={pending}
            onClick={() => send({ action: "lock" }, "Betting locked.")}
          >
            Lock betting now
          </button>
        )}
      </div>
      {msg && (
        <span className={`text-sm ${msg.type === "ok" ? "text-accent" : "text-red-300"}`}>
          {msg.text}
        </span>
      )}
    </div>
  );
}
