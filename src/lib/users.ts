import { prisma } from "@/lib/prisma";

export class UserNotFoundError extends Error {
  readonly statusCode = 404;

  constructor(username: string) {
    super(`User not found: ${username}`);
    this.name = "UserNotFoundError";
  }
}

export function isUserNotFoundError(error: unknown): error is UserNotFoundError {
  return error instanceof UserNotFoundError;
}

export async function findUserByUsername(username: string) {
  return prisma.user.findUnique({
    where: { username },
  });
}

export async function getOrCreateUser(username: string) {
  const user = await findUserByUsername(username);
  if (!user) {
    throw new UserNotFoundError(username);
  }
  return user;
}
