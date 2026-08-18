import { z } from "zod";
import { TournamentType } from "@/types";

export const createTournamentSchema = z.object({
  name: z.string().trim().min(1, "Tournament name is required").max(80),
  type: z.enum([TournamentType.ROUND_ROBIN, TournamentType.ROUND_ROBIN_KNOCKOUT]),
  legs: z.number().int().min(1).max(3),
});
export type CreateTournamentInput = z.infer<typeof createTournamentSchema>;

export const playerNameSchema = z.string().trim().min(1, "Name is required").max(40);

function buildPlayersSchema(minPlayers: number) {
  return z
    .array(z.object({ name: playerNameSchema }))
    .min(minPlayers, `At least ${minPlayers} players are required`)
    .max(32, "Maximum 32 players allowed")
    .superRefine((players, ctx) => {
      const seen = new Map<string, number>();
      players.forEach((p, i) => {
        const key = p.name.trim().toLowerCase();
        if (seen.has(key)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Duplicate player name",
            path: [i, "name"],
          });
        } else {
          seen.set(key, i);
        }
      });
    });
}

export const MIN_PLAYERS_ROUND_ROBIN = 2;
export const MIN_PLAYERS_KNOCKOUT = 4;

export const playersSchema = buildPlayersSchema(MIN_PLAYERS_ROUND_ROBIN);

export function playersSchemaForType(type: string) {
  return buildPlayersSchema(
    type === TournamentType.ROUND_ROBIN_KNOCKOUT ? MIN_PLAYERS_KNOCKOUT : MIN_PLAYERS_ROUND_ROBIN
  );
}

export const aliasSchema = z
  .string()
  .trim()
  .max(40, "Alias must be 40 characters or fewer")
  .optional()
  .or(z.literal(""));

export const editPlayerSchema = z.object({
  name: playerNameSchema,
  alias: aliasSchema,
});
export type EditPlayerInput = z.infer<typeof editPlayerSchema>;

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
