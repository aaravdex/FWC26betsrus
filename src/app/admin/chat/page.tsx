import { prisma } from "@/lib/prisma";
import { formatKickoff } from "@/lib/format";
import { DeleteChatButton } from "@/components/admin/DeleteChatButton";

export const dynamic = "force-dynamic";

export default async function AdminChatPage() {
  const messages = await prisma.chatMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: { select: { username: true } } },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Chat moderation</h1>
        <p className="text-sm text-slate-400">
          The 200 most recent leaderboard messages. Deleting hides the message for everyone (the row
          is kept for audit). You can also delete inline from the leaderboard chat.
        </p>
      </header>

      <div className="card divide-y divide-white/5">
        {messages.length === 0 && <p className="p-4 text-sm text-slate-500">No messages yet.</p>}
        {messages.map((m) => (
          <div key={m.id} className="flex items-start justify-between gap-3 p-3 text-sm">
            <div className="min-w-0">
              <span className="font-medium text-slate-200">{m.user.username}</span>
              <span className="ml-2 text-[11px] text-slate-600">{formatKickoff(m.createdAt)}</span>
              <div className="break-words text-slate-300">
                {m.deletedAt ? (
                  <span className="italic text-slate-600">[removed] {m.body}</span>
                ) : (
                  m.body
                )}
              </div>
            </div>
            {!m.deletedAt && <DeleteChatButton id={m.id} />}
          </div>
        ))}
      </div>
    </div>
  );
}
