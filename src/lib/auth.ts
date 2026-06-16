import type { User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { applyLedgerEntry } from "@/lib/ledger";
import { hashPassword, verifyPassword } from "@/lib/password";
import { startingBalance } from "@/lib/env";
import { HttpError } from "@/lib/errors";

/** Look up a user by username, case-insensitively. */
function findByUsername(username: string) {
  return prisma.user.findFirst({
    where: { username: { equals: username, mode: "insensitive" } },
  });
}

/**
 * Open signup — create an account with a hashed password and grant the starting
 * points balance through the ledger. New accounts are always players; admins
 * are promoted via the database (role flag) afterwards.
 */
export async function registerUser(input: {
  username: string;
  password: string;
}): Promise<User> {
  const existing = await findByUsername(input.username);
  if (existing) {
    throw new HttpError(409, "That username is taken — pick another");
  }

  const passwordHash = await hashPassword(input.password);
  const grant = startingBalance();

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { username: input.username, passwordHash, role: "PLAYER", balance: 0n },
    });
    await applyLedgerEntry(tx, {
      userId: user.id,
      amount: grant,
      type: "INITIAL_GRANT",
      description: `Welcome grant of ${grant} points`,
    });
    return user;
  });
}

/** Verify a username + password. Throws 401 on any mismatch. */
export async function verifyCredentials(input: {
  username: string;
  password: string;
}): Promise<User> {
  const user = await findByUsername(input.username);
  // Always run a hash comparison to avoid leaking which usernames exist via
  // timing. (bcrypt compare against a dummy when the user is missing.)
  const hash = user?.passwordHash ?? "$2a$10$0000000000000000000000000000000000000000000000000000";
  const ok = await verifyPassword(input.password, hash);
  if (!user || !ok) {
    throw new HttpError(401, "Incorrect username or password");
  }
  return user;
}

/** Admin-only: set a new password for any account (no self-service reset). */
export async function setUserPassword(userId: string, newPassword: string): Promise<void> {
  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  // Invalidate existing sessions so a reset actually locks the old holder out.
  await prisma.session.deleteMany({ where: { userId } });
}
