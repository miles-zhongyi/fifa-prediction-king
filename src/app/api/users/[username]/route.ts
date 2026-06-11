import { handleApiError, jsonResponse } from "@/lib/api";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ username: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { username } = await context.params;

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        predictions: {
          include: {
            match: true,
          },
          orderBy: {
            match: { startTime: "asc" },
          },
        },
      },
    });

    if (!user) {
      return jsonResponse({ error: "User not found" }, 404);
    }

    return jsonResponse(user);
  } catch (error) {
    return handleApiError(error);
  }
}
