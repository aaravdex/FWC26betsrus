import { NextResponse } from "next/server";
import { assistantSchema } from "@/lib/validation";
import { buildContext, askBetSmart, hasApiKey } from "@/lib/assistant";
import { requireApiUser, readJson } from "@/lib/api";
import { errorResponse } from "@/lib/errors";

// BetSmart AI — informational assistant. Runs the Anthropic call SERVER-SIDE so
// the API key is never exposed to the browser. Never places bets.
export async function POST(req: Request) {
  try {
    const user = await requireApiUser();
    const { messages, matchId } = assistantSchema.parse(await readJson(req));

    if (!hasApiKey()) {
      return NextResponse.json({
        reply:
          "BetSmart AI isn’t switched on yet — an admin needs to add an ANTHROPIC_API_KEY. " +
          "Once it’s set I can explain odds, markets and your bets. The bet button works normally in the meantime.",
        configured: false,
      });
    }

    const context = await buildContext({ userId: user.id, matchId: matchId ?? null });
    const reply = await askBetSmart(messages, context);
    return NextResponse.json({ reply, configured: true });
  } catch (err) {
    // Surface a friendly message for upstream (Anthropic) errors too.
    if (err && typeof err === "object" && "status" in err && (err as { status?: number }).status) {
      return NextResponse.json(
        { error: "BetSmart AI is unavailable right now — please try again in a moment." },
        { status: 502 },
      );
    }
    return errorResponse(err);
  }
}
