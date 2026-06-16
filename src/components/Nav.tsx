import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { formatPoints } from "@/lib/money";
import { LogoutButton } from "@/components/LogoutButton";

const links = [
  { href: "/matches", label: "Matches" },
  { href: "/tournament", label: "Winner" },
  { href: "/top-scorer", label: "Top Scorer" },
  { href: "/leaderboard", label: "Leaderboard" },
];

export async function Nav() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-pitch-950/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span aria-hidden className="text-lg">⚽️</span>
          <span>World Cup Predictions</span>
        </Link>

        {user && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-300">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-white">
                {l.label}
              </Link>
            ))}
            <Link href="/me" className="hover:text-white">
              My Bets
            </Link>
            {user.role === "ADMIN" && (
              <Link href="/admin" className="font-semibold text-accent hover:text-accent-soft">
                Admin
              </Link>
            )}
          </div>
        )}

        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              <Link href={`/players/${user.id}`} className="text-right leading-tight hover:opacity-80">
                <div className="text-sm font-medium">{user.username}</div>
                <div className="font-mono text-xs text-accent">{formatPoints(user.balance)}</div>
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
      <div className="bg-amber-500/10 py-1 text-center text-[11px] text-amber-200/90">
        Play-money only · all balances are fictional “points” · no real money is involved
      </div>
    </header>
  );
}
