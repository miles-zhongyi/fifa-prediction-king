import { MatchStatus } from "@prisma/client";
import { ZodError } from "zod";
import { schedulePersistGameData } from "@/lib/persistence/schedule-persist";
import { prisma } from "@/lib/prisma";
import { AdminServiceError } from "./errors";
import {
  adminCompleteMatchSchema,
  adminCreateMatchSchema,
  adminUpdateMatchSchema,
  validateFinishedMatchState,
  validateWinnerForMatch,
} from "./validations";

function handleValidationError(error: unknown): never {
  if (error instanceof ZodError) {
    throw new AdminServiceError(
      error.errors[0]?.message ?? "Validation failed",
      400,
      error.flatten(),
    );
  }

  if (error instanceof Error) {
    throw new AdminServiceError(error.message, 400);
  }

  throw error;
}

export async function listAdminMatches() {
  return prisma.match.findMany({
    orderBy: { startTime: "asc" },
    include: {
      _count: {
        select: { predictions: true },
      },
    },
  });
}

export async function createAdminMatch(rawInput: unknown) {
  let data;
  try {
    data = adminCreateMatchSchema.parse(rawInput);
  } catch (error) {
    handleValidationError(error);
  }

  const match = await prisma.match.create({ data });
  schedulePersistGameData();
  return match;
}

export async function updateAdminMatch(matchId: string, rawInput: unknown) {
  let data;
  try {
    data = adminUpdateMatchSchema.parse(rawInput);
  } catch (error) {
    handleValidationError(error);
  }

  const existing = await prisma.match.findUnique({ where: { id: matchId } });
  if (!existing) {
    throw new AdminServiceError("Match not found", 404);
  }

  const nextState = {
    homeTeam: data.homeTeam ?? existing.homeTeam,
    awayTeam: data.awayTeam ?? existing.awayTeam,
    homeScore:
      data.homeScore !== undefined ? data.homeScore : existing.homeScore,
    awayScore:
      data.awayScore !== undefined ? data.awayScore : existing.awayScore,
    winner: data.winner !== undefined ? data.winner : existing.winner,
    status: data.status ?? existing.status,
  };

  try {
    validateFinishedMatchState(nextState);

    if (nextState.winner) {
      validateWinnerForMatch(
        nextState.winner,
        nextState.homeTeam,
        nextState.awayTeam,
      );
    }
  } catch (error) {
    handleValidationError(error);
  }

  const match = await prisma.match.update({
    where: { id: matchId },
    data,
  });
  schedulePersistGameData();
  return match;
}

export async function completeAdminMatch(matchId: string, rawInput: unknown) {
  let data;
  try {
    data = adminCompleteMatchSchema.parse(rawInput);
  } catch (error) {
    handleValidationError(error);
  }

  const existing = await prisma.match.findUnique({ where: { id: matchId } });
  if (!existing) {
    throw new AdminServiceError("Match not found", 404);
  }

  try {
    validateWinnerForMatch(
      data.winner,
      existing.homeTeam,
      existing.awayTeam,
    );
  } catch (error) {
    handleValidationError(error);
  }

  const match = await prisma.match.update({
    where: { id: matchId },
    data: {
      winner: data.winner,
      status: MatchStatus.FINISHED,
    },
  });
  schedulePersistGameData();
  return match;
}
