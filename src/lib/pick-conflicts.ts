import { prisma } from "@/lib/prisma";

export async function getUserGroupAdvanceTeams(userId: string): Promise<Set<string>> {
  const picks = await prisma.groupAdvancePick.findMany({
    where: { userId },
    select: { team: true },
  });

  return new Set(picks.map((pick) => pick.team));
}

export async function getUserThirdPlaceTeams(userId: string): Promise<Set<string>> {
  const picks = await prisma.thirdPlacePick.findMany({
    where: { userId },
    select: { team: true },
  });

  return new Set(picks.map((pick) => pick.team));
}
