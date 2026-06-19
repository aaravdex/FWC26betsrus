import { announceSchema } from "@/lib/validation";
import { notifyAnnouncement } from "@/lib/notifications";
import { requireApiAdmin, readJson, json } from "@/lib/api";
import { errorResponse } from "@/lib/errors";

// Send an announcement to every player's notification centre (in-app only).
export async function POST(req: Request) {
  try {
    await requireApiAdmin();
    const { title, body } = announceSchema.parse(await readJson(req));
    const recipients = await notifyAnnouncement(title, body);
    return json({ ok: true, recipients });
  } catch (err) {
    return errorResponse(err);
  }
}
