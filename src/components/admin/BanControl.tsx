"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/client";

// Disable (ban) or re-enable a player account. Banning blocks login and clears
// their sessions; their data is preserved. Admins and your own row are exempt.
export function BanControl({
  userId,
  banned,
  isSelf,
  isAdmin,
}: {
  userId: string;
  banned: boolean;
  isSelf: boolean;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isSelf || isAdmin) return <span className="text-xs text-slate-600">—</span>;

  async function toggle() {
    setError(null);
    setPending(true);
    const res = await apiPost(`/api/admin/users/${userId}/ban`, { banned: !banned });
    setPending(false);
    if (res.ok) router.refresh();
    else setError(res.error);
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        className={
          banned
            ? "btn-secondary px-2 py-1 text-xs"
            : "rounded-lg border border-down/30 bg-down/10 px-2 py-1 text-xs text-down transition hover:bg-down/20"
        }
        onClick={toggle}
        disabled={pending}
      >
        {pending ? "…" : banned ? "Enable" : "Disable"}
      </button>
      {error && <span className="text-xs text-red-300">{error}</span>}
    </span>
  );
}
