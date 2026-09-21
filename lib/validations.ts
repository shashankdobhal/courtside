import { z } from "zod";
import { TournamentType, TournamentFormat } from "@/types";
import { extractYoutubeVideoId } from "@/lib/youtube";

export const venueSchema = z
  .string()
  .trim()
  .max(120, "Must be 120 characters or fewer")
  .optional()
  .or(z.literal(""));

/**
 * Always a string at this boundary — a datetime-local input's raw value on
 * the way in, or that same value already converted to an absolute ISO
 * instant (see toIsoOrEmpty in utils/format.ts) by the time it reaches the
 * server action. Both shapes parse fine with Date.parse, so one schema
 * covers the field on both sides of that conversion.
 */
export const scheduledAtSchema = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine((v) => !v || !isNaN(Date.parse(v)), { message: "Enter a valid date and time" });

export const createTournamentSchema = z.object({
  name: z.string().trim().min(1, "Tournament name is required").max(80),
  format: z.enum([TournamentFormat.SINGLES, TournamentFormat.DOUBLES]),
  // SESSION (ad-hoc, no generated fixtures) is available for either format.
  type: z.enum([
    TournamentType.ROUND_ROBIN,
    TournamentType.ROUND_ROBIN_KNOCKOUT,
    TournamentType.KNOCKOUT,
    TournamentType.SESSION,
  ]),
  legs: z.number().int().min(1).max(3),
  venue: venueSchema,
  scheduledAt: scheduledAtSchema,
});
export type CreateTournamentInput = z.infer<typeof createTournamentSchema>;

export const createEventSchema = z.object({
  name: z.string().trim().min(1, "Event name is required").max(80),
});
export type CreateEventInput = z.infer<typeof createEventSchema>;

export const playerNameSchema = z.string().trim().min(1, "Name is required").max(40);

export const MIN_PLAYERS_ROUND_ROBIN = 2;
export const MIN_PLAYERS_KNOCKOUT = 4;
export const MAX_PLAYERS = 32;
// Minimum roster size to activate a casual session — enough people for one
// match: two individuals for singles, four (two per side) for doubles.
export const MIN_SESSION_PLAYERS_SINGLES = 2;
export const MIN_SESSION_PLAYERS_DOUBLES = 4;

/** One entry per bracket slot: a Player id, or null for an empty (bye) seat. */
export const knockoutBracketSlotsSchema = z.array(z.string().nullable()).min(MIN_PLAYERS_KNOCKOUT);

export const doublesTeamSchema = z.object({
  player1: z.object({ name: playerNameSchema, profileId: z.string().optional() }),
  player2: z.object({ name: playerNameSchema, profileId: z.string().optional() }),
});
export type DoublesTeamInput = z.infer<typeof doublesTeamSchema>;

/**
 * One side per array of roster Player ids — length 1 for a singles-session
 * match, 2 for a doubles-session match (a pair formed on the fly, not a
 * pre-registered team). Both sides must match in size and share no players.
 */
export const sessionMatchSchema = z
  .object({
    side1PlayerIds: z.array(z.string()).min(1).max(2),
    side2PlayerIds: z.array(z.string()).min(1).max(2),
  })
  .refine((data) => data.side1PlayerIds.length === data.side2PlayerIds.length, {
    message: "Both sides need the same number of players",
    path: ["side2PlayerIds"],
  })
  .refine(
    (data) => {
      const all = [...data.side1PlayerIds, ...data.side2PlayerIds];
      return new Set(all).size === all.length;
    },
    { message: "A player can only be on one side", path: ["side2PlayerIds"] }
  );
export type SessionMatchInput = z.infer<typeof sessionMatchSchema>;

/**
 * Validates a batch of new players being added to a tournament's roster,
 * against whoever's already on it — used by `addPlayers`, which can be
 * called repeatedly as the roster grows (organizer bulk-adds, self-joins),
 * so there's no whole-roster minimum here; that's enforced separately, once,
 * at fixture-generation time.
 */
export function newPlayersSchema(existingNames: string[]) {
  const existingKeys = new Set(existingNames.map((n) => n.trim().toLowerCase()));
  return z
    .array(z.object({ name: playerNameSchema, profileId: z.string().optional() }))
    .max(MAX_PLAYERS, `Maximum ${MAX_PLAYERS} players allowed`)
    .superRefine((players, ctx) => {
      const seen = new Set(existingKeys);
      players.forEach((p, i) => {
        const key = p.name.trim().toLowerCase();
        if (seen.has(key)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Duplicate player name",
            path: [i, "name"],
          });
        } else {
          seen.add(key);
        }
      });
    });
}

export const aliasSchema = z
  .string()
  .trim()
  .max(40, "Alias must be 40 characters or fewer")
  .optional()
  .or(z.literal(""));

export const editTournamentSchema = z.object({
  name: z.string().trim().min(1, "Tournament name is required").max(80),
  venue: venueSchema,
  scheduledAt: scheduledAtSchema,
});
export type EditTournamentInput = z.infer<typeof editTournamentSchema>;

export const addLivestreamSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(80),
  youtubeUrl: z
    .string()
    .trim()
    .min(1, "YouTube link is required")
    .max(300)
    .refine((value) => extractYoutubeVideoId(value) !== null, {
      message: "Enter a valid YouTube video or live stream link",
    }),
});
export type AddLivestreamInput = z.infer<typeof addLivestreamSchema>;

