import { handleApiError, jsonResponse } from "@/lib/api";
import {
  getAllGroupBoards,
  getUserGroupPicks,
  toggleGroupAdvancePick,
} from "@/lib/group-picks/service";
import { schedulePersistGameData } from "@/lib/persistence/schedule-persist";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    if (username) {
      const picks = await getUserGroupPicks(username);
      return jsonResponse(picks);
    }

    const boards = await getAllGroupBoards();
    return jsonResponse(boards);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await toggleGroupAdvancePick(body);
    schedulePersistGameData();
    return jsonResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
