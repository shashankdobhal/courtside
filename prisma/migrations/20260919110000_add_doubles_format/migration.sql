-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "format" TEXT NOT NULL DEFAULT 'SINGLES';

-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "partnerProfileId" TEXT;

-- CreateIndex
CREATE INDEX "Player_partnerProfileId_idx" ON "Player"("partnerProfileId");

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_partnerProfileId_fkey" FOREIGN KEY ("partnerProfileId") REFERENCES "PlayerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
