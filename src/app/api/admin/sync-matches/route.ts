import { handleApiError, jsonResponse } from "@/lib/api";
import { requireAdmin } from "@/lib/admin/auth";
import { syncMatchResultsFromApi } from "@/lib/match-sync/service";

export async function POST(request: Request) {
  try {
    requireAdmin(request);
    const result = await syncMatchResultsFromApi({ force: true });
    return jsonResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
