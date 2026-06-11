import { handleApiError, jsonResponse } from "@/lib/api";
import { requireAdmin } from "@/lib/admin/auth";
import { completeAdminMatch } from "@/lib/admin/matches";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    requireAdmin(request);
    const { id } = await context.params;
    const body = await request.json();
    const match = await completeAdminMatch(id, body);
    return jsonResponse(match);
  } catch (error) {
    return handleApiError(error);
  }
}
