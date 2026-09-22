-- AlterTable
ALTER TABLE "PlayerProfile" ADD COLUMN     "playingLevel" TEXT NOT NULL DEFAULT 'BEGINNER';

-- Backfill: every profile that existed before this migration is set to
-- Advanced. The column default above (Beginner) only applies going forward,
-- to profiles created after this point.
UPDATE "PlayerProfile" SET "playingLevel" = 'ADVANCED';

-- Seed the Sportyzo community and add every existing profile to it as an
-- approved member. Any profile already linked to a real signed-in account
-- becomes an admin (today that's just the one real organizer using the
-- app), so the community has at least one admin who can approve future
-- join requests; every other (legacy, name-only) profile joins as a
-- regular member.
INSERT INTO "Community" ("id", "name", "description", "createdAt")
VALUES ('sportyzo-community', 'Sportyzo', NULL, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CommunityMembership" ("id", "communityId", "profileId", "role", "status", "createdAt")
SELECT
  'sportyzo-member-' || pp."id",
  'sportyzo-community',
  pp."id",
  CASE WHEN pp."userId" IS NOT NULL THEN 'ADMIN' ELSE 'MEMBER' END,
  'APPROVED',
  CURRENT_TIMESTAMP
FROM "PlayerProfile" pp
ON CONFLICT ("communityId", "profileId") DO NOTHING;
