import { z } from "zod";

// Shared field schemas -------------------------------------------------------

// Username is the public display name AND login handle.
export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(24, "Username must be 24 characters or fewer")
  .regex(
    /^[a-zA-Z0-9_.-]+$/,
    "Use only letters, numbers, and _ . -",
  );

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password is too long");

// Decimal payout: 1.01 .. 50000.00, at most 2 decimal places. (Supplied odds
// reach 50000.00 for the longest shots.)
export const oddsSchema = z.coerce
  .number({ invalid_type_error: "Odds must be a number" })
  .gte(1.01, "Odds must be at least 1.01")
  .lte(50000, "Odds must be 50000.00 or less")
  .refine((n) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-6, {
    message: "Odds can have at most 2 decimal places",
  });

// Stake: a positive whole number of points. The real upper bound is the
// player's balance (enforced server-side); this just rejects nonsense.
export const stakeSchema = z.coerce
  .number({ invalid_type_error: "Stake must be a number" })
  .int("Stake must be a whole number of points")
  .positive("Stake must be greater than zero")
  .max(Number.MAX_SAFE_INTEGER, "Stake is implausibly large");

export const teamCodeSchema = z
  .string()
  .trim()
  .min(2)
  .max(5)
  .transform((s) => s.toUpperCase());

// Auth -----------------------------------------------------------------------

export const registerSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Enter your username"),
  password: z.string().min(1, "Enter your password"),
});

// Bets -----------------------------------------------------------------------

export const placeBetSchema = z.object({
  outcomeId: z.string().min(1, "Pick an outcome"),
  stake: stakeSchema,
});

// Chat -----------------------------------------------------------------------

export const CHAT_MAX_LEN = 500;

export const chatMessageSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Type a message")
    .max(CHAT_MAX_LEN, `Keep it under ${CHAT_MAX_LEN} characters`),
});

// Live Match Center ----------------------------------------------------------

export const updateLiveSchema = z.object({
  liveStatus: z.enum(["SCHEDULED", "LIVE", "HALFTIME", "FULLTIME"]).optional(),
  minute: z.coerce.number().int().min(0).max(130).nullable().optional(),
  homeScore: z.coerce.number().int().min(0).max(99).nullable().optional(),
  awayScore: z.coerce.number().int().min(0).max(99).nullable().optional(),
});

export const addMatchEventSchema = z.object({
  type: z.enum([
    "KICKOFF",
    "GOAL",
    "OWN_GOAL",
    "PENALTY_SCORED",
    "PENALTY_MISSED",
    "YELLOW_CARD",
    "RED_CARD",
    "SUBSTITUTION",
    "INJURY",
    "VAR",
    "HALFTIME",
    "FULLTIME",
    "NOTE",
  ]),
  minute: z.coerce.number().int().min(0).max(130).nullable().optional(),
  teamId: z.string().min(1).nullable().optional(),
  description: z.string().trim().max(200).optional(),
});

export const marketStatusSchema = z.object({
  status: z.enum(["OPEN", "SUSPENDED"]),
});

// BetSmart AI ----------------------------------------------------------------

export const assistantSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(2000),
      }),
    )
    .min(1)
    .max(30),
  matchId: z.string().min(1).nullable().optional(),
});

// Admin: accounts ------------------------------------------------------------

export const updateRoleSchema = z.object({
  role: z.enum(["PLAYER", "ADMIN"]),
});

export const resetPasswordSchema = z.object({
  password: passwordSchema,
});

// Admin: teams / players -----------------------------------------------------

export const createTeamSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  code: teamCodeSchema,
  group: z.string().trim().max(4).optional(),
});

export const createPlayerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  teamId: z.string().min(1).optional(),
  position: z.string().trim().max(40).optional(),
});

// Admin: matches -------------------------------------------------------------

export const createMatchSchema = z
  .object({
    homeTeamId: z.string().min(1, "Pick Team A"),
    awayTeamId: z.string().min(1, "Pick Team B"),
    kickoff: z.coerce.date({ invalid_type_error: "Enter a valid kickoff date/time" }),
    homeOdds: oddsSchema.optional(),
    drawOdds: oddsSchema.optional(),
    awayOdds: oddsSchema.optional(),
  })
  .refine((d) => d.homeTeamId !== d.awayTeamId, {
    message: "Team A and Team B must be different",
    path: ["awayTeamId"],
  });

// Edit an existing match: kickoff and/or status. (Admin fills in real kickoffs.)
export const updateMatchSchema = z.object({
  kickoff: z.coerce.date({ invalid_type_error: "Enter a valid kickoff date/time" }).optional(),
  status: z.enum(["SCHEDULED", "LOCKED"]).optional(),
});

export const settleMatchSchema = z.object({
  homeScore: z.coerce.number().int().min(0).max(99),
  awayScore: z.coerce.number().int().min(0).max(99),
});

// Admin: odds editing (one or many outcomes at once) -------------------------

export const updateOddsSchema = z.object({
  odds: z
    .array(
      z.object({
        outcomeId: z.string().min(1),
        odds: oddsSchema,
      }),
    )
    .min(1),
});

// Admin: tournament-level markets (winner / top scorer) ----------------------

export const addTournamentOutcomeSchema = z.object({
  teamId: z.string().min(1),
  odds: oddsSchema,
});

export const addTopScorerOutcomeSchema = z.object({
  playerId: z.string().min(1),
  odds: oddsSchema,
});

export const settleMarketSchema = z.object({
  winningOutcomeId: z.string().min(1, "Pick the winning outcome"),
});

// Round of 16: which teams (outcomes) qualified — everything else loses.
export const settleQualificationSchema = z.object({
  qualifiedOutcomeIds: z.array(z.string().min(1)).default([]),
});

// Set a market's lock datetime (used for the Round of 16 group-stage lock).
export const updateMarketLockSchema = z.object({
  locksAt: z.coerce.date({ invalid_type_error: "Enter a valid date/time" }),
});

export const updateTournamentSettingsSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  startsAt: z.coerce.date(),
  startingBalance: z.coerce.number().int().min(0).max(1_000_000_000).optional(),
});

// Admin: match lifecycle (cancel / postpone) --------------------------------

export const cancelMatchSchema = z.object({
  reason: z.string().trim().max(200).optional(),
});

// Postpone: optionally reschedule to a new kickoff; otherwise just mark it.
export const postponeMatchSchema = z.object({
  kickoff: z.coerce.date({ invalid_type_error: "Enter a valid date/time" }).optional(),
  reason: z.string().trim().max(200).optional(),
});

// Admin: ban / disable a player (data is preserved) --------------------------

export const banUserSchema = z.object({
  banned: z.boolean(),
});

// Admin: broadcast announcement to the notification centre -------------------

export const announceSchema = z.object({
  title: z.string().trim().min(1, "Add a title").max(120),
  body: z.string().trim().min(1, "Add a message").max(500),
});

// Admin: manual ledger adjustment -------------------------------------------

export const adjustBalanceSchema = z.object({
  userId: z.string().min(1),
  amount: z.coerce
    .number()
    .int()
    .refine((n) => n !== 0, "Amount can't be zero")
    .refine((n) => Math.abs(n) <= Number.MAX_SAFE_INTEGER, "Amount is too large"),
  description: z.string().trim().min(1, "Add a reason").max(200),
});
