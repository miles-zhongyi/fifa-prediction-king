import { ZodError } from "zod";
import {
  getAllGroupTeams,
  getGroupRosters,
  MAX_THIRD_PLACE_PICKS,
} from "@/lib/groups";
import { isThirdPlaceLocked } from "@/lib/group-picks/locking";
import { prisma } from "@/lib/prisma";
import { PredictionServiceError } from "@/lib/predictions/errors";
import { removeKnockoutPicksForTeams } from "@/lib/knockout-pool";
import { getUserGroupAdvanceTeams } from "@/lib/pick-conflicts";
import { getOrCreateUser } from "@/lib/users";
import type { VoterSummary } from "@/lib/group-picks/service";
import { thirdPlacePickSchema } from "@/lib/third-place-picks/validation";

const ALL_TEAMS = new Set(getAllGroupTeams());

export async function toggleThirdPlacePick(rawInput: unknown) {
  let input;
  try {
    input = thirdPlacePickSchema.parse(rawInput);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new PredictionServiceError("Validation failed", 400, error.flatten());
    }
    throw error;
  }

  const user = await getOrCreateUser(input.username);

  if (!ALL_TEAMS.has(input.team)) {
    throw new PredictionServiceError("Invalid team", 400);
  }

  if (await isThirdPlaceLocked()) {
    throw new PredictionServiceError(
      "Third-place picks are locked after June 19, 2026",
      400,
    );
  }

  const existing = await prisma.thirdPlacePick.findUnique({
    where: {
      userId_team: {
        userId: user.id,
        team: input.team,
      },
    },
  });

  if (existing) {
    await prisma.thirdPlacePick.delete({ where: { id: existing.id } });
    await removeKnockoutPicksForTeams(user.id, [input.team]);
    return { team: input.team, selected: false };
  }

  const currentCount = await prisma.thirdPlacePick.count({
    where: { userId: user.id },
  });

  if (currentCount >= MAX_THIRD_PLACE_PICKS) {
    throw new PredictionServiceError(
      `You can only pick ${MAX_THIRD_PLACE_PICKS} third-place advancers`,
      400,
    );
  }

  const groupAdvanceTeams = await getUserGroupAdvanceTeams(user.id);
  if (groupAdvanceTeams.has(input.team)) {
    throw new PredictionServiceError(
      "You already picked this team to advance from its group",
      400,
    );
  }

  await prisma.thirdPlacePick.create({
    data: {
      userId: user.id,
      team: input.team,
    },
  });

  return { team: input.team, selected: true };
}

export async function getUserThirdPlacePicks(username: string) {
  const user = await getOrCreateUser(username);
  return prisma.thirdPlacePick.findMany({
    where: { userId: user.id },
    orderBy: { team: "asc" },
  });
}

export async function getThirdPlaceBoard() {
  const picks = await prisma.thirdPlacePick.findMany({
    include: {
      user: {
        select: { id: true, username: true, avatarUrl: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const picksByTeam: Record<string, VoterSummary[]> = {};

  for (const team of ALL_TEAMS) {
    picksByTeam[team] = [];
  }

  for (const pick of picks) {
    if (!picksByTeam[pick.team]) {
      picksByTeam[pick.team] = [];
    }

    picksByTeam[pick.team].push({
      userId: pick.user.id,
      username: pick.user.username,
      avatarUrl: pick.user.avatarUrl,
    });
  }

  const results = await prisma.groupResult.findMany({
    where: { finalized: true },
  });

  return {
    groups: getGroupRosters(),
    teams: [...ALL_TEAMS].sort(),
    picksByTeam,
    results,
    locked: await isThirdPlaceLocked(),
    maxPicks: MAX_THIRD_PLACE_PICKS,
  };
}
