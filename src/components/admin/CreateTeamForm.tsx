"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/client";

export function CreateTeamForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [group, setGroup] = useState("");
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setPending(true);
    const res = await apiPost("/api/admin/teams", { name, code, group: group || undefined });
    setPending(false);
    if (res.ok) {
      setMsg({ type: "ok", text: `Added ${name}.` });
      setName("");
      setCode("");
      setGroup("");
      router.refresh();
    } else {
      setMsg({ type: "err", text: res.error });
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
      <label className="grow">
        <span className="label">Team name</span>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Brazil" />
      </label>
      <label className="w-24">
        <span className="label">Code</span>
        <input className="input uppercase" value={code} onChange={(e) => setCode(e.target.value)} placeholder="BRA" />
      </label>
      <label className="w-20">
        <span className="label">Group</span>
        <input className="input" value={group} onChange={(e) => setGroup(e.target.value)} placeholder="B" />
      </label>
      <button className="btn-secondary" disabled={pending}>
        {pending ? "Adding…" : "Add team"}
      </button>
      {msg && (
        <span className={`text-sm ${msg.type === "ok" ? "text-accent" : "text-red-300"}`}>{msg.text}</span>
      )}
    </form>
  );
}
