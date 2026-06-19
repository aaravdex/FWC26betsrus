import { postponeMatchSchema } from "@/lib/validation";
import { postponeMatch } from "@/lib/markets";
import { requireApiAdmin, readJson, json } from "@/lib/api";
import { errorResponse } from "@/lib/errors";
import { notifyMatchUpdate } from "@/lib/notifications";

// Postpone a match (betting stays closed) or reschedule it to a new kickoff
// (betting reopens). Open bets are kept either way.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiAdmin();
    const { id } = await params;
    const { kickoff } = postponeMatchSchema.parse(await readJson(req));

    const result = await postponeMatch({ matchId: id, kickoff });
    await notifyMatchUpdate(
      id,
      result.rescheduled ? "Match rescheduled" : "Match postponed",
      result.rescheduled
        ? "A match you bet on has a new kickoff time — betting is open again."
        : "A match you bet on has been postponed. Your stake stays in place until it's rescheduled.",
    );
    return json({ ok: true, ...result });
  } catch (err) {
    return errorResponse(err);
  }
}
