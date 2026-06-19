import type { PlayerStats } from "@/lib/playerStats";

// Achievements unlocked purely from genuine recorded activity. No decorative
// badges — each maps to something the player actually did.

export type BadgeDef = { id: string; name: string; icon: string; description: string };

export const RISK_TAKER_THRESHOLD = 500n;
export const GROUP_EXPERT_TARGET = 5;

export const BADGES: BadgeDef[] = [
  { id: "first_prediction", name: "First Prediction", icon: "🎯", description: "Placed your first prediction." },
  { id: "hat_trick", name: "Hat-trick", icon: "🎩", description: "Three correct predictions in a row." },
  {
    id: "risk_taker",
    name: "Risk Taker",
    icon: "🎲",
    description: `Staked ${RISK_TAKER_THRESHOLD}+ points on a single pick.`,
  },
  {
    id: "group_stage_expert",
    name: "Group Stage Expert",
    icon: "🧠",
    description: `${GROUP_EXPERT_TARGET} correct match predictions.`,
  },
];

export type BadgeState = BadgeDef & { earned: boolean; progress: string | null };

export function computeBadges(stats: PlayerStats): BadgeState[] {
  return BADGES.map((b) => {
    let earned = false;
    let progress: string | null = null;
    switch (b.id) {
      case "first_prediction":
        earned = stats.totalBets >= 1;
        break;
      case "hat_trick":
        earned = stats.bestWinStreak >= 3;
        progress = `${Math.min(stats.bestWinStreak, 3)}/3`;
        break;
      case "risk_taker":
        earned = stats.maxStake >= RISK_TAKER_THRESHOLD;
        break;
      case "group_stage_expert":
        earned = stats.correctMatchBets >= GROUP_EXPERT_TARGET;
        progress = `${Math.min(stats.correctMatchBets, GROUP_EXPERT_TARGET)}/${GROUP_EXPERT_TARGET}`;
        break;
    }
    return { ...b, earned, progress };
  });
}
