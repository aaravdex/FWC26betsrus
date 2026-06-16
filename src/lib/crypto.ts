import { randomBytes } from "node:crypto";

// Opaque, URL-safe random token used for session cookies.
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}
