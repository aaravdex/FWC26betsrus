-- CreateEnum
CREATE TYPE "MatchLiveStatus" AS ENUM ('SCHEDULED', 'LIVE', 'HALFTIME', 'FULLTIME');

-- CreateEnum
CREATE TYPE "MatchEventType" AS ENUM ('KICKOFF', 'GOAL', 'OWN_GOAL', 'PENALTY_SCORED', 'PENALTY_MISSED', 'YELLOW_CARD', 'RED_CARD', 'SUBSTITUTION', 'INJURY', 'VAR', 'HALFTIME', 'FULLTIME', 'NOTE');

-- AlterEnum
ALTER TYPE "MarketStatus" ADD VALUE 'SUSPENDED';

-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "liveStatus" "MatchLiveStatus" NOT NULL DEFAULT 'SCHEDULED',
ADD COLUMN     "minute" INTEGER;

-- AlterTable
ALTER TABLE "Outcome" ADD COLUMN     "oddsUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "previousOdds" DECIMAL(12,2);

-- CreateTable
CREATE TABLE "MatchEvent" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "type" "MatchEventType" NOT NULL,
    "minute" INTEGER,
    "teamId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MatchEvent_matchId_idx" ON "MatchEvent"("matchId");

-- CreateIndex
CREATE INDEX "ChatMessage_createdAt_idx" ON "ChatMessage"("createdAt");

-- AddForeignKey
ALTER TABLE "MatchEvent" ADD CONSTRAINT "MatchEvent_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchEvent" ADD CONSTRAINT "MatchEvent_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
