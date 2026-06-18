// Client-safe helper: maps the viewer's own bet outcome on a match to a
// theme-appropriate green/red card treatment (coloured border + soft glow +
// faint tint — not a harsh fill). Neutral when there's no settled result.

export type MatchResult = "won" | "lost" | null;

export function resultCardClass(result: MatchResult | undefined): string {
  if (result === "won") {
    return "border-up/50 bg-up/[0.06] shadow-[0_0_28px_-10px_rgba(34,197,94,0.6)]";
  }
  if (result === "lost") {
    return "border-down/50 bg-down/[0.06] shadow-[0_0_28px_-10px_rgba(239,68,68,0.55)]";
  }
  return "";
}
