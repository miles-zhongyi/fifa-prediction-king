import { ZodError } from "zod";
import { z } from "zod";
import {
  getTeamsInGroup,
  isValidGroupKey,
  normalizeGroupKey,
} from "@/lib/groups";
import { schedulePersistGameData } from "@/lib/persistence/schedule-persist";
import { prisma } from "@/lib/prisma";
import { AdminServiceError } from "./errors";

const groupResultSchema = z.object({
  advancer1: z.string().trim().min(1).nullable().optional(),
  advancer2: z.string().trim().min(1).nullable().optional(),
  thirdPlaceTeam: z.string().trim().min(1).nullable().optional(),
  thirdAdvances: z.boolean().optional(),
  finalized: z.boolean().optional(),
});

export async function listGroupResults() {
  return prisma.groupResult.findMany({
    orderBy: { groupKey: "asc" },
  });
}

export async function updateGroupResult(groupKeyInput: string, rawInput: unknown) {
  if (!isValidGroupKey(groupKeyInput)) {
    throw new AdminServiceError("Invalid group", 400);
  }

  const groupKey = normalizeGroupKey(groupKeyInput);
  let data;

  try {
    data = groupResultSchema.parse(rawInput);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AdminServiceError(
        error.errors[0]?.message ?? "Validation failed",
        400,
        error.flatten(),
      );
    }
    throw error;
  }

  const teams = getTeamsInGroup(groupKey);
  const selectedTeams = [data.advancer1, data.advancer2, data.thirdPlaceTeam].filter(
    (team): team is string => Boolean(team),
  );

  for (const team of selectedTeams) {
    if (!teams.includes(team)) {
      throw new AdminServiceError(`${team} is not in Group ${groupKey}`, 400);
    }
  }

  if (data.advancer1 && data.advancer2 && data.advancer1 === data.advancer2) {
    throw new AdminServiceError("Advancers must be different teams", 400);
  }

  const result = await prisma.groupResult.upsert({
    where: { groupKey },
    create: {
      groupKey,
      advancer1: data.advancer1 ?? null,
      advancer2: data.advancer2 ?? null,
      thirdPlaceTeam: data.thirdPlaceTeam ?? null,
      thirdAdvances: data.thirdAdvances ?? false,
      finalized: data.finalized ?? false,
    },
    update: {
      advancer1: data.advancer1,
      advancer2: data.advancer2,
      thirdPlaceTeam: data.thirdPlaceTeam,
      thirdAdvances: data.thirdAdvances,
      finalized: data.finalized,
    },
  });

  schedulePersistGameData();
  return result;
}
