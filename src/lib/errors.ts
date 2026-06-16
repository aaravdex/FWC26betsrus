import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { InsufficientFundsError } from "@/lib/ledger";

/** Error carrying an HTTP status, thrown by service functions. */
export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "HttpError";
  }
}

/** Convert any thrown error into a JSON response for API routes. */
export function errorResponse(err: unknown): NextResponse {
  if (err instanceof ZodError) {
    const first = err.errors[0];
    return NextResponse.json(
      { error: first?.message ?? "Invalid input", issues: err.flatten() },
      { status: 400 },
    );
  }
  if (err instanceof HttpError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  if (err instanceof InsufficientFundsError) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
  // Unknown / unexpected
  // eslint-disable-next-line no-console
  console.error("Unhandled API error:", err);
  return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
}
