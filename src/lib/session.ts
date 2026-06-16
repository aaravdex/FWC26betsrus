import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { randomToken } from "@/lib/crypto";
import { isProduction } from "@/lib/env";

const SESSION_COOKIE = "wc_session";
const SESSION_TTL_DAYS = 30;

/** Create a DB-backed session and set the httpOnly cookie. Call from a Route Handler. */
export async function createSession(userId: string): Promise<void> {
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({ data: { token, userId, expiresAt } });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction(),
    path: "/",
    expires: expiresAt,
  });
}

/** Delete the current session (DB row + cookie). Call from a Route Handler. */
export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }
  jar.delete(SESSION_COOKIE);
}

/** Resolve the logged-in user from the session cookie, or null. */
export async function getCurrentUser(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }
  return session.user;
}

/** For pages: ensure a logged-in user or redirect to /login. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** For pages: ensure an admin or redirect. */
export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== ("ADMIN" satisfies Role)) redirect("/");
  return user;
}
