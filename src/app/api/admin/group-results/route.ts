import { requireAdmin } from "@/lib/admin/auth";
import { listGroupResults } from "@/lib/admin/group-results";
import { handleApiError, jsonResponse } from "@/lib/api";

export async function GET(request: Request) {
  try {
    requireAdmin(request);
    const results = await listGroupResults();
    return jsonResponse(results);
  } catch (error) {
    return handleApiError(error);
  }
}
