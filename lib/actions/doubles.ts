"use server";

import { revalidatePath } from "next/cache";
import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { doublesTeamSchema } from "@/lib/validations";
import { resolveOrCreatePlayerProfile } from "@/lib/actions/player-profiles";
import { requireTournamentOwner } from "@/lib/auth-helpers";
import { TournamentFormat, TournamentStatus, TournamentType } from "@/types";

type Db = PrismaClient | Prisma.TransactionClient;

/**
 * Forms a FIXED doubles team for a tournament-style event (round robin /
 * knockout) — one Player row standing in for two real people for the whole
 * event, since the bracket/fixtures need a stable entity. A casual doubles
 * session doesn't use this: pairs there are whoever's playing a given
 * match, resolved on the fly by resolveDoublesPairing below.
 */
export async function createDoublesTeam(
  tournamentId: string,
  input: { player1: { name: string; profileId?: string }; player2: { name: string; profileId?: string } }
) {
  const { tournament } = await requireTournamentOwner(tournamentId);
  if (tournament.format !== TournamentFormat.DOUBLES) {
    throw new Error("This tournament isn't set up for doubles");
  }
  if (tournament.type === TournamentType.SESSION) {
    throw new Error("Casual doubles sessions pair players per match, not as fixed teams");
  }
  if (tournament.status !== TournamentStatus.PENDING) {
    throw new Error("Teams can only be added before fixtures are generated");
  }

  const parsed = doublesTeamSchema.parse(input);
  if (parsed.player1.name.trim().toLowerCase() === parsed.player2.name.trim().toLowerCase()) {
    throw new Error("A team needs two different players");
  }

  const [profileId1, profileId2] = await Promise.all([
    parsed.player1.profileId
      ? Promise.resolve(parsed.player1.profileId)
      : resolveOrCreatePlayerProfile(parsed.player1.name),
    parsed.player2.profileId
      ? Promise.resolve(parsed.player2.profileId)
      : resolveOrCreatePlayerProfile(parsed.player2.name),
  ]);

  await prisma.player.create({
    data: {
      tournamentId,
      name: `${parsed.player1.name} & ${parsed.player2.name}`,
      profileId: profileId1,
      partnerProfileId: profileId2,
    },
  });

  revalidatePath(`/tournaments/${tournamentId}/players`);
}

/**
 * Finds or creates the Player row representing this exact on-the-fly
 * doubles pairing within a session — order-independent, so A+B resolves to
 * the same row whether picked as (A,B) or (B,A), keeping that pair's match
 * history (and individual standings credit) together across the session.
 */
export async function resolveDoublesPairing(
  tournamentId: string,
  profile1: { id: string; name: string },
  profile2: { id: string; name: string },
  db: Db = prisma
): Promise<string> {
  const existing = await db.player.findFirst({
    where: {
      tournamentId,
      OR: [
        { profileId: profile1.id, partnerProfileId: profile2.id },
        { profileId: profile2.id, partnerProfileId: profile1.id },
      ],
    },
  });
  if (existing) return existing.id;

  const created = await db.player.create({
    data: {
      tournamentId,
      name: `${profile1.name} & ${profile2.name}`,
      profileId: profile1.id,
      partnerProfileId: profile2.id,
    },
  });
  return created.id;
}
