import { resolveUserAvatarUrl } from "@/lib/avatar";
import { handleApiError, jsonResponse } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { MatchStatus } from "@prisma/client";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        predictions: {
          include: {
            user: {
              select: { id: true, username: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!match) {
      return jsonResponse({ error: "Match not found" }, 404);
    }

    const correctPredictors =
      match.status === MatchStatus.FINISHED && match.winner
        ? match.predictions
            .filter(
              (prediction) => prediction.predictedWinner === match.winner,
            )
            .map((prediction) => ({
              userId: prediction.user.id,
              username: prediction.user.username,
              avatarUrl: resolveUserAvatarUrl(
                prediction.user.username,
                prediction.user.avatarUrl,
              ),
            }))
        : [];

    return jsonResponse({
      ...match,
      correctPredictors,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
