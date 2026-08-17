import { z } from "zod";
import { TournamentType } from "@/types";

export const createTournamentSchema = z.object({
  name: z.string().trim().min(1, "Tournament name is required").max(80),
  type: z.enum([TournamentType.ROUND_ROBIN, TournamentType.ROUND_ROBIN_KNOCKOUT]),
});
export type CreateTournamentInput = z.infer<typeof createTournamentSchema>;

export const playerNameSchema = z.string().trim().min(1, "Name is required").max(40);

export const playersSchema = z
  .array(z.object({ name: playerNameSchema }))
  .min(4, "At least 4 players are required")
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

export const scoreEntrySchema = z
  .object({
    score1: z.coerce.number().int().min(0).max(99),
    score2: z.coerce.number().int().min(0).max(99),
  })
  .refine((data) => data.score1 !== data.score2, {
    message: "Scores cannot be equal",
    path: ["score2"],
  });
export type ScoreEntryInput = z.infer<typeof scoreEntrySchema>;
