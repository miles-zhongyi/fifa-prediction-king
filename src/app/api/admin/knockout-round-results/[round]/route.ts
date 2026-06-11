import { handleApiError, jsonResponse } from "@/lib/api";
import { requireAdmin } from "@/lib/admin/auth";
import { updateKnockoutRoundResult } from "@/lib/admin/knockout-round-results";

type RouteContext = {
  params: Promise<{ round: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    requireAdmin(request);
    const { round } = await context.params;
    const body = await request.json();
    const result = await updateKnockoutRoundResult(round, body);
    return jsonResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
