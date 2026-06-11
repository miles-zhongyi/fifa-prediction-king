import { requireAdmin } from "@/lib/admin/auth";
import { updateGroupResult } from "@/lib/admin/group-results";
import { handleApiError, jsonResponse } from "@/lib/api";

type RouteContext = {
  params: Promise<{ groupKey: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    requireAdmin(request);
    const { groupKey } = await context.params;
    const body = await request.json();
    const result = await updateGroupResult(groupKey, body);
    return jsonResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
