import { MatchStatus, type Match } from "@prisma/client";
import type { GroupKey } from "@/lib/groups";
import { getTeamsInGroup } from "@/lib/groups";

type TeamStats = {
  team: string;
  points: number;
  goalDifference: number;
  goalsFor: number;
};

function buildEmptyStats(teams: string[]): Map<string, TeamStats> {
  return new Map(
    teams.map((team) => [
      team,
      { team, points: 0, goalDifference: 0, goalsFor: 0 },
    ]),
  );
}

export function computeGroupStandings(
  teams: string[],
  matches: Pick<
    Match,
    "homeTeam" | "awayTeam" | "homeScore" | "awayScore" | "status"
  >[],
): TeamStats[] {
  const stats = buildEmptyStats(teams);

  for (const match of matches) {
    if (match.status !== MatchStatus.FINISHED) {
      continue;
    }

    if (match.homeScore === null || match.awayScore === null) {
      continue;
    }

    const home = stats.get(match.homeTeam);
    const away = stats.get(match.awayTeam);
    if (!home || !away) {
      continue;
    }

    home.goalsFor += match.homeScore;
    away.goalsFor += match.awayScore;
    home.goalDifference += match.homeScore - match.awayScore;
    away.goalDifference += match.awayScore - match.homeScore;

    if (match.homeScore > match.awayScore) {
      home.points += 3;
    } else if (match.awayScore > match.homeScore) {
      away.points += 3;
    } else {
      home.points += 1;
      away.points += 1;
    }
  }

  return [...stats.values()].sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }

    if (b.goalDifference !== a.goalDifference) {
      return b.goalDifference - a.goalDifference;
    }

    if (b.goalsFor !== a.goalsFor) {
      return b.goalsFor - a.goalsFor;
    }

    return a.team.localeCompare(b.team);
  });
}

export function isGroupStageComplete(
  teams: string[],
  matches: Pick<Match, "status">[],
): boolean {
  const expectedMatches = (teams.length * (teams.length - 1)) / 2;
  const finished = matches.filter(
    (match) => match.status === MatchStatus.FINISHED,
  ).length;

  return finished >= expectedMatches;
}

export function deriveGroupResult(
  groupKey: GroupKey,
  matches: Pick<
    Match,
    "homeTeam" | "awayTeam" | "homeScore" | "awayScore" | "status"
  >[],
) {
  const teams = getTeamsInGroup(groupKey);
  if (!isGroupStageComplete(teams, matches)) {
    return null;
  }

  const standings = computeGroupStandings(teams, matches);
  if (standings.length < 3) {
    return null;
  }

  return {
    advancer1: standings[0]?.team ?? null,
    advancer2: standings[1]?.team ?? null,
    thirdPlaceTeam: standings[2]?.team ?? null,
    thirdAdvances: false,
    finalized: true,
  };
}
