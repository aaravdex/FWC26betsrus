import { NextResponse } from "next/server";
import { destroySession } from "@/lib/session";
import { errorResponse } from "@/lib/errors";

export async function POST() {
  try {
    await destroySession();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
