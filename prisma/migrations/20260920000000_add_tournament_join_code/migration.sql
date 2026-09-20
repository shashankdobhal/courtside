-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN "joinCode" TEXT;

-- Backfill: give every existing tournament a random code so the column can
-- become NOT NULL + UNIQUE below. New tournaments get a proper code (safe
-- alphabet, collision-checked) from lib/join-code.ts at creation time; this
-- one-off hex-based backfill is fine given the tiny number of pre-existing rows.
UPDATE "Tournament" SET "joinCode" = upper(substr(md5(random()::text || id), 1, 6)) WHERE "joinCode" IS NULL;

-- AlterTable
ALTER TABLE "Tournament" ALTER COLUMN "joinCode" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Tournament_joinCode_key" ON "Tournament"("joinCode");
