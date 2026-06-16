"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPatch } from "@/lib/client";

// Promote a player to admin or demote back. Disabled for your own account to
// avoid locking yourself out.
export function UserRoleControls({
  userId,
  role,
  isSelf,
}: {
  userId: string;
  role: "ADMIN" | "PLAYER";
  isSelf: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isSelf) {
    return <span className="text-xs text-slate-500">(you)</span>;
  }

  const nextRole = role === "ADMIN" ? "PLAYER" : "ADMIN";

  async function toggle() {
    setError(null);
    setPending(true);
    const res = await apiPatch(`/api/admin/users/${userId}/role`, { role: nextRole });
    setPending(false);
    if (res.ok) {
      router.refresh();
    } else {
      setError(res.error);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button className="btn-secondary px-2 py-1 text-xs" onClick={toggle} disabled={pending}>
        {pending ? "…" : nextRole === "ADMIN" ? "Make admin" : "Make player"}
      </button>
      {error && <span className="text-xs text-red-300">{error}</span>}
    </span>
  );
}
