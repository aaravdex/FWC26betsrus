import bcrypt from "bcryptjs";

// Password hashing. We use bcrypt (via the pure-JS `bcryptjs`, so there's no
// native build step) — an accepted alternative to argon2id. Plaintext passwords
// are never stored or logged.

const COST = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST);
}

/** Synchronous variant for the seed script. */
export function hashPasswordSync(plain: string): string {
  return bcrypt.hashSync(plain, COST);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}
