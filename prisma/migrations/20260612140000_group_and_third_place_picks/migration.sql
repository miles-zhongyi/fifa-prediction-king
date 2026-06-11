-- CreateTable
CREATE TABLE "GroupAdvancePick" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "groupKey" TEXT NOT NULL,
    "team" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GroupAdvancePick_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ThirdPlacePick" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "team" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ThirdPlacePick_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GroupResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupKey" TEXT NOT NULL,
    "advancer1" TEXT,
    "advancer2" TEXT,
    "thirdPlaceTeam" TEXT,
    "thirdAdvances" BOOLEAN NOT NULL DEFAULT false,
    "finalized" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "GroupAdvancePick_groupKey_team_idx" ON "GroupAdvancePick"("groupKey", "team");

-- CreateIndex
CREATE UNIQUE INDEX "GroupAdvancePick_userId_groupKey_team_key" ON "GroupAdvancePick"("userId", "groupKey", "team");

-- CreateIndex
CREATE INDEX "ThirdPlacePick_team_idx" ON "ThirdPlacePick"("team");

-- CreateIndex
CREATE UNIQUE INDEX "ThirdPlacePick_userId_team_key" ON "ThirdPlacePick"("userId", "team");

-- CreateIndex
CREATE UNIQUE INDEX "GroupResult_groupKey_key" ON "GroupResult"("groupKey");
