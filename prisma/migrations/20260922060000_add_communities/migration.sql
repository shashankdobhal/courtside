-- CreateTable
CREATE TABLE "Community" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Community_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityMembership" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityMembership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Community_name_idx" ON "Community"("name");

-- CreateIndex
CREATE INDEX "CommunityMembership_communityId_idx" ON "CommunityMembership"("communityId");

-- CreateIndex
CREATE INDEX "CommunityMembership_profileId_idx" ON "CommunityMembership"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityMembership_communityId_profileId_key" ON "CommunityMembership"("communityId", "profileId");

-- AddForeignKey
ALTER TABLE "CommunityMembership" ADD CONSTRAINT "CommunityMembership_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityMembership" ADD CONSTRAINT "CommunityMembership_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "PlayerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
