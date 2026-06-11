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
};

export function getGameDataFilePath(): string {
  return STORE_PATH;
}

export async function exportGameDataToFile(): Promise<void> {
  const [users, matches, predictions] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.match.findMany({ orderBy: { startTime: "asc" } }),
    prisma.prediction.findMany({ orderBy: { createdAt: "asc" } }),
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

    for (const prediction of data.predictions) {
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
