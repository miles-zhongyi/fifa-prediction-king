import { buildGeneratedAvatarPath } from "@/lib/avatar";
import { errorResponse, handleApiError, jsonResponse } from "@/lib/api";
import { schedulePersistGameData } from "@/lib/persistence/schedule-persist";
import { prisma } from "@/lib/prisma";
import { createUserSchema, parseCreateUserInput } from "@/lib/validations";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { username: "asc" },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
        _count: {
          select: { predictions: true },
        },
      },
    });

    return jsonResponse(users);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createUserSchema.parse(body);
    const data = parseCreateUserInput(parsed);

    const existingUser = await prisma.user.findUnique({
      where: { username: data.username },
    });

    if (existingUser) {
      if (existingUser.email !== data.email) {
        const emailTaken = await prisma.user.findUnique({
          where: { email: data.email },
        });

        if (emailTaken && emailTaken.id !== existingUser.id) {
          return errorResponse("Email already in use", 409);
        }

        const updated = await prisma.user.update({
          where: { username: data.username },
          data: { email: data.email },
        });

        schedulePersistGameData();
        return jsonResponse(updated);
      }

      return jsonResponse(existingUser);
    }

    const emailTaken = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (emailTaken) {
      return errorResponse("Email already in use", 409);
    }

    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        avatarUrl: buildGeneratedAvatarPath(data.username),
      },
    });

    schedulePersistGameData();
    return jsonResponse(user, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
