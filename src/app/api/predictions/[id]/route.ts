import { ZodError } from "zod";
import { errorResponse, handleApiError, jsonResponse } from "@/lib/api";
import {
  assertMatchNotStarted,
  predictionRepository,
  validatePredictedWinner,
} from "@/lib/predictions";
import { PredictionServiceError } from "@/lib/predictions/errors";
import { submitPredictionSchema } from "@/lib/predictions/validation";
import { prisma } from "@/lib/prisma";
import { findUserByUsername } from "@/lib/users";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const input = submitPredictionSchema
      .pick({ username: true, predictedWinner: true })
      .parse(body);

    const user = await findUserByUsername(input.username);
    if (!user) {
      throw new PredictionServiceError("User not found", 404);
    }

    const existingPrediction = await predictionRepository.findPredictionById(id);
    if (!existingPrediction) {
      throw new PredictionServiceError("Prediction not found", 404);
    }

    if (existingPrediction.userId !== user.id) {
      throw new PredictionServiceError(
        "You can only update your own predictions",
        403,
      );
    }

    assertMatchNotStarted(existingPrediction.match.startTime, new Date());

    try {
      validatePredictedWinner(
        input.predictedWinner,
        existingPrediction.match.homeTeam,
        existingPrediction.match.awayTeam,
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

    const prediction = await predictionRepository.updatePredictionById(
      id,
      input.predictedWinner,
    );

    return jsonResponse(prediction);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    if (!username) {
      return errorResponse("Username query parameter is required", 400);
    }

    const user = await findUserByUsername(username);
    if (!user) {
      throw new PredictionServiceError("User not found", 404);
    }

    const existingPrediction = await predictionRepository.findPredictionById(id);
    if (!existingPrediction) {
      throw new PredictionServiceError("Prediction not found", 404);
    }

    if (existingPrediction.userId !== user.id) {
      throw new PredictionServiceError(
        "You can only delete your own predictions",
        403,
      );
    }

    assertMatchNotStarted(existingPrediction.match.startTime, new Date());

    await prisma.prediction.delete({ where: { id } });

    return jsonResponse({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
