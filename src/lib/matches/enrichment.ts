import { MatchStatus } from "@prisma/client";
import { resolveUserAvatarUrl } from "@/lib/avatar";
import { prisma } from "@/lib/prisma";
import type { MatchCorrectPredictor } from "@/types";

export async function getCorrectPredictorsByMatchId(
  matchIds: string[],
): Promise<Map<string, MatchCorrectPredictor[]>> {
  const result = new Map<string, MatchCorrectPredictor[]>();

  if (matchIds.length === 0) {
    return result;
  }

  const finishedMatches = await prisma.match.findMany({
    where: {
      id: { in: matchIds },
      status: MatchStatus.FINISHED,
      winner: { not: null },
    },
    select: {
      id: true,
      winner: true,
      predictions: {
        select: {
          predictedWinner: true,
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  for (const match of finishedMatches) {
    const correct = match.predictions
      .filter((prediction) => prediction.predictedWinner === match.winner)
      .map((prediction) => ({
        userId: prediction.user.id,
        username: prediction.user.username,
        avatarUrl: resolveUserAvatarUrl(
          prediction.user.username,
          prediction.user.avatarUrl,
        ),
      }));

    result.set(match.id, correct);
  }

  return result;
}

export function attachCorrectPredictors<T extends { id: string }>(
  matches: T[],
  predictorsByMatchId: Map<string, MatchCorrectPredictor[]>,
): Array<T & { correctPredictors: MatchCorrectPredictor[] }> {
  return matches.map((match) => ({
    ...match,
    correctPredictors: predictorsByMatchId.get(match.id) ?? [],
  }));
}
