-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "game1Score1" INTEGER,
ADD COLUMN     "game1Score2" INTEGER,
ADD COLUMN     "game2Score1" INTEGER,
ADD COLUMN     "game2Score2" INTEGER,
ADD COLUMN     "game3Score1" INTEGER,
ADD COLUMN     "game3Score2" INTEGER,
ADD COLUMN     "isBestOfThree" BOOLEAN NOT NULL DEFAULT false;
