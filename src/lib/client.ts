// Tiny client-side fetch wrapper for calling our JSON API routes.

export type ApiResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function apiPost<T = unknown>(url: string, body?: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: (json as { error?: string }).error ?? `Request failed (${res.status})` };
    }
    return { ok: true, data: json as T };
  } catch {
    return { ok: false, error: "Network error — please try again" };
  }
}

export async function apiPatch<T = unknown>(url: string, body?: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: (json as { error?: string }).error ?? `Request failed (${res.status})` };
    }
    return { ok: true, data: json as T };
  } catch {
    return { ok: false, error: "Network error — please try again" };
  }
}
