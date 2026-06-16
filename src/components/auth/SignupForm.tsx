"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/client";

export function SignupForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords don’t match.");
      return;
    }
    setPending(true);
    const res = await apiPost("/api/auth/register", { username, password });
    setPending(false);
    if (res.ok) {
      router.push("/matches");
      router.refresh();
    } else {
      setError(res.error);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label" htmlFor="username">
          Username <span className="text-slate-500">(your public display name)</span>
        </label>
        <input
          id="username"
          autoComplete="username"
          required
          className="input"
          placeholder="pick_a_handle"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <p className="mt-1 text-xs text-slate-500">3–24 characters: letters, numbers, _ . -</p>
      </div>
      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          className="input"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div>
        <label className="label" htmlFor="confirm">
          Confirm password
        </label>
        <input
          id="confirm"
          type="password"
          autoComplete="new-password"
          required
          className="input"
          placeholder="Re-enter your password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>

      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending ? "Creating account…" : "Create account & play"}
      </button>

      {error && <p className="text-sm text-red-300">{error}</p>}
    </form>
  );
}
