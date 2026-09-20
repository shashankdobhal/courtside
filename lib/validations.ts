import { z } from "zod";
import { TournamentType, TournamentFormat } from "@/types";
import { extractYoutubeVideoId } from "@/lib/youtube";

export const createTournamentSchema = z.object({
  name: z.string().trim().min(1, "Tournament name is required").max(80),
  format: z.enum([TournamentFormat.SINGLES, TournamentFormat.DOUBLES]),
  type: z.enum([TournamentType.ROUND_ROBIN, TournamentType.ROUND_ROBIN_KNOCKOUT]),
  legs: z.number().int().min(1).max(3),
});
export type CreateTournamentInput = z.infer<typeof createTournamentSchema>;

export const playerNameSchema = z.string().trim().min(1, "Name is required").max(40);

export const MIN_PLAYERS_ROUND_ROBIN = 2;
export const MIN_PLAYERS_KNOCKOUT = 4;
export const MAX_PLAYERS = 32;
export const MIN_DOUBLES_TEAMS = 2;

export const doublesTeamSchema = z.object({
  player1: z.object({ name: playerNameSchema, profileId: z.string().optional() }),
  player2: z.object({ name: playerNameSchema, profileId: z.string().optional() }),
});
export type DoublesTeamInput = z.infer<typeof doublesTeamSchema>;

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
});
export type EditTournamentInput = z.infer<typeof editTournamentSchema>;

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
  bio: z.string().trim().max(280, "Bio must be 280 characters or fewer").optional().or(z.literal("")),
  playingStyle: z
    .string()
    .trim()
    .max(60, "Must be 60 characters or fewer")
    .optional()
    .or(z.literal("")),
  hometown: z.string().trim().max(60, "Must be 60 characters or fewer").optional().or(z.literal("")),
});
export type EditPlayerProfileInput = z.infer<typeof editPlayerProfileSchema>;

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
