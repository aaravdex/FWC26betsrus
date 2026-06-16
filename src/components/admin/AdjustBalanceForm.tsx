"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/client";

type UserOpt = { id: string; username: string; balance: bigint };

// Manual ledger correction. Positive adds points, negative removes them.
export function AdjustBalanceForm({ users }: { users: UserOpt[] }) {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const amt = Number.parseInt(amount, 10);
    if (!userId) return setMsg({ type: "err", text: "Pick a user." });
    if (!Number.isInteger(amt) || amt === 0) return setMsg({ type: "err", text: "Enter a non-zero whole amount." });
    if (!description.trim()) return setMsg({ type: "err", text: "Add a reason." });

    setPending(true);
    const res = await apiPost("/api/admin/adjust", { userId, amount: amt, description });
    setPending(false);
    if (res.ok) {
      setMsg({ type: "ok", text: "Adjustment applied." });
      setAmount("");
      setDescription("");
      router.refresh();
    } else {
      setMsg({ type: "err", text: res.error });
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <label>
          <span className="label">User</span>
          <select className="input" value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">— select —</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.username} ({String(u.balance)} pts)
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">Amount (+/−)</span>
          <input
            className="input font-mono"
            inputMode="numeric"
            placeholder="-100"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d-]/g, ""))}
          />
        </label>
        <label>
          <span className="label">Reason</span>
          <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Correction" />
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button className="btn-secondary" disabled={pending}>
          {pending ? "Applying…" : "Apply adjustment"}
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
