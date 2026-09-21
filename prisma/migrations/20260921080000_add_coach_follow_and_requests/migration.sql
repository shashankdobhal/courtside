-- CreateTable
CREATE TABLE "CoachFollow" (
    "id" TEXT NOT NULL,
    "coachProfileId" TEXT NOT NULL,
    "followerProfileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoachFollow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachingRequest" (
    "id" TEXT NOT NULL,
    "coachProfileId" TEXT NOT NULL,
    "requesterProfileId" TEXT,
    "requesterName" TEXT NOT NULL,
    "requesterPhone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoachingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoachFollow_coachProfileId_idx" ON "CoachFollow"("coachProfileId");

-- CreateIndex
CREATE INDEX "CoachFollow_followerProfileId_idx" ON "CoachFollow"("followerProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "CoachFollow_coachProfileId_followerProfileId_key" ON "CoachFollow"("coachProfileId", "followerProfileId");

-- CreateIndex
CREATE INDEX "CoachingRequest_coachProfileId_idx" ON "CoachingRequest"("coachProfileId");

-- CreateIndex
CREATE INDEX "CoachingRequest_requesterProfileId_idx" ON "CoachingRequest"("requesterProfileId");

-- AddForeignKey
ALTER TABLE "CoachFollow" ADD CONSTRAINT "CoachFollow_coachProfileId_fkey" FOREIGN KEY ("coachProfileId") REFERENCES "PlayerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachFollow" ADD CONSTRAINT "CoachFollow_followerProfileId_fkey" FOREIGN KEY ("followerProfileId") REFERENCES "PlayerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingRequest" ADD CONSTRAINT "CoachingRequest_coachProfileId_fkey" FOREIGN KEY ("coachProfileId") REFERENCES "PlayerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingRequest" ADD CONSTRAINT "CoachingRequest_requesterProfileId_fkey" FOREIGN KEY ("requesterProfileId") REFERENCES "PlayerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
