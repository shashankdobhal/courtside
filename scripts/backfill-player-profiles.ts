/**
 * One-off, idempotent backfill: links pre-existing Player rows (created
 * before PlayerProfile existed) to a global player identity, so their
 * history shows up in leaderboards and profile pages. Run manually once
 * after deploying the migration that adds PlayerProfile/Player.profileId:
 *
 *   npm run backfill:profiles
 *
 * Safe to re-run — it only ever touches Player rows with profileId: null,
 * and reuses the same case-insensitive match-or-create logic the app uses
 * at runtime, so it can never disagree with the app about what counts as
 * "the same player."
 */
import { PrismaClient } from "@prisma/client";
import { resolveOrCreatePlayerProfile } from "../lib/actions/player-profiles";

try {
  process.loadEnvFile();
} catch {
  // No .env file (e.g. DATABASE_URL already set in the environment) — fine.
}

const prisma = new PrismaClient();

async function main() {
  const players = await prisma.player.findMany({
    where: { profileId: null },
    orderBy: { id: "asc" },
  });

  const groups = new Map<string, typeof players>();
  for (const player of players) {
    const key = player.name.trim().toLowerCase();
    const group = groups.get(key);
    if (group) group.push(player);
    else groups.set(key, [player]);
  }

  let profilesTouched = 0;
  let playersLinked = 0;

  for (const group of groups.values()) {
    const canonicalName = group[0].name;
    const profileId = await resolveOrCreatePlayerProfile(canonicalName, prisma);
    profilesTouched += 1;
    await prisma.player.updateMany({
      where: { id: { in: group.map((p) => p.id) } },
      data: { profileId },
    });
    playersLinked += group.length;
  }

  console.log(
    `Backfilled ${playersLinked} player row(s) across ${profilesTouched} distinct name(s).`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
