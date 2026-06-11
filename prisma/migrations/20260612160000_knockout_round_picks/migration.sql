-- CreateTable
CREATE TABLE "KnockoutRoundPick" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "round" TEXT NOT NULL,
    "team" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "KnockoutRoundPick_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KnockoutRoundResult" (
    "round" TEXT NOT NULL PRIMARY KEY,
    "teams" TEXT NOT NULL,
    "finalized" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "KnockoutRoundPick_round_team_idx" ON "KnockoutRoundPick"("round", "team");

-- CreateIndex
CREATE UNIQUE INDEX "KnockoutRoundPick_userId_round_team_key" ON "KnockoutRoundPick"("userId", "round", "team");
