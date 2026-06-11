import { handleApiError, jsonResponse } from "@/lib/api";
import {
  getThirdPlaceBoard,
  getUserThirdPlacePicks,
  toggleThirdPlacePick,
} from "@/lib/third-place-picks/service";
import { schedulePersistGameData } from "@/lib/persistence/schedule-persist";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    if (username) {
      const picks = await getUserThirdPlacePicks(username);
      return jsonResponse(picks);
    }

    const board = await getThirdPlaceBoard();
    return jsonResponse(board);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await toggleThirdPlacePick(body);
    schedulePersistGameData();
    return jsonResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
