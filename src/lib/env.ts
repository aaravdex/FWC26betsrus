// Small, typed accessors for environment configuration.

export function appUrl(): string {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/** Fixed starting balance granted to every new account, in points. */
export function startingBalance(): bigint {
  const raw = process.env.STARTING_BALANCE ?? "1000";
  const n = Number.parseInt(raw, 10);
  return BigInt(Number.isFinite(n) && n >= 0 ? n : 1000);
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}
