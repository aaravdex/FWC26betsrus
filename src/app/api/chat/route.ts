import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { chatMessageSchema } from "@/lib/validation";
import { sanitizeMessage, CHAT_RATE_WINDOW_MS, CHAT_RATE_MAX } from "@/lib/chat";
import { requireApiUser, readJson } from "@/lib/api";
import { errorResponse, HttpError } from "@/lib/errors";

type Row = {
  id: string;
  body: string;
  deletedAt: Date | null;
  createdAt: Date;
  user: { username: string; role: string };
};

function toView(m: Row) {
  return {
    id: m.id,
    username: m.user.username,
    role: m.user.role,
    body: m.deletedAt ? null : m.body,
    deleted: m.deletedAt != null,
    createdAt: m.createdAt.toISOString(),
  };
}

// Poll the leaderboard chat. Pass ?after=<ISO> to get only newer messages.
export async function GET(req: Request) {
  try {
    await requireApiUser();
    const after = new URL(req.url).searchParams.get("after");
    const include = { user: { select: { username: true, role: true } } } as const;

    let rows: Row[];
    if (after) {
      rows = await prisma.chatMessage.findMany({
        where: { createdAt: { gt: new Date(after) } },
        orderBy: { createdAt: "asc" },
        take: 100,
        include,
      });
    } else {
      const recent = await prisma.chatMessage.findMany({
        orderBy: { createdAt: "desc" },
        take: 80,
        include,
      });
      rows = recent.reverse();
    }
    return NextResponse.json({ messages: rows.map(toView) });
  } catch (err) {
    return errorResponse(err);
  }
}

// Post a message. Sanitised, length-limited, and rate-limited per user.
export async function POST(req: Request) {
  try {
    const user = await requireApiUser();
    const { body } = chatMessageSchema.parse(await readJson(req));
    const clean = sanitizeMessage(body);
    if (clean.length === 0) {
      throw new HttpError(400, "Type a message");
    }

    const recentCount = await prisma.chatMessage.count({
      where: { userId: user.id, createdAt: { gte: new Date(Date.now() - CHAT_RATE_WINDOW_MS) } },
    });
    if (recentCount >= CHAT_RATE_MAX) {
      throw new HttpError(429, "You're sending messages too fast — slow down a moment");
    }

    const msg = await prisma.chatMessage.create({
      data: { userId: user.id, body: clean },
      include: { user: { select: { username: true, role: true } } },
    });
    return NextResponse.json({ message: toView(msg) });
  } catch (err) {
    return errorResponse(err);
  }
}
