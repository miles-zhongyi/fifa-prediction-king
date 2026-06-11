import { resolveUserAvatarUrl } from "@/lib/avatar";
import { handleApiError, jsonResponse } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get("matchId");

    if (!matchId) {
      return jsonResponse({ error: "matchId is required" }, 400);
    }

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) {
      return jsonResponse({ error: "Match not found" }, 404);
    }

    const predictions = await prisma.prediction.findMany({
      where: { matchId },
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const picksByTeam: Record<string, Array<{
      userId: string;
      username: string;
      avatarUrl: string;
    }>> = {
      [match.homeTeam]: [],
      [match.awayTeam]: [],
    };

    for (const prediction of predictions) {
      const voter = {
        userId: prediction.user.id,
        username: prediction.user.username,
        avatarUrl: resolveUserAvatarUrl(
          prediction.user.username,
          prediction.user.avatarUrl,
        ),
      };

      if (picksByTeam[prediction.predictedWinner]) {
        picksByTeam[prediction.predictedWinner].push(voter);
      }
    }

    return jsonResponse({
      matchId,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      picksByTeam,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