export const youtubeUrlSchema = z.object({
  youtubeUrl: z
    .string()
    .trim()
    .max(300)
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || extractYoutubeVideoId(value) !== null, {
      message: "Enter a valid YouTube video or live stream link",
    }),
  isPublic: z.boolean(),
});
export type YoutubeUrlInput = z.infer<typeof youtubeUrlSchema>;

export const editPlayerSchema = z.object({
  name: playerNameSchema,
  alias: aliasSchema,
});
export type EditPlayerInput = z.infer<typeof editPlayerSchema>;

export const editPlayerProfileSchema = z.object({
  name: playerNameSchema,
  bio: z.string().trim().max(280, "Bio must be 280 characters or fewer").optional().or(z.literal("")),
  playingStyle: z
    .string()
    .trim()
    .max(60, "Must be 60 characters or fewer")
    .optional()
    .or(z.literal("")),
  hometown: z.string().trim().max(60, "Must be 60 characters or fewer").optional().or(z.literal("")),
  company: z.string().trim().max(60, "Must be 60 characters or fewer").optional().or(z.literal("")),
  upiId: z
    .string()
    .trim()
    .max(80, "Must be 80 characters or fewer")
    .regex(/^[\w.+-]{2,}@[a-zA-Z]{2,}$/, "Enter a valid UPI ID, like name@bank")
    .optional()
    .or(z.literal("")),
  isCoach: z.boolean(),
  coachYearsExperience: z.number().int().min(0).max(60).optional(),
  coachSkills: z
    .string()
    .trim()
    .max(140, "Must be 140 characters or fewer")
    .optional()
    .or(z.literal("")),
  coachAvailability: z
    .string()
    .trim()
    .max(140, "Must be 140 characters or fewer")
    .optional()
    .or(z.literal("")),
});
export type EditPlayerProfileInput = z.infer<typeof editPlayerProfileSchema>;

export const phoneSchema = z
  .string()
  .trim()
  .min(7, "Enter a valid phone number")
  .max(20, "Enter a valid phone number")
  .regex(/^[+\d][\d\s().-]{6,19}$/, "Enter a valid phone number");

/**
 * name is only required when the requester is signed out — a signed-in
 * request already has a name from the account, so the dialog omits the
 * field entirely and this stays optional to match.
 */
export const requestCoachingSchema = z.object({
  name: z.string().trim().max(40).optional(),
  phone: phoneSchema,
});
export type RequestCoachingInput = z.infer<typeof requestCoachingSchema>;

export const scoreEntrySchema = z
  .object({
    score1: z.number({ error: "Required" }).int().min(0).max(99),
    score2: z.number({ error: "Required" }).int().min(0).max(99),
  })
  .refine((data) => data.score1 !== data.score2, {
    message: "Scores cannot be equal",
    path: ["score2"],
  });
export type ScoreEntryInput = z.infer<typeof scoreEntrySchema>;

export const gameScoreSchema = z
  .object({
    score1: z.number({ error: "Required" }).int().min(0).max(99),
    score2: z.number({ error: "Required" }).int().min(0).max(99),
  })
  .refine((data) => data.score1 !== data.score2, {
    message: "Scores cannot be equal",
    path: ["score2"],
  });

/**
 * Semifinal/final matches can opt into best-of-three. Game 3 is only
 * required when games 1 and 2 split — otherwise one player already has
 * the 2 game wins needed to win the match.
 */
export const bestOfThreeScoreEntrySchema = z
  .object({
    game1: gameScoreSchema,
    game2: gameScoreSchema,
    game3: gameScoreSchema.optional(),
  })
  .superRefine((data, ctx) => {
    const games = [data.game1, data.game2, data.game3];
    const player1Wins = games.filter((g) => g && g.score1 > g.score2).length;
    const player2Wins = games.filter((g) => g && g.score2 > g.score1).length;
    if (Math.max(player1Wins, player2Wins) < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Game 3 is required when the first two games split",
        path: ["game3"],
      });
    }
  });
export type BestOfThreeScoreEntryInput = z.infer<typeof bestOfThreeScoreEntrySchema>;
export type GameScoreInput = z.infer<typeof gameScoreSchema>;

/**
 * shareAmount is always the participant's exact rupee portion — computed
 * client-side for an equal split, typed by hand for a custom one — so
 * this validates the same way regardless of splitMode: the shares just
 * need to add up to the total. A ₹0 share is fine — it's how someone
 * stays listed on an expense without owing anything for it.
 */
export const expenseSchema = z
  .object({
    description: z.string().trim().min(1, "Description is required").max(80),
    amount: z.number().int().min(1, "Amount must be at least ₹1").max(10_000_000),
    paidByPlayerId: z.string().min(1, "Choose who paid"),
    splitMode: z.enum(["EQUAL", "CUSTOM"]),
    participants: z
      .array(z.object({ playerId: z.string(), shareAmount: z.number().int().min(0) }))
      .min(1, "Select at least one participant"),
  })
  .superRefine((data, ctx) => {
    const sum = data.participants.reduce((total, p) => total + p.shareAmount, 0);
    if (sum !== data.amount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Shares must add up to the total amount",
        path: ["participants"],
      });
    }
  });
export type ExpenseInput = z.infer<typeof expenseSchema>;
