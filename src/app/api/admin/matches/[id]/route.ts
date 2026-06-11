import { handleApiError, jsonResponse } from "@/lib/api";
import { requireAdmin } from "@/lib/admin/auth";
import { updateAdminMatch } from "@/lib/admin/matches";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    requireAdmin(request);
    const { id } = await context.params;

    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        _count: {
          select: { predictions: true },
        },
      },
    });

    if (!match) {
      return jsonResponse({ error: "Match not found" }, 404);
    }

    return jsonResponse(match);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    requireAdmin(request);
    const { id } = await context.params;
    const body = await request.json();
    const match = await updateAdminMatch(id, body);
    return jsonResponse(match);
  } catch (error) {
    return handleApiError(error);
  }
}
