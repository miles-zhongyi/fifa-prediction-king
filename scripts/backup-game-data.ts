import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getDataDir(): string {
  return process.env.DATA_DIR ?? path.join(process.cwd(), "data");
}

async function main() {
  const [
    users,
    matches,
    predictions,
    groupAdvancePicks,
    thirdPlacePicks,
    groupResults,
    knockoutRoundPicks,
    knockoutRoundResults,
  ] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.match.findMany({ orderBy: { startTime: "asc" } }),
    prisma.prediction.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.groupAdvancePick.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.thirdPlacePick.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.groupResult.findMany({ orderBy: { groupKey: "asc" } }),
    prisma.knockoutRoundPick.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.knockoutRoundResult.findMany({ orderBy: { round: "asc" } }),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    users: users.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt.toISOString(),
    })),
    matches: matches.map((match) => ({
      id: match.id,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      stage: match.stage,
      startTime: match.startTime.toISOString(),
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      winner: match.winner,
      status: match.status,
      createdAt: match.createdAt.toISOString(),
    })),
    predictions: predictions.map((prediction) => ({
      id: prediction.id,
      userId: prediction.userId,
      matchId: prediction.matchId,
      predictedWinner: prediction.predictedWinner,
      createdAt: prediction.createdAt.toISOString(),
      updatedAt: prediction.updatedAt.toISOString(),
    })),
    groupAdvancePicks: groupAdvancePicks.map((pick) => ({
      id: pick.id,
      userId: pick.userId,
      groupKey: pick.groupKey,
      team: pick.team,
      createdAt: pick.createdAt.toISOString(),
    })),
    thirdPlacePicks: thirdPlacePicks.map((pick) => ({
      id: pick.id,
      userId: pick.userId,
      team: pick.team,
      createdAt: pick.createdAt.toISOString(),
    })),
    groupResults: groupResults.map((result) => ({
      id: result.id,
      groupKey: result.groupKey,
      advancer1: result.advancer1,
      advancer2: result.advancer2,
      thirdPlaceTeam: result.thirdPlaceTeam,
      thirdAdvances: result.thirdAdvances,
      finalized: result.finalized,
      updatedAt: result.updatedAt.toISOString(),
    })),
    knockoutRoundPicks: knockoutRoundPicks.map((pick) => ({
      id: pick.id,
      userId: pick.userId,
      round: pick.round,
      team: pick.team,
      createdAt: pick.createdAt.toISOString(),
    })),
    knockoutRoundResults: knockoutRoundResults.map((result) => ({
      round: result.round,
      teams: result.teams,
      finalized: result.finalized,
      updatedAt: result.updatedAt.toISOString(),
    })),
  };

  const dataDir = getDataDir();
  const outputPath = path.join(dataDir, "game-data.json");

  await mkdir(dataDir, { recursive: true });
  await writeFile(outputPath, JSON.stringify(payload, null, 2), "utf-8");

  console.log(`Game data exported to ${outputPath}`);
  console.log(
    `Users: ${users.length}, matches: ${matches.length}, group picks: ${groupAdvancePicks.length}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
