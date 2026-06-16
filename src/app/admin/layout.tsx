import Link from "next/link";
import { requireAdmin } from "@/lib/session";

const adminLinks = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/matches", label: "Matches" },
  { href: "/admin/tournament", label: "Winner" },
  { href: "/admin/top-scorer", label: "Top scorer" },
  { href: "/admin/teams", label: "Teams & players" },
  { href: "/admin/users", label: "Accounts" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Single guard for every /admin/* route.
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-accent">Admin</span>
        <span className="text-slate-600">·</span>
        {adminLinks.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-md px-2 py-1 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
          >
            {l.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
