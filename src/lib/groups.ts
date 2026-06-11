import { WORLD_CUP_2026_GROUP_FIXTURES } from "../../prisma/world-cup-2026-fixtures";

export const GROUP_KEYS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
] as const;

export type GroupKey = (typeof GROUP_KEYS)[number];

export const MAX_GROUP_ADVANCERS = 2;
export const MAX_THIRD_PLACE_PICKS = 8;

const teamsByGroup = new Map<GroupKey, string[]>();

for (const fixture of WORLD_CUP_2026_GROUP_FIXTURES) {
  const groupKey = parseGroupKey(fixture.stage);
  if (!groupKey) {
    continue;
  }

  const teams = teamsByGroup.get(groupKey) ?? [];
  if (!teams.includes(fixture.homeTeam)) {
    teams.push(fixture.homeTeam);
  }
  if (!teams.includes(fixture.awayTeam)) {
    teams.push(fixture.awayTeam);
  }
  teamsByGroup.set(groupKey, teams);
}

export function parseGroupKey(stage: string): GroupKey | null {
  const match = stage.trim().match(/^group\s+([a-l])$/i);
  if (!match) {
    return null;
  }

  const key = match[1].toUpperCase() as GroupKey;
  return GROUP_KEYS.includes(key) ? key : null;
}

export function isValidGroupKey(value: string): value is GroupKey {
  return GROUP_KEYS.includes(value.toUpperCase() as GroupKey);
}

export function normalizeGroupKey(value: string): GroupKey {
  const key = value.trim().toUpperCase();
  if (!isValidGroupKey(key)) {
    throw new Error("Invalid group");
  }

  return key;
}

export function getTeamsInGroup(groupKey: GroupKey): string[] {
  return [...(teamsByGroup.get(groupKey) ?? [])];
}

export function getAllGroupTeams(): string[] {
  return GROUP_KEYS.flatMap((groupKey) => getTeamsInGroup(groupKey));
}

export function isTeamInGroup(team: string, groupKey: GroupKey): boolean {
  return getTeamsInGroup(groupKey).includes(team);
}

export function getGroupRosters(): Array<{ groupKey: GroupKey; teams: string[] }> {
  return GROUP_KEYS.map((groupKey) => ({
    groupKey,
    teams: getTeamsInGroup(groupKey),
  }));
}

export function getGroupStageLabel(groupKey: GroupKey): string {
  return `Group ${groupKey}`;
}
