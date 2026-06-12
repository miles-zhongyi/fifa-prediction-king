import type { Match } from "@/types";
import {
  formatTorontoDateHeading,
  formatTorontoDateTime,
  formatTorontoKickoffTime,
  getTorontoDateKey,
  hasTorontoMatchKickoffStarted,
  isBeforeTorontoMatchKickoff,
} from "@/lib/timezone";

export { isBeforeTorontoMatchKickoff, hasTorontoMatchKickoffStarted };

export type MatchLockStatus = "open" | "locked" | "live" | "finished";

export function getMatchLockStatus(
  match: Pick<Match, "status" | "startTime">,
  now: Date = new Date(),
): MatchLockStatus {
  if (match.status === "FINISHED") {
    return "finished";
  }

  if (match.status === "LIVE") {
    return "live";
  }

  if (hasTorontoMatchKickoffStarted(match.startTime, now)) {
    return "locked";
  }

  return "open";
}

export function isMatchOpenForPredictions(
  match: Pick<Match, "status" | "startTime">,
  now: Date = new Date(),
): boolean {
  return getMatchLockStatus(match, now) === "open";
}

export function formatMatchDateTime(startTime: string | Date): string {
  return formatTorontoDateTime(startTime);
}

export function formatMatchKickoffTime(startTime: string | Date): string {
  return formatTorontoKickoffTime(startTime);
}

export function formatMatchDateHeading(
  startTime: string | Date,
  now: Date = new Date(),
): string {
  const matchKey = getTorontoDateKey(startTime);
  const todayKey = getTorontoDateKey(now);

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = getTorontoDateKey(tomorrow);

  if (matchKey === todayKey) {
    return "Group stage · Today";
  }

  if (matchKey === tomorrowKey) {
    return "Group stage · Tomorrow";
  }

  return `Group stage · ${formatTorontoDateHeading(startTime)}`;
}

export function getLockStatusLabel(status: MatchLockStatus): string {
  switch (status) {
    case "open":
      return "Open";
    case "locked":
      return "Locked";
    case "live":
      return "Live";
    case "finished":
      return "Finished";
  }
}

export function getMatchStatusColor(status: MatchLockStatus): string {
  switch (status) {
    case "open":
      return "border-green-500/40 bg-green-500/10 text-green-300";
    case "locked":
      return "border-amber-500/40 bg-amber-500/10 text-amber-300";
    case "live":
      return "border-blue-500/40 bg-blue-500/10 text-blue-300";
    case "finished":
      return "border-slate-500/40 bg-slate-500/10 text-slate-300";
  }
}

export function isGroupStageMatch(stage: string): boolean {
  return /^group\s+[a-l]$/i.test(stage.trim());
}

export function parseGroupKeyFromStage(stage: string): string | null {
  const match = stage.trim().match(/^group\s+([a-l])$/i);
  return match ? match[1].toUpperCase() : null;
}

function normalizeStageKey(stage: string): string {
  return stage.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

export function isKnockoutStage(stage: string): boolean {
  const key = normalizeStageKey(stage);

  return (
    key === "roundof16" ||
    key === "r16" ||
    key === "roundof32" ||
    key === "r32" ||
    key === "quarterfinal" ||
    key === "semifinal" ||
    key === "final" ||
    key.includes("knockout") ||
    key.includes("roundof")
  );
}

export function filterKnockoutMatches<T extends Pick<Match, "stage">>(
  matches: T[],
): T[] {
  return matches.filter((match) => isKnockoutStage(match.stage));
}

export function getGroupSortKey(stage: string): string {
  const match = stage.trim().match(/^group\s+([a-l])$/i);
  return match ? match[1].toUpperCase() : stage;
}

export function filterUpcomingMatches<T extends Pick<Match, "status" | "startTime">>(
  matches: T[],
): T[] {
  return matches.filter(
    (match) =>
      match.status === "SCHEDULED" || match.status === "LIVE",
  );
}

export function filterOpenGroupStageMatches<
  T extends Pick<Match, "stage" | "status" | "startTime">,
>(matches: T[], now: Date = new Date()): T[] {
  return matches
    .filter(
      (match) =>
        isGroupStageMatch(match.stage) &&
        isMatchOpenForPredictions(match, now),
    )
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );
}

export function groupMatchesByDate<
  T extends Pick<Match, "startTime">,
>(matches: T[], now: Date = new Date()): { heading: string; matches: T[] }[] {
  const grouped = new Map<string, T[]>();

  for (const match of matches) {
    const key = getTorontoDateKey(match.startTime);
    const existing = grouped.get(key) ?? [];
    existing.push(match);
    grouped.set(key, existing);
  }

  return [...grouped.entries()]
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([, dayMatches]) => ({
      heading: formatMatchDateHeading(dayMatches[0].startTime, now),
      matches: dayMatches.sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      ),
    }));
}

export function groupMatchesByStage<
  T extends Pick<Match, "stage" | "status" | "startTime">,
>(matches: T[]): { stage: string; matches: T[] }[] {
  const grouped = new Map<string, T[]>();

  for (const match of matches) {
    const existing = grouped.get(match.stage) ?? [];
    existing.push(match);
    grouped.set(match.stage, existing);
  }

  return [...grouped.entries()]
    .sort(([stageA], [stageB]) =>
      getGroupSortKey(stageA).localeCompare(getGroupSortKey(stageB)),
    )
    .map(([stage, stageMatches]) => ({ stage, matches: stageMatches }));
}
