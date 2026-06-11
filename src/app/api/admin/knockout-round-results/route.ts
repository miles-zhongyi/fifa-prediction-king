import { handleApiError, jsonResponse } from "@/lib/api";
import { requireAdmin } from "@/lib/admin/auth";
import { listKnockoutRoundResults } from "@/lib/admin/knockout-round-results";

export async function GET(request: Request) {
  try {
    requireAdmin(request);
    const results = await listKnockoutRoundResults();
    return jsonResponse(results);
  } catch (error) {
    return handleApiError(error);
  }
}
