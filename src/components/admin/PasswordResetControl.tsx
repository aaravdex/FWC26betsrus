"use client";

import { useState } from "react";
import { apiPost } from "@/lib/client";

// Admin-only password reset (no email = no self-service reset). Reveals a small
// inline field, sets a new password, and invalidates the user's sessions.
export function PasswordResetControl({ userId, username }: { userId: string; username: string }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (password.length < 8) {
      setMsg({ type: "err", text: "Min 8 characters." });
      return;
    }
    setPending(true);
    const res = await apiPost(`/api/admin/users/${userId}/password`, { password });
    setPending(false);
    if (res.ok) {
      setMsg({ type: "ok", text: "Password reset." });
      setPassword("");
      setOpen(false);
    } else {
      setMsg({ type: "err", text: res.error });
    }
  }

  if (!open) {
    return (
      <span className="inline-flex items-center gap-2">
        <button className="btn-secondary px-2 py-1 text-xs" onClick={() => setOpen(true)}>
          Reset password
        </button>
        {msg && (
          <span className={`text-xs ${msg.type === "ok" ? "text-accent" : "text-red-300"}`}>
            {msg.text}
          </span>
        )}
      </span>
    );
  }

  return (
    <form onSubmit={submit} className="inline-flex items-center gap-1">
      <input
        type="text"
        className="input w-40 px-2 py-1 text-xs"
        placeholder={`New password for ${username}`}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoFocus
      />
      <button className="btn-primary px-2 py-1 text-xs" disabled={pending}>
        {pending ? "…" : "Save"}
      </button>
      <button
        type="button"
        className="btn-secondary px-2 py-1 text-xs"
        onClick={() => {
          setOpen(false);
          setPassword("");
          setMsg(null);
        }}
      >
        Cancel
      </button>
      {msg && <span className="text-xs text-red-300">{msg.text}</span>}
    </form>
  );
}
