// Cosmetic risk label derived OPENLY from the decimal odds. This is not a
// forecast or prediction — it's a transparent restatement of the odds the admin
// set: shorter odds (bigger implied chance) = Low, longer odds = High.
// Client-safe (no server imports).

export type RiskLevel = "Low" | "Medium" | "High";

export type RiskInfo = {
  level: RiskLevel;
  impliedPct: number; // 100 / odds, rounded
  className: string; // matching the .risk-* component classes
  explanation: string;
};

export function riskFromOdds(odds: number): RiskInfo {
  const impliedPct = Math.round((100 / odds) * 10) / 10;
  let level: RiskLevel;
  if (odds <= 2) level = "Low";
  else if (odds <= 5) level = "Medium";
  else level = "High";

  const className =
    level === "Low" ? "risk-low" : level === "Medium" ? "risk-medium" : "risk-high";

  return {
    level,
    impliedPct,
    className,
    explanation: `Cosmetic label from the odds (${odds.toFixed(
      2,
    )} ≈ ${impliedPct}% implied). Not a prediction.`,
  };
}
