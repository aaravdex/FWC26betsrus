import { NextResponse } from "next/server";
import { registerSchema } from "@/lib/validation";
import { registerUser } from "@/lib/auth";
import { createSession } from "@/lib/session";
import { readJson } from "@/lib/api";
import { errorResponse } from "@/lib/errors";

// Open signup: create a username/password account and sign in immediately.
export async function POST(req: Request) {
  try {
    const { username, password } = registerSchema.parse(await readJson(req));
    const user = await registerUser({ username, password });
    await createSession(user.id);
    return NextResponse.json({
      ok: true,
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
