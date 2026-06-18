import { NextResponse } from "next/server";
import { getLiveMatch } from "@/lib/live";
import { requireApiUser } from "@/lib/api";
import { errorResponse, HttpError } from "@/lib/errors";

// Poll endpoint for the Live Match Center (scores, status, timeline, odds).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiUser();
    const { id } = await params;
    const view = await getLiveMatch(id);
    if (!view) throw new HttpError(404, "Match not found");
    return NextResponse.json(view);
  } catch (err) {
    return errorResponse(err);
  }
}
