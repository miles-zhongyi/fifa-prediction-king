import { handleApiError, jsonResponse } from "@/lib/api";
import {
  getKnockoutRoundPickBoard,
  getUserKnockoutRoundPicks,
  toggleKnockoutRoundPick,
} from "@/lib/knockout-round-picks/service";
import { schedulePersistGameData } from "@/lib/persistence/schedule-persist";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    if (username) {
      const picks = await getUserKnockoutRoundPicks(username);
      return jsonResponse(picks);
    }

    const board = await getKnockoutRoundPickBoard();
    return jsonResponse(board);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await toggleKnockoutRoundPick(body);
    schedulePersistGameData();
    return jsonResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
