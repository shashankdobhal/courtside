-- RenameTable: CoachFollow -> Follow (following is no longer coach-only)
ALTER TABLE "CoachFollow" RENAME TO "Follow";
ALTER TABLE "Follow" RENAME COLUMN "coachProfileId" TO "followedProfileId";

ALTER TABLE "Follow" RENAME CONSTRAINT "CoachFollow_pkey" TO "Follow_pkey";
ALTER TABLE "Follow" RENAME CONSTRAINT "CoachFollow_coachProfileId_fkey" TO "Follow_followedProfileId_fkey";
ALTER TABLE "Follow" RENAME CONSTRAINT "CoachFollow_followerProfileId_fkey" TO "Follow_followerProfileId_fkey";

ALTER INDEX "CoachFollow_coachProfileId_followerProfileId_key" RENAME TO "Follow_followedProfileId_followerProfileId_key";
ALTER INDEX "CoachFollow_coachProfileId_idx" RENAME TO "Follow_followedProfileId_idx";
ALTER INDEX "CoachFollow_followerProfileId_idx" RENAME TO "Follow_followerProfileId_idx";

-- CreateTable
CREATE TABLE "LearnPost" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "videoUrl" TEXT,
    "authorProfileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearnPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LearnPost_authorProfileId_idx" ON "LearnPost"("authorProfileId");

-- CreateIndex
CREATE INDEX "LearnPost_createdAt_idx" ON "LearnPost"("createdAt");

-- AddForeignKey
ALTER TABLE "LearnPost" ADD CONSTRAINT "LearnPost_authorProfileId_fkey" FOREIGN KEY ("authorProfileId") REFERENCES "PlayerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
