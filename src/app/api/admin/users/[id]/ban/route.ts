import { prisma } from "@/lib/prisma";
import { banUserSchema } from "@/lib/validation";
import { setUserBanned } from "@/lib/auth";
import { requireApiAdmin, readJson, json } from "@/lib/api";
import { errorResponse, HttpError } from "@/lib/errors";

// Ban (disable) or un-ban a player. Banning blocks login and force-logs-out
// existing sessions; all of the account's data is preserved.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireApiAdmin();
    const { id } = await params;
    const { banned } = banUserSchema.parse(await readJson(req));

    if (id === admin.id) throw new HttpError(400, "You can't disable your own account");
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) throw new HttpError(404, "User not found");
    if (target.role === "ADMIN") throw new HttpError(400, "Admin accounts can't be disabled");

    await setUserBanned(id, banned);
    return json({ ok: true, banned });
  } catch (err) {
    return errorResponse(err);
  }
}
