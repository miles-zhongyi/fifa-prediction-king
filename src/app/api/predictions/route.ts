import { handleApiError, jsonResponse } from "@/lib/api";
import { schedulePersistGameData } from "@/lib/persistence/schedule-persist";
import { submitPrediction } from "@/lib/predictions";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");
    const matchId = searchParams.get("matchId");

    const predictions = await prisma.prediction.findMany({
      where: {
        ...(username ? { user: { username } } : {}),
        ...(matchId ? { matchId } : {}),
      },
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true },
        },
        match: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return jsonResponse(predictions);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prediction = await submitPrediction(body);
    schedulePersistGameData();
    return jsonResponse(prediction, 200);
  } catch (error) {
    return handleApiError(error);
  }
}
