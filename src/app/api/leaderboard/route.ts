import { handleApiError, jsonResponse } from "@/lib/api";
import { getLeaderboard } from "@/lib/leaderboard/service";

export async function GET() {
  try {
    const leaderboard = await getLeaderboard();
    return jsonResponse(leaderboard);
  } catch (error) {
    return handleApiError(error);
  }
}
