"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { apiPost } from "@/lib/client";

type Turn = { role: "user" | "assistant"; content: string };

const GREETING =
  "Hi! I'm BetSmart AI. I can explain decimal odds, work out your potential return and profit before you bet, talk through a market's status and its cosmetic risk label, and look at your own balance and bets. I never place bets — that's always your call with the bet button.";

const SUGGESTIONS = [
  "How do decimal odds work?",
  "What would 100 points return on this?",
  "Explain my open bets",
  "What does the risk label mean?",
];

function useMatchId() {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);
  return parts[0] === "matches" && parts[1] ? parts[1] : null;
}

export function BetSmartAI() {
  const matchId = useMatchId();
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [limit, setLimit] = useState<number | null>(null);
  const [limitInput, setLimitInput] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("betsmart_limit");
    if (stored) setLimit(Number(stored));
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history, pending, open]);

  async function send(text: string) {
    const msg = text.trim();
    if (!msg || pending) return;
    const next = [...history, { role: "user" as const, content: msg }];
    setHistory(next);
    setInput("");
    setPending(true);
    const res = await apiPost<{ reply: string }>("/api/assistant", { messages: next, matchId });
    setPending(false);
    if (res.ok) {
      setHistory((h) => [...h, { role: "assistant", content: res.data.reply }]);
    } else {
      setHistory((h) => [...h, { role: "assistant", content: `⚠️ ${res.error}` }]);
    }
  }

  function saveLimit(e: React.FormEvent) {
    e.preventDefault();
    const n = Number.parseInt(limitInput, 10);
    if (Number.isInteger(n) && n > 0) {
      sessionStorage.setItem("betsmart_limit", String(n));
      setLimit(n);
      setLimitInput("");
    }
  }

  return (
    <>
      {/* Launcher */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-gradient-to-br from-accent to-accent-deep px-4 py-3 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5"
        aria-label="Open BetSmart AI"
      >
        <span aria-hidden>✨</span>
        BetSmart AI
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-20 right-5 z-40 flex h-[32rem] w-[min(92vw,24rem)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-pitch-900/80 shadow-glass backdrop-blur-2xl animate-slideUp">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <div className="flex items-center gap-2 font-semibold">
                <span aria-hidden>✨</span> BetSmart AI
              </div>
              <div className="text-[11px] text-slate-500">Informational only — never places bets</div>
            </div>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white" aria-label="Close">
              ✕
            </button>
          </div>

          {/* Session limit */}
          <div className="border-b border-white/10 px-4 py-2 text-xs">
            {limit ? (
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400">
                  Session limit: <span className="font-semibold text-gold-soft">{limit} pts</span>{" "}
                  <span className="text-slate-600">· a personal guardrail, just for fun</span>
                </span>
                <button
                  className="text-slate-500 hover:text-down"
                  onClick={() => {
                    sessionStorage.removeItem("betsmart_limit");
                    setLimit(null);
                  }}
                >
                  clear
                </button>
              </div>
            ) : (
              <form onSubmit={saveLimit} className="flex items-center gap-2">
                <span className="text-slate-500">Set an optional session points limit:</span>
                <input
                  className="input w-20 px-2 py-1 text-xs"
                  inputMode="numeric"
                  placeholder="500"
                  value={limitInput}
                  onChange={(e) => setLimitInput(e.target.value.replace(/[^\d]/g, ""))}
                />
                <button className="btn-secondary px-2 py-1 text-xs">Set</button>
              </form>
            )}
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm">
            <Bubble role="assistant" text={GREETING} />
            {history.length === 0 && (
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 hover:border-accent/40"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            {history.map((m, i) => (
              <Bubble key={i} role={m.role} text={m.content} />
            ))}
            {pending && <Bubble role="assistant" text="…" />}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="border-t border-white/10 p-3"
          >
            <div className="flex gap-2">
              <input
                className="input"
                placeholder="Ask about odds, returns, your bets…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={2000}
              />
              <button className="btn-primary px-4" disabled={pending || !input.trim()}>
                →
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function Bubble({ role, text }: { role: "user" | "assistant"; text: string }) {
  const mine = role === "user";
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 ${
          mine ? "bg-accent/15 text-slate-100" : "border border-white/10 bg-white/5 text-slate-200"
        }`}
      >
        {text}
      </div>
    </div>
  );
}
