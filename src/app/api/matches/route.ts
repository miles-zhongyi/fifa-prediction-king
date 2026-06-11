import { handleApiError, jsonResponse } from "@/lib/api";
import {
  attachCorrectPredictors,
  getCorrectPredictorsByMatchId,
} from "@/lib/matches/enrichment";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
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

    return jsonResponse(
      attachCorrectPredictors(matches, predictorsByMatchId),
    );
  } catch (error) {
    return handleApiError(error);
  }
}
