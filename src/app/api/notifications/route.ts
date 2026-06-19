import { prisma } from "@/lib/prisma";
import { requireApiUser, readJson, json } from "@/lib/api";
import { errorResponse } from "@/lib/errors";
import { generateKickoffSoon } from "@/lib/notifications";

// In-app notification centre. The bell polls GET; POST marks items read.
// No email / push — everything lives in the Notification table.

export async function GET() {
  try {
    const user = await requireApiUser();
    // Lazily materialise "betting closes soon" alerts for this user's open bets.
    await generateKickoffSoon(user.id);

    const [items, unread] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.notification.count({ where: { userId: user.id, readAt: null } }),
    ]);
    return json({ ok: true, unread, items });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireApiUser();
    const body = (await readJson(req)) as { ids?: string[]; all?: boolean };

    if (body.all) {
      await prisma.notification.updateMany({
        where: { userId: user.id, readAt: null },
        data: { readAt: new Date() },
      });
    } else if (Array.isArray(body.ids) && body.ids.length > 0) {
      await prisma.notification.updateMany({
        where: { userId: user.id, id: { in: body.ids } },
        data: { readAt: new Date() },
      });
    }

    const unread = await prisma.notification.count({
      where: { userId: user.id, readAt: null },
    });
    return json({ ok: true, unread });
  } catch (err) {
    return errorResponse(err);
  }
}
