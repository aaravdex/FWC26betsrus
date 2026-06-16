import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { formatPoints } from "@/lib/points";
import { formatKickoff } from "@/lib/format";
import { UserRoleControls } from "@/components/admin/UserRoleControls";
import { PasswordResetControl } from "@/components/admin/PasswordResetControl";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const me = await getCurrentUser();
  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { username: "asc" }],
    include: { _count: { select: { bets: true } } },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Accounts</h1>
        <p className="text-sm text-slate-400">
          Signup is open to anyone. New accounts are players — promote trusted users to admin here.
          There is no email, so password resets are admin-only (resetting also signs the user out
          everywhere).
        </p>
      </header>

      <div className="card overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="table-cell font-medium">Username</th>
              <th className="table-cell font-medium">Joined</th>
              <th className="table-cell font-medium text-right">Bets</th>
              <th className="table-cell font-medium text-right">Balance</th>
              <th className="table-cell font-medium">Role</th>
              <th className="table-cell font-medium">Password</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-white/5 last:border-0">
                <td className="table-cell">
                  <Link href={`/players/${u.id}`} className="hover:text-accent">
                    {u.username}
                  </Link>
                </td>
                <td className="table-cell whitespace-nowrap text-slate-400">
                  {formatKickoff(u.createdAt)}
                </td>
                <td className="table-cell text-right font-mono text-slate-400">{u._count.bets}</td>
                <td className="table-cell text-right font-mono">{formatPoints(u.balance)}</td>
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    <span
                      className={`badge ${
                        u.role === "ADMIN" ? "bg-accent/15 text-accent" : "bg-white/5 text-slate-300"
                      }`}
                    >
                      {u.role}
                    </span>
                    <UserRoleControls userId={u.id} role={u.role} isSelf={u.id === me?.id} />
                  </div>
                </td>
                <td className="table-cell">
                  <PasswordResetControl userId={u.id} username={u.username} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
