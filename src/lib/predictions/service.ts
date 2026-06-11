import { ZodError } from "zod";
import { isGroupStageMatch } from "@/lib/match-utils";
import { getOrCreateUser } from "@/lib/users";
import type { PredictionWithRelations } from "@/types";
import { PredictionServiceError } from "./errors";
import type { PredictionRepository } from "./repository";
import { predictionRepository } from "./repository";
import {
  submitPredictionSchema,
  validatePredictedWinner,
  type SubmitPredictionInput,
} from "./validation";

export type SubmitPredictionOptions = {
  now?: Date;
  repository?: PredictionRepository;
};

export function assertMatchNotStarted(
  startTime: Date,
  now: Date,
): void {
  if (now.getTime() >= startTime.getTime()) {
    throw new PredictionServiceError(
      "Predictions are closed because the match has already started",
      400,
    );
  }
}

export async function submitPrediction(
  rawInput: unknown,
  options: SubmitPredictionOptions = {},
): Promise<PredictionWithRelations> {
  const repository = options.repository ?? predictionRepository;
  const now = options.now ?? new Date();

  let input: SubmitPredictionInput;
  try {
    input = submitPredictionSchema.parse(rawInput);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new PredictionServiceError("Validation failed", 400, error.flatten());
    }
    throw error;
  }

  const user = await getOrCreateUser(input.username);

  const match = await repository.findMatchById(input.matchId);
  if (!match) {
    throw new PredictionServiceError("Match not found", 404);
  }

  if (isGroupStageMatch(match.stage)) {
    throw new PredictionServiceError(
      "Group stage uses group advance picks, not per-match winners",
      400,
    );
  }

  assertMatchNotStarted(match.startTime, now);

  try {
    validatePredictedWinner(
      input.predictedWinner,
      match.homeTeam,
      match.awayTeam,
    );
  } catch (error) {
    if (error instanceof ZodError) {
      throw new PredictionServiceError(
        error.errors[0]?.message ?? "Invalid predicted winner",
        400,
        error.flatten(),
      );
    }
    throw error;
  }

  return repository.upsertPrediction({
    userId: user.id,
    matchId: input.matchId,
    predictedWinner: input.predictedWinner,
  });
}
