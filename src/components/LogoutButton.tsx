"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiPost } from "@/lib/client";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <button
      className="btn-secondary px-3 py-1.5 text-xs"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await apiPost("/api/auth/logout");
        router.push("/login");
        router.refresh();
      }}
    >
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
