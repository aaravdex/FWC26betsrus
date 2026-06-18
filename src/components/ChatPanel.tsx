"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiGet, apiPost, apiDelete } from "@/lib/client";
import { CHAT_MAX_LEN } from "@/lib/validation";

type Msg = {
  id: string;
  username: string;
  role: string;
  body: string | null;
  deleted: boolean;
  createdAt: string;
};

type Me = { id: string; username: string; role: string };

const POLL_MS = 3000;

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ChatPanel({ me }: { me: Me }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const lastTs = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const merge = useCallback((incoming: Msg[]) => {
    if (incoming.length === 0) return;
    setMessages((prev) => {
      const byId = new Map(prev.map((m) => [m.id, m]));
      for (const m of incoming) byId.set(m.id, m);
      const all = [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      lastTs.current = all[all.length - 1]?.createdAt ?? lastTs.current;
      return all.slice(-200);
    });
  }, []);

  // Initial load + polling.
  useEffect(() => {
    let active = true;
    async function poll() {
      const url = lastTs.current ? `/api/chat?after=${encodeURIComponent(lastTs.current)}` : "/api/chat";
      const res = await apiGet<{ messages: Msg[] }>(url);
      if (active && res.ok) merge(res.data.messages);
    }
    poll();
    const id = setInterval(poll, POLL_MS);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [merge]);

  // Auto-scroll to bottom when messages change (if already near the bottom).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (nearBottom) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const body = input.trim();
    if (!body) return;
    setSending(true);
    const res = await apiPost<{ message: Msg }>("/api/chat", { body });
    setSending(false);
    if (res.ok) {
      merge([res.data.message]);
      setInput("");
      requestAnimationFrame(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      });
    } else {
      setError(res.error);
    }
  }

  async function remove(id: string) {
    const res = await apiDelete(`/api/admin/chat/${id}`);
    if (res.ok) {
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, deleted: true, body: null } : m)));
    }
  }

  return (
    <div className="card flex h-[28rem] flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h2 className="flex items-center gap-2 font-semibold">
          <span className="live-dot" /> Live chat
        </h2>
        <span className="text-xs text-slate-500">All players · be kind</span>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-500">
            No messages yet — say hello 👋
          </p>
        )}
        {messages.map((m) => {
          const mine = m.username === me.username;
          return (
            <div key={m.id} className="group flex gap-2 text-sm">
              <div className="min-w-0 flex-1">
                <span
                  className={`font-medium ${
                    m.role === "ADMIN" ? "text-gold-soft" : mine ? "text-accent-soft" : "text-slate-200"
                  }`}
                >
                  {m.username}
                  {m.role === "ADMIN" && <span className="ml-1 text-[10px] uppercase text-gold/70">admin</span>}
                </span>
                <span className="ml-2 text-[11px] text-slate-600">{timeOf(m.createdAt)}</span>
                <div className="break-words text-slate-300">
                  {m.deleted ? (
                    <span className="italic text-slate-600">message removed by an admin</span>
                  ) : (
                    m.body
                  )}
                </div>
              </div>
              {me.role === "ADMIN" && !m.deleted && (
                <button
                  onClick={() => remove(m.id)}
                  className="invisible shrink-0 self-start text-xs text-down/70 hover:text-down group-hover:visible"
                  title="Delete message"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>

      <form onSubmit={send} className="border-t border-white/10 p-3">
        {error && <p className="mb-2 text-xs text-down">{error}</p>}
        <div className="flex gap-2">
          <input
            className="input"
            placeholder="Message the table…"
            maxLength={CHAT_MAX_LEN}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button className="btn-primary px-4" disabled={sending || !input.trim()}>
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
