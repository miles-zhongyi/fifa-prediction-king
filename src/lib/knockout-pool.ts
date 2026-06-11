import { MAX_GROUP_ADVANCERS, MAX_THIRD_PLACE_PICKS, GROUP_KEYS } from "@/lib/groups";
import { prisma } from "@/lib/prisma";

export const REQUIRED_GROUP_PICKS = GROUP_KEYS.length * MAX_GROUP_ADVANCERS;
export const REQUIRED_THIRD_PLACE_PICKS = MAX_THIRD_PLACE_PICKS;

export async function getUserAdvancingPool(userId: string): Promise<string[]> {
  const [groupPicks, thirdPlacePicks] = await Promise.all([
    prisma.groupAdvancePick.findMany({
      where: { userId },
      select: { team: true },
    }),
    prisma.thirdPlacePick.findMany({
      where: { userId },
      select: { team: true },
    }),
  ]);

  return [...groupPicks, ...thirdPlacePicks].map((pick) => pick.team);
}

export async function isAdvancingPoolComplete(userId: string): Promise<boolean> {
  const [groupCount, thirdPlaceCount] = await Promise.all([
    prisma.groupAdvancePick.count({ where: { userId } }),
    prisma.thirdPlacePick.count({ where: { userId } }),
  ]);

  return (
    groupCount === REQUIRED_GROUP_PICKS &&
    thirdPlaceCount === REQUIRED_THIRD_PLACE_PICKS
  );
}

export async function removeKnockoutPicksForTeams(
  userId: string,
  teams: string[],
): Promise<void> {
  if (teams.length === 0) {
    return;
  }

  await prisma.knockoutRoundPick.deleteMany({
    where: {
      userId,
      team: { in: teams },
    },
  });
}
