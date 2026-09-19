-- CreateTable
CREATE TABLE "PlayerProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerProfile_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "profileId" TEXT,
ADD COLUMN     "withdrawn" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "completedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "PlayerProfile_name_idx" ON "PlayerProfile"("name");

-- CreateIndex
CREATE INDEX "Player_profileId_idx" ON "Player"("profileId");

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "PlayerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
