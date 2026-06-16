import { NextResponse } from "next/server";
import type { User } from "@prisma/client";
import { getCurrentUser } from "@/lib/session";
import { HttpError } from "@/lib/errors";

/**
 * JSON response that tolerates bigint values (points are bigint). Standard
 * NextResponse.json() throws on bigint; here we stringify them so the client
 * receives numeric strings.
 */
export function json(data: unknown, init?: ResponseInit): NextResponse {
  const body = JSON.stringify(data, (_key, value) =>
    typeof value === "bigint" ? value.toString() : value,
  );
  return new NextResponse(body, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
}

/** Require an authenticated user in a Route Handler (throws HttpError 401). */
export async function requireApiUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "You must be signed in");
  return user;
}

/** Require an admin in a Route Handler (throws HttpError 401/403). */
export async function requireApiAdmin(): Promise<User> {
  const user = await requireApiUser();
  if (user.role !== "ADMIN") throw new HttpError(403, "Admins only");
  return user;
}

/** Parse a JSON request body, tolerating empty bodies. */
export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return {};
  }
}
