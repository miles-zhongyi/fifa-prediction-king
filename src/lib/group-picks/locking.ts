import type { GroupKey } from "@/lib/groups";
import { isGroupAndThirdPlaceLocked } from "@/lib/picks-lock";
import { prisma } from "@/lib/prisma";
import { isKnockoutStage } from "@/lib/match-utils";
import { hasTorontoMatchKickoffStarted } from "@/lib/timezone";

export async function isGroupLocked(_groupKey: GroupKey, now = new Date()) {
  return isGroupAndThirdPlaceLocked(now);
}

export async function isThirdPlaceLocked(now = new Date()) {
  return isGroupAndThirdPlaceLocked(now);
}

export async function isKnockoutPickLocked(
  matchStage: string,
  matchStartTime: Date,
  now = new Date(),
) {
  if (!isKnockoutStage(matchStage)) {
    return true;
  }

  return hasTorontoMatchKickoffStarted(matchStartTime, now);
}

export async function getGlobalKnockoutLockSummary(now = new Date()) {
  const firstKnockout = await prisma.match.findFirst({
    where: {
      NOT: {
        stage: { startsWith: "Group" },
      },
    },
    orderBy: { startTime: "asc" },
  });

  return {
    thirdPlaceLocked: isGroupAndThirdPlaceLocked(now),
    firstKnockoutAt: firstKnockout?.startTime ?? null,
  };
}
