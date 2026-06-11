import { ZodError } from "zod";
import {
  getTeamsInGroup,
  isTeamInGroup,
  MAX_GROUP_ADVANCERS,
  normalizeGroupKey,
  type GroupKey,
} from "@/lib/groups";
import { prisma } from "@/lib/prisma";
import { removeKnockoutPicksForTeams } from "@/lib/knockout-pool";
import { getUserThirdPlaceTeams } from "@/lib/pick-conflicts";
import { getOrCreateUser } from "@/lib/users";
import { PredictionServiceError } from "@/lib/predictions/errors";
import { isGroupLocked } from "@/lib/group-picks/locking";
import { groupPickSchema } from "@/lib/group-picks/validation";

export type VoterSummary = {
  userId: string;
  username: string;
  avatarUrl: string | null;
};

export async function toggleGroupAdvancePick(rawInput: unknown) {
  let input;
  try {
    input = groupPickSchema.parse(rawInput);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new PredictionServiceError("Validation failed", 400, error.flatten());
    }
    throw error;
  }

  const groupKey = normalizeGroupKey(input.groupKey);
  const user = await getOrCreateUser(input.username);

  if (!isTeamInGroup(input.team, groupKey)) {
    throw new PredictionServiceError("Team is not in this group", 400);
  }

  if (await isGroupLocked(groupKey)) {
    throw new PredictionServiceError(
      "Group picks are locked after June 19, 2026",
      400,
    );
  }

  const existing = await prisma.groupAdvancePick.findUnique({
    where: {
      userId_groupKey_team: {
        userId: user.id,
        groupKey,
        team: input.team,
      },
    },
  });

  if (existing) {
    await prisma.groupAdvancePick.delete({ where: { id: existing.id } });
    await removeKnockoutPicksForTeams(user.id, [input.team]);
    return { groupKey, team: input.team, selected: false };
  }

  const currentCount = await prisma.groupAdvancePick.count({
    where: { userId: user.id, groupKey },
  });

  if (currentCount >= MAX_GROUP_ADVANCERS) {
    throw new PredictionServiceError(
      `You can only pick ${MAX_GROUP_ADVANCERS} teams per group`,
      400,
    );
  }

  const thirdPlaceTeams = await getUserThirdPlaceTeams(user.id);
  if (thirdPlaceTeams.has(input.team)) {
    throw new PredictionServiceError(
      "You already picked this team as a third-place advancer",
      400,
    );
  }

  await prisma.groupAdvancePick.create({
    data: {
      userId: user.id,
      groupKey,
      team: input.team,
    },
  });

  return { groupKey, team: input.team, selected: true };
}

export async function getUserGroupPicks(username: string) {
  const user = await getOrCreateUser(username);
  return prisma.groupAdvancePick.findMany({
    where: { userId: user.id },
    orderBy: [{ groupKey: "asc" }, { team: "asc" }],
  });
}

export async function getGroupPickBoard(groupKeyInput: string) {
  const groupKey = normalizeGroupKey(groupKeyInput);
  const teams = getTeamsInGroup(groupKey);

  const picks = await prisma.groupAdvancePick.findMany({
    where: { groupKey },
    include: {
      user: {
        select: { id: true, username: true, avatarUrl: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const picksByTeam: Record<string, VoterSummary[]> = {};
  for (const team of teams) {
    picksByTeam[team] = [];
  }

  for (const pick of picks) {
    picksByTeam[pick.team]?.push({
      userId: pick.user.id,
      username: pick.user.username,
      avatarUrl: pick.user.avatarUrl,
    });
  }

  const result = await prisma.groupResult.findUnique({ where: { groupKey } });

  return {
    groupKey,
    teams,
    picksByTeam,
    result,
    locked: await isGroupLocked(groupKey),
  };
}

export async function getAllGroupBoards() {
  const boards = await Promise.all(
    (["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"] as GroupKey[]).map(
      (groupKey) => getGroupPickBoard(groupKey),
    ),
  );

  return boards;
}
