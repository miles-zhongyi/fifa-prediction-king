import { ZodError } from "zod";
import { z } from "zod";
import {
  isKnockoutRoundKey,
  KNOCKOUT_ROUND_KEYS,
} from "@/lib/knockout-rounds";
import { schedulePersistGameData } from "@/lib/persistence/schedule-persist";
import { prisma } from "@/lib/prisma";
import { AdminServiceError } from "./errors";

const knockoutRoundResultSchema = z.object({
  teams: z.array(z.string().trim().min(1)),
  finalized: z.boolean().optional(),
});

export async function listKnockoutRoundResults() {
  const results = await prisma.knockoutRoundResult.findMany({
    orderBy: { round: "asc" },
  });

  return results.map((result) => ({
    ...result,
    teams: JSON.parse(result.teams) as string[],
  }));
}

export async function updateKnockoutRoundResult(
  roundInput: string,
  rawInput: unknown,
) {
  if (!isKnockoutRoundKey(roundInput)) {
    throw new AdminServiceError("Invalid knockout round", 400);
  }

  let data;
  try {
    data = knockoutRoundResultSchema.parse(rawInput);
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

  const uniqueTeams = [...new Set(data.teams)];
  if (uniqueTeams.length !== data.teams.length) {
    throw new AdminServiceError("Teams must be unique", 400);
  }

  const result = await prisma.knockoutRoundResult.upsert({
    where: { round: roundInput },
    create: {
      round: roundInput,
      teams: JSON.stringify(uniqueTeams),
      finalized: data.finalized ?? false,
    },
    update: {
      teams: JSON.stringify(uniqueTeams),
      finalized: data.finalized,
    },
  });

  schedulePersistGameData();

  return {
    ...result,
    teams: uniqueTeams,
  };
}

export async function ensureKnockoutRoundResults() {
  for (const round of KNOCKOUT_ROUND_KEYS) {
    await prisma.knockoutRoundResult.upsert({
      where: { round },
      create: {
        round,
        teams: "[]",
        finalized: false,
      },
      update: {},
    });
  }
}
