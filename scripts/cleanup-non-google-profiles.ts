/**
 * One-off cleanup: permanently deletes every PlayerProfile that isn't
 * linked to a Google account (userId: null) — leftover test/typo/unclaimed
 * identities that clutter the "add players" search. Safe with respect to
 * history: Player.profileId is onDelete: SetNull, so this only severs the
 * cross-tournament identity link; every Player row's name, and every
 * Match/Tournament, is untouched. Run manually:
 *
 *   npm run cleanup:profiles
 */
import { PrismaClient } from "@prisma/client";

try {
  process.loadEnvFile();
} catch {
  // No .env file (e.g. DATABASE_URL already set in the environment) — fine.
}

const prisma = new PrismaClient();

async function main() {
  const { count } = await prisma.playerProfile.deleteMany({ where: { userId: null } });
  console.log(`Deleted ${count} non-Google-linked player profile(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
