-- AlterTable
ALTER TABLE "PlayerProfile" ALTER COLUMN "seasonOptIn" SET DEFAULT true;

-- Backfill: existing profiles never got a chance to choose under the old
-- opt-in-required default — flip everyone to opted-in now that the
-- leaderboard defaults to showing everyone. Anyone who wants out can still
-- toggle it off from their own profile.
UPDATE "PlayerProfile" SET "seasonOptIn" = true WHERE "seasonOptIn" = false;
