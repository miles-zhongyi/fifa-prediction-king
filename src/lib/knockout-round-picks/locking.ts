import { isKnockoutStage } from "@/lib/match-utils";
import { prisma } from "@/lib/prisma";
import { hasTorontoMatchKickoffStarted } from "@/lib/timezone";

export async function isKnockoutRoundsLocked(now = new Date()): Promise<boolean> {
  const firstKnockout = await prisma.match.findFirst({
    where: {
      NOT: {
        stage: { startsWith: "Group" },
      },
    },
    orderBy: { startTime: "asc" },
  });

  if (!firstKnockout || !isKnockoutStage(firstKnockout.stage)) {
    return false;
  }

  return hasTorontoMatchKickoffStarted(firstKnockout.startTime, now);
}
