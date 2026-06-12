import { handleApiError, jsonResponse } from "@/lib/api";
import { getAdvanceVotersForMatches } from "@/lib/matches/advance-voters";
import {
  attachCorrectPredictors,
  getCorrectPredictorsByMatchId,
} from "@/lib/matches/enrichment";
import { isGroupStageMatch } from "@/lib/match-utils";
import { syncMatchResultsFromApi } from "@/lib/match-sync/service";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    await syncMatchResultsFromApi();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const matches = await prisma.match.findMany({
      where: status ? { status: status as never } : undefined,
      orderBy: { startTime: "asc" },
      include: {
        _count: {
          select: { predictions: true },
        },
      },
    });

    const predictorsByMatchId = await getCorrectPredictorsByMatchId(
      matches.map((match) => match.id),
    );

    const groupMatches = matches.filter((match) =>
      isGroupStageMatch(match.stage),
    );
    const advanceVotersByMatchId = await getAdvanceVotersForMatches(
      groupMatches.map((match) => ({
        id: match.id,
        stage: match.stage,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
      })),
    );

    const enriched = attachCorrectPredictors(matches, predictorsByMatchId).map(
      (match) => {
        const advanceVoters = advanceVotersByMatchId.get(match.id);
        return advanceVoters ? { ...match, advanceVoters } : match;
      },
    );

    return jsonResponse(enriched);
  } catch (error) {
    return handleApiError(error);
  }
}
