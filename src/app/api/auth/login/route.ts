import { NextResponse } from "next/server";
import { loginSchema } from "@/lib/validation";
import { verifyCredentials } from "@/lib/auth";
import { createSession } from "@/lib/session";
import { readJson } from "@/lib/api";
import { errorResponse } from "@/lib/errors";

// Username + password login. Works from any device, any time.
export async function POST(req: Request) {
  try {
    const { username, password } = loginSchema.parse(await readJson(req));
    const user = await verifyCredentials({ username, password });
    await createSession(user.id);
    return NextResponse.json({
      ok: true,
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
