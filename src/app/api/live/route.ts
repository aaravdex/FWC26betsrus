import { NextResponse } from "next/server";
import { getLiveSummaries } from "@/lib/live";
import { requireApiUser } from "@/lib/api";
import { errorResponse } from "@/lib/errors";

// Poll endpoint for the Live Match Center hub (compact list of all matches).
export async function GET() {
  try {
    const user = await requireApiUser();
    const summaries = await getLiveSummaries(user.id);
    return NextResponse.json({ matches: summaries });
  } catch (err) {
    return errorResponse(err);
  }
}
