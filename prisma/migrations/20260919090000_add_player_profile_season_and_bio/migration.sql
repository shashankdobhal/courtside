-- AlterTable
ALTER TABLE "PlayerProfile" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "hometown" TEXT,
ADD COLUMN     "playingStyle" TEXT,
ADD COLUMN     "seasonOptIn" BOOLEAN NOT NULL DEFAULT false;
