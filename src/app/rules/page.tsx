import Link from "next/link";

export const metadata = {
  title: "Rules & Fair Play",
};

const rules: { icon: string; title: string; body: string }[] = [
  {
    icon: "🪙",
    title: "Points only — no real money",
    body: "Everything in this game is played with fictional “points”. There are no deposits, no withdrawals, and no payments of any kind. Points are not currency.",
  },
  {
    icon: "🚫",
    title: "Points have no cash value",
    body: "Points can never be exchanged for money, prizes, or anything of real-world value. They exist only to keep score within the game.",
  },
  {
    icon: "🎲",
    title: "No guaranteed outcomes",
    body: "Odds and predictions are for entertainment. Nothing here predicts or guarantees any real result — football is unpredictable, that's the fun.",
  },
  {
    icon: "🔒",
    title: "Predictions lock at kickoff",
    body: "Each match closes for new predictions at kickoff. Once a match starts you can no longer place or change a prediction on it.",
  },
  {
    icon: "⚖️",
    title: "Admin decisions are final",
    body: "Results are entered and settled by an admin. If a match is cancelled, open predictions are voided and points refunded. The admin's decision on settlement is final.",
  },
  {
    icon: "🤝",
    title: "Play fair",
    body: "One account per person, play in good spirit, and keep the chat friendly. Accounts used abusively may be disabled (your data is kept, not deleted).",
  },
];

export default function RulesPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Rules &amp; Fair Play</h1>
        <p className="mt-1 text-sm text-slate-400">
          This is a free, just-for-fun prediction game for the FIFA World Cup 2026. Here&apos;s the
          deal, in plain terms.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {rules.map((r) => (
          <div key={r.title} className="card p-5">
            <div className="text-2xl">{r.icon}</div>
            <h2 className="mt-2 text-base font-semibold text-slate-100">{r.title}</h2>
            <p className="mt-1 text-sm text-slate-400">{r.body}</p>
          </div>
        ))}
      </div>

      <div className="card border-gold/20 bg-gold/[0.04] p-5 text-center text-sm text-slate-300">
        In short: it&apos;s <span className="font-semibold text-gold-soft">points, not money</span> —
        predict, climb the leaderboard, and have fun.
      </div>

      <p className="text-center text-sm text-slate-400">
        <Link href="/login" className="text-accent hover:underline">
          ← Back to sign in
        </Link>
      </p>
    </div>
  );
}
