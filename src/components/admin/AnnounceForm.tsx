"use client";

import { useState } from "react";
import { apiPost } from "@/lib/client";

// Send an announcement to every player's in-app notification centre.
export function AnnounceForm() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function send() {
    setMsg(null);
    setPending(true);
    const res = await apiPost<{ recipients: number }>("/api/admin/announce", { title, body });
    setPending(false);
    if (res.ok) {
      setMsg({ type: "ok", text: `Sent to ${res.data.recipients} player(s).` });
      setTitle("");
      setBody("");
    } else {
      setMsg({ type: "err", text: res.error });
    }
  }

  return (
    <div className="card space-y-3 p-4">
      <div>
        <h2 className="font-semibold">Send an announcement</h2>
        <p className="text-xs text-slate-500">
          Posts to every player&rsquo;s notification bell. In-app only — no email or push.
        </p>
      </div>
      <label className="block">
        <span className="label">Title</span>
        <input
          className="input"
          value={title}
          maxLength={120}
          placeholder="e.g. Round of 16 markets are open!"
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>
      <label className="block">
        <span className="label">Message</span>
        <textarea
          className="input min-h-[72px]"
          value={body}
          maxLength={500}
          placeholder="Write your announcement…"
          onChange={(e) => setBody(e.target.value)}
        />
      </label>
      <div className="flex items-center gap-3">
        <button
          className="btn-primary"
          disabled={pending || title.trim().length === 0 || body.trim().length === 0}
          onClick={send}
        >
          {pending ? "Sending…" : "Send announcement"}
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
