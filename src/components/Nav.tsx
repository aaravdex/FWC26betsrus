import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { formatPoints } from "@/lib/money";
import { LogoutButton } from "@/components/LogoutButton";

const links = [
  { href: "/matches", label: "Fixtures" },
  { href: "/live", label: "Live" },
  { href: "/tournament", label: "Winner" },
  { href: "/top-scorer", label: "Top Scorer" },
  { href: "/leaderboard", label: "Leaderboard" },
];

export async function Nav() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-pitch-950/70 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-deep text-sm shadow-glow">
            ⚽
          </span>
          <span className="text-[15px]">
            FWC<span className="text-gold-soft">26</span>
            <span className="ml-2 hidden text-xs font-normal text-slate-500 sm:inline">
              Predictions
            </span>
          </span>
        </Link>

        {user && (
          <div className="flex flex-wrap items-center gap-x-1 text-sm text-slate-300">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-lg px-2.5 py-1.5 transition hover:bg-white/5 hover:text-white"
              >
                {l.label}
              </Link>
            ))}
            <Link href="/me" className="rounded-lg px-2.5 py-1.5 transition hover:bg-white/5 hover:text-white">
              My Bets
            </Link>
            {user.role === "ADMIN" && (
              <Link
                href="/admin"
                className="rounded-lg px-2.5 py-1.5 font-semibold text-accent-soft transition hover:bg-accent/10"
              >
                Admin
              </Link>
            )}
          </div>
        )}

        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              <Link
                href={`/players/${user.id}`}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 transition hover:border-gold/30"
              >
                <span className="text-sm font-medium leading-none">{user.username}</span>
                <span className="font-mono text-xs font-semibold text-gold-soft">
                  {formatPoints(user.balance)}
                </span>
              </Link>
              <LogoutButton />
            </>
          ) : (
            <Link href="/login" className="btn-primary px-3 py-1.5 text-xs">
              Sign in
            </Link>
          )}
        </div>
      </nav>
      <div className="border-t border-white/5 bg-accent/[0.04] py-1 text-center text-[11px] text-slate-400">
        Points only — no real money · all balances are fictional “points” · for fun among friends
      </div>
    </header>
  );
}
