import { MatchStatus } from "@prisma/client";
import { fetchWorldCupMatches } from "@/lib/football-data/client";
import { GROUP_KEYS } from "@/lib/groups";
import { schedulePersistGameData } from "@/lib/persistence/schedule-persist";
import { prisma } from "@/lib/prisma";
import { deriveGroupResult } from "@/lib/standings/group-standings";

const SYNC_INTERVAL_MS = 5 * 60 * 1000;
let lastSyncAt = 0;
let syncInFlight: Promise<{ updated: number }> | null = null;

function teamsMatch(
  homeA: string,
  awayA: string,
  homeB: string,
  awayB: string,
): boolean {
  return (
    (homeA === homeB && awayA === awayB) ||
    (homeA === awayB && awayA === homeB)
  );
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

function findMatchingExternalMatch(
  match: { homeTeam: string; awayTeam: string; startTime: Date },
  externalMatches: Awaited<ReturnType<typeof fetchWorldCupMatches>>,
) {
  return externalMatches.find(
    (external) =>
      teamsMatch(
        match.homeTeam,
        match.awayTeam,
        external.homeTeam,
        external.awayTeam,
      ) && isSameDay(match.startTime, external.utcDate),
  );
}

async function applyExternalResults(): Promise<{ updated: number }> {
  const externalMatches = await fetchWorldCupMatches();
  if (externalMatches.length === 0) {
    return { updated: 0 };
  }

  const dbMatches = await prisma.match.findMany({
    orderBy: { startTime: "asc" },
  });

  let updated = 0;

  for (const match of dbMatches) {
    const external = findMatchingExternalMatch(match, externalMatches);
    if (!external) {
      continue;
    }

    const nextStatus =
      external.status === "FINISHED"
        ? MatchStatus.FINISHED
        : external.status === "LIVE"
          ? MatchStatus.LIVE
          : MatchStatus.SCHEDULED;

    const hasChanges =
      match.status !== nextStatus ||
      match.homeScore !== external.homeScore ||
      match.awayScore !== external.awayScore ||
      match.winner !== external.winner;

    if (!hasChanges) {
      continue;
    }

    await prisma.match.update({
      where: { id: match.id },
      data: {
        status: nextStatus,
        homeScore: external.homeScore,
        awayScore: external.awayScore,
        winner: external.winner,
      },
    });

    updated += 1;
  }

  for (const groupKey of GROUP_KEYS) {
    const stage = `Group ${groupKey}`;
    const groupMatches = await prisma.match.findMany({
      where: { stage },
    });

    const derived = deriveGroupResult(groupKey, groupMatches);
    if (!derived) {
      continue;
    }

    await prisma.groupResult.upsert({
      where: { groupKey },
      create: {
        groupKey,
        ...derived,
      },
      update: derived,
    });
  }

  if (updated > 0) {
    schedulePersistGameData();
  }

  return { updated };
}

export async function syncMatchResultsFromApi(options?: {
  force?: boolean;
}): Promise<{ updated: number; skipped?: boolean }> {
  if (!process.env.FOOTBALL_DATA_API_KEY) {
    return { updated: 0, skipped: true };
  }

  const force = options?.force ?? false;
  const now = Date.now();

  if (!force && now - lastSyncAt < SYNC_INTERVAL_MS) {
    return { updated: 0, skipped: true };
  }

  if (syncInFlight) {
    return syncInFlight.then(() => ({ updated: 0, skipped: true }));
  }

  syncInFlight = applyExternalResults().then((result) => {
    lastSyncAt = Date.now();
    return result;
  }).finally(() => {
    syncInFlight = null;
  });

  const result = await syncInFlight;
  return result;
}
