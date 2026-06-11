import { prisma } from "@/lib/prisma";

export async function findUserByUsername(username: string) {
  return prisma.user.findUnique({
    where: { username },
  });
}

export async function getOrCreateUser(username: string) {
  const user = await findUserByUsername(username);
  if (!user) {
    throw new Error("User not found");
  }
  return user;
}
