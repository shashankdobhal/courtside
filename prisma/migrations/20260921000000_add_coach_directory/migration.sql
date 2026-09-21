-- AlterTable
ALTER TABLE "PlayerProfile" ADD COLUMN     "isCoach" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "coachYearsExperience" INTEGER,
ADD COLUMN     "coachSkills" TEXT,
ADD COLUMN     "coachAvailability" TEXT;
