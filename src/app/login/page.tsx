import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { LoginForm } from "@/components/auth/LoginForm";
import { startingBalance } from "@/lib/env";
import { formatPoints } from "@/lib/money";

const features = [
  {
    icon: "🎯",
    title: "Predict Matches",
    body: "Call the winner of every World Cup 2026 fixture, plus the tournament winner, top scorer and who makes the Round of 16.",
  },
  {
    icon: "🪙",
    title: "Earn Points",
    body: "Every account starts with free points. Back your calls, and winning predictions pay out at locked-in odds.",
  },
  {
    icon: "🏆",
    title: "Leaderboard",
    body: "Watch your points grow (or not) and climb a single shared leaderboard against everyone else playing.",
  },
];

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/matches");

  const start = startingBalance();
  const steps = [
    "Create your account",
    `Get ${formatPoints(start)} starting points`,
    "Predict matches",
    "Win or lose points",
    "Track your rank",
  ];

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-accent/[0.12] via-pitch-900/40 to-transparent px-6 py-12 text-center shadow-glow">
        <span className="badge mx-auto mb-4 w-fit border border-gold/30 bg-gold/10 text-gold-soft">
          ⚽ FIFA World Cup 2026
        </span>
        <h1 className="mx-auto max-w-2xl text-balance text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          Predict the FIFA World Cup 2026.
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-lg text-slate-300">
          Climb the leaderboard. Play with points.
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
          A play-money prediction game — no real money is ever involved.
        </p>
      </section>

      {/* Login box */}
      <section className="mx-auto max-w-md">
        <div className="card p-6">
          <h2 className="text-2xl font-bold">Sign in</h2>
          <p className="mt-1 mb-6 text-sm text-slate-400">
            Log in with your username and password to keep playing.
          </p>
          <LoginForm />
        </div>
        <p className="mt-4 text-center text-sm text-slate-400">
          New here?{" "}
          <Link href="/signup" className="text-accent hover:underline">
            Create an account
          </Link>
        </p>
      </section>

      {/* Feature cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="card p-5">
            <div className="text-3xl">{f.icon}</div>
            <h3 className="mt-3 text-lg font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-slate-400">{f.body}</p>
          </div>
        ))}
      </section>

      {/* How it works */}
      <section>
        <h2 className="text-center text-xl font-bold tracking-tight">How it works</h2>
        <ol className="mt-5 grid gap-3 sm:grid-cols-5">
          {steps.map((step, i) => (
            <li
              key={step}
              className="card flex flex-col items-center gap-2 p-4 text-center"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-accent to-accent-deep text-sm font-bold text-white shadow-glow">
                {i + 1}
              </span>
              <span className="text-sm text-slate-300">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <p className="text-center text-xs text-slate-500">
        Read the{" "}
        <Link href="/rules" className="text-accent-soft hover:underline">
          Rules &amp; Fair Play
        </Link>{" "}
        — points only, no cash value.
      </p>
    </div>
  );
}
