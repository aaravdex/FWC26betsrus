"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiDelete } from "@/lib/client";

export function DeleteChatButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function remove() {
    setPending(true);
    const res = await apiDelete(`/api/admin/chat/${id}`);
    setPending(false);
    if (res.ok) router.refresh();
  }

  return (
    <button onClick={remove} disabled={pending} className="btn-danger px-2 py-1 text-xs">
      {pending ? "…" : "Delete"}
    </button>
  );
}
