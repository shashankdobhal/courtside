-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN "skillLevels" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
