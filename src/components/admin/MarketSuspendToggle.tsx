"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPatch } from "@/lib/client";

// Suspend / resume betting on a market (only meaningful while OPEN or SUSPENDED).
export function MarketSuspendToggle({ marketId, status }: { marketId: string; status: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status !== "OPEN" && status !== "SUSPENDED") return null;
  const next = status === "OPEN" ? "SUSPENDED" : "OPEN";

  async function toggle() {
    setError(null);
    setPending(true);
    const res = await apiPatch(`/api/admin/markets/${marketId}/status`, { status: next });
    setPending(false);
    if (res.ok) router.refresh();
    else setError(res.error);
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className={next === "SUSPENDED" ? "btn-secondary px-2.5 py-1 text-xs" : "btn-primary px-2.5 py-1 text-xs"}
      >
        {pending ? "…" : next === "SUSPENDED" ? "Suspend betting" : "Resume betting"}
      </button>
      {error && <span className="text-xs text-down">{error}</span>}
    </span>
  );
}
