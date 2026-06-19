"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPost } from "@/lib/client";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

type Feed = { unread: number; items: Notification[] };

const POLL_MS = 25_000;

function ago(iso: string): string {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function NotificationBell() {
  const router = useRouter();
  const [feed, setFeed] = useState<Feed>({ unread: 0, items: [] });
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await apiGet<Feed>("/api/notifications");
    if (res.ok) setFeed({ unread: res.data.unread, items: res.data.items });
  }, []);

  // Poll for new notifications.
  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  // Close the panel when clicking outside it.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const markAll = async () => {
    setFeed((f) => ({ unread: 0, items: f.items.map((i) => ({ ...i, readAt: i.readAt ?? new Date().toISOString() })) }));
    await apiPost("/api/notifications", { all: true });
    load();
  };

  const onItem = async (n: Notification) => {
    if (!n.readAt) {
      setFeed((f) => ({
        unread: Math.max(0, f.unread - 1),
        items: f.items.map((i) => (i.id === n.id ? { ...i, readAt: new Date().toISOString() } : i)),
      }));
      apiPost("/api/notifications", { ids: [n.id] });
    }
    if (n.href) {
      setOpen(false);
      router.push(n.href);
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((o) => !o)}
        className="relative grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-accent/30 hover:text-white"
      >
        <span className="text-base leading-none">🔔</span>
        {feed.unread > 0 && (
          <span className="absolute -right-1 -top-1 grid min-w-[18px] place-items-center rounded-full bg-down px-1 text-[10px] font-bold leading-[18px] text-white">
            {feed.unread > 9 ? "9+" : feed.unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-xl border border-white/10 bg-pitch-900/95 shadow-glow backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
            <span className="text-sm font-semibold">Notifications</span>
            {feed.unread > 0 && (
              <button onClick={markAll} className="text-xs text-accent-soft hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {feed.items.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-slate-500">
                You&apos;re all caught up.
              </p>
            ) : (
              feed.items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => onItem(n)}
                  className={`flex w-full gap-2 border-b border-white/5 px-3 py-2.5 text-left transition last:border-0 hover:bg-white/[0.04] ${
                    n.readAt ? "opacity-70" : ""
                  }`}
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      n.readAt ? "bg-transparent" : "bg-accent"
                    }`}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-slate-100">{n.title}</span>
                    <span className="block text-xs text-slate-400">{n.body}</span>
                    <span className="mt-0.5 block text-[10px] uppercase tracking-wide text-slate-600">
                      {ago(n.createdAt)}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
