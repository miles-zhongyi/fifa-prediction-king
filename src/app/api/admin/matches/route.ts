import { handleApiError, jsonResponse } from "@/lib/api";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminMatch, listAdminMatches } from "@/lib/admin/matches";

export async function GET(request: Request) {
  try {
    requireAdmin(request);
    const matches = await listAdminMatches();
    return jsonResponse(matches);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    requireAdmin(request);
    const body = await request.json();
    const match = await createAdminMatch(body);
    return jsonResponse(match, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
