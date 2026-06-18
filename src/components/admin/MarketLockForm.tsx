"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPatch } from "@/lib/client";

// Set a market's lock datetime (Round of 16 group-stage lock).
export function MarketLockForm({
  marketId,
  locksAtLocal,
}: {
  marketId: string;
  locksAtLocal: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(locksAtLocal);
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setPending(true);
    const res = await apiPatch(`/api/admin/markets/${marketId}/lock`, { locksAt: value });
    setPending(false);
    if (res.ok) {
      setMsg("Saved.");
      router.refresh();
    } else {
      setMsg(res.error);
    }
  }

  return (
    <form onSubmit={save} className="flex flex-wrap items-end gap-2">
      <label>
        <span className="label">Group-stage lock — betting closes at</span>
        <input
          type="datetime-local"
          className="input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </label>
      <button className="btn-secondary" disabled={pending}>
        {pending ? "Saving…" : "Save lock time"}
      </button>
      {msg && <span className="text-sm text-slate-400">{msg}</span>}
    </form>
  );
}
