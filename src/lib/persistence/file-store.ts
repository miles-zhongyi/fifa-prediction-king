import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { getDataDir } from "@/lib/paths";
import { prisma } from "@/lib/prisma";

const STORE_PATH = path.join(getDataDir(), "game-data.json");

export type PersistedGameData = {
  exportedAt: string;
  users: Array<{
    id: string;
    username: string;
    email: string;
    avatarUrl: string | null;
    createdAt: string;
  }>;
  matches: Array<{
    id: string;
    homeTeam: string;
    awayTeam: string;
    stage: string;
    startTime: string;
    winner: string | null;
    status: string;
    createdAt: string;
  }>;
  predictions: Array<{
    id: string;
    userId: string;
    matchId: string;
    predictedWinner: string;
    createdAt: string;
    updatedAt: string;
  }>;
  groupAdvancePicks: Array<{
    id: string;
    userId: string;
    groupKey: string;
    team: string;
    createdAt: string;
  }>;
  thirdPlacePicks: Array<{
    id: string;
    userId: string;
    team: string;
    createdAt: string;
  }>;
  groupResults: Array<{
    id: string;
    groupKey: string;
    advancer1: string | null;
    advancer2: string | null;
    thirdPlaceTeam: string | null;
    thirdAdvances: boolean;
    finalized: boolean;
    updatedAt: string;
  }>;
  knockoutRoundPicks: Array<{
    id: string;
    userId: string;
    round: string;
    team: string;
    createdAt: string;
  }>;
  knockoutRoundResults: Array<{
    round: string;
    teams: string;
    finalized: boolean;
    updatedAt: string;
  }>;
};

export function getGameDataFilePath(): string {
  return STORE_PATH;
}

export async function exportGameDataToFile(): Promise<void> {
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

  const payload: PersistedGameData = {
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

  await mkdir(getDataDir(), { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(payload, null, 2), "utf-8");
}

export async function restoreGameDataFromFile(): Promise<boolean> {
  try {
    const raw = await readFile(STORE_PATH, "utf-8");
    const data = JSON.parse(raw) as PersistedGameData;

    if (!data.users?.length && !data.matches?.length) {
      return false;
    }

    const existingUsers = await prisma.user.count();
    if (existingUsers > 0) {
      return false;
    }

    for (const user of data.users) {
      await prisma.user.create({
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatarUrl: user.avatarUrl,
          createdAt: new Date(user.createdAt),
        },
      });
    }

    for (const match of data.matches) {
      await prisma.match.create({
        data: {
          id: match.id,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          stage: match.stage,
          startTime: new Date(match.startTime),
          winner: match.winner,
          status: match.status as never,
          createdAt: new Date(match.createdAt),
        },
      });
    }

    for (const prediction of data.predictions ?? []) {
      await prisma.prediction.create({
        data: {
          id: prediction.id,
          userId: prediction.userId,
          matchId: prediction.matchId,
          predictedWinner: prediction.predictedWinner,
          createdAt: new Date(prediction.createdAt),
          updatedAt: new Date(prediction.updatedAt),
        },
      });
    }

    for (const pick of data.groupAdvancePicks ?? []) {
      await prisma.groupAdvancePick.create({
        data: {
          id: pick.id,
          userId: pick.userId,
          groupKey: pick.groupKey,
          team: pick.team,
          createdAt: new Date(pick.createdAt),
        },
      });
    }

    for (const pick of data.thirdPlacePicks ?? []) {
      await prisma.thirdPlacePick.create({
        data: {
          id: pick.id,
          userId: pick.userId,
          team: pick.team,
          createdAt: new Date(pick.createdAt),
        },
      });
    }

    for (const result of data.groupResults ?? []) {
      await prisma.groupResult.create({
        data: {
          id: result.id,
          groupKey: result.groupKey,
          advancer1: result.advancer1,
          advancer2: result.advancer2,
          thirdPlaceTeam: result.thirdPlaceTeam,
          thirdAdvances: result.thirdAdvances,
          finalized: result.finalized,
          updatedAt: new Date(result.updatedAt),
        },
      });
    }

    for (const pick of data.knockoutRoundPicks ?? []) {
      await prisma.knockoutRoundPick.create({
        data: {
          id: pick.id,
          userId: pick.userId,
          round: pick.round,
          team: pick.team,
          createdAt: new Date(pick.createdAt),
        },
      });
    }

    for (const result of data.knockoutRoundResults ?? []) {
      await prisma.knockoutRoundResult.create({
        data: {
          round: result.round,
          teams: result.teams,
          finalized: result.finalized,
          updatedAt: new Date(result.updatedAt),
        },
      });
    }

    return true;
  } catch {
    return false;
  }
}

export async function persistGameData(): Promise<void> {
  try {
    await exportGameDataToFile();
  } catch (error) {
    console.error("Failed to persist game data:", error);
  }
}
