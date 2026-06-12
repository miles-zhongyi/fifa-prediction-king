import { MatchStatus, type GroupResult } from "@prisma/client";
import { resolveUserAvatarUrl } from "@/lib/avatar";
import { normalizeGroupKey, type GroupKey } from "@/lib/groups";
import { parseGroupKeyFromStage } from "@/lib/match-utils";
import { prisma } from "@/lib/prisma";

export type AdvanceVoterOutcome =
  | "correct"
  | "incorrect"
  | "match_won"
  | "match_lost"
  | "pending";

export type AdvanceVoter = {
  userId: string;
  username: string;
  avatarUrl: string;
  outcome: AdvanceVoterOutcome;
};

export type TeamAdvanceVoters = {
  team: string;
  voters: AdvanceVoter[];
};

type MatchContext = {
  homeTeam: string;
  awayTeam: string;
  status: MatchStatus;
  winner: string | null;
};

function getTeamOutcome(
  team: string,
  groupResult: GroupResult | null,
  match: MatchContext,
): AdvanceVoterOutcome {
  if (groupResult?.finalized) {
    const advancers = [groupResult.advancer1, groupResult.advancer2].filter(
      (entry): entry is string => Boolean(entry),
    );

    return advancers.includes(team) ? "correct" : "incorrect";
  }

  if (match.status === MatchStatus.FINISHED && match.winner) {
    const teamPlayed =
      match.homeTeam === team || match.awayTeam === team;
    if (teamPlayed) {
      return match.winner === team ? "match_won" : "match_lost";
    }
  }

  return "pending";
}

export async function getAdvanceVotersForMatches(
  matches: Array<{
    id: string;
    stage: string;
    homeTeam: string;
    awayTeam: string;
    status: MatchStatus;
    winner: string | null;
  }>,
): Promise<Map<string, { home: TeamAdvanceVoters; away: TeamAdvanceVoters }>> {
  const result = new Map<
    string,
    { home: TeamAdvanceVoters; away: TeamAdvanceVoters }
  >();

  const groupKeys = [
    ...new Set(
      matches
        .map((match) => parseGroupKeyFromStage(match.stage))
        .map((key) => (key ? normalizeGroupKey(key) : null))
        .filter((key): key is GroupKey => Boolean(key)),
    ),
  ];

  const groupResults = groupKeys.length
    ? await prisma.groupResult.findMany({
        where: { groupKey: { in: groupKeys } },
      })
    : [];

  const resultsByGroup = new Map(
    groupResults.map((entry) => [entry.groupKey, entry]),
  );

  const picks = groupKeys.length
    ? await prisma.groupAdvancePick.findMany({
        where: { groupKey: { in: groupKeys } },
        include: {
          user: {
            select: { id: true, username: true, avatarUrl: true },
          },
        },
      })
    : [];

  const picksByGroupTeam = new Map<string, typeof picks>();
  for (const pick of picks) {
    const key = `${pick.groupKey}:${pick.team}`;
    const existing = picksByGroupTeam.get(key) ?? [];
    existing.push(pick);
    picksByGroupTeam.set(key, existing);
  }

  for (const match of matches) {
    const parsedGroupKey = parseGroupKeyFromStage(match.stage);
    if (!parsedGroupKey) {
      continue;
    }

    const groupKey = normalizeGroupKey(parsedGroupKey);
    const groupResult = resultsByGroup.get(groupKey) ?? null;
    const matchContext: MatchContext = {
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      status: match.status,
      winner: match.winner,
    };

    const buildVoters = (team: string): TeamAdvanceVoters => ({
      team,
      voters: (picksByGroupTeam.get(`${groupKey}:${team}`) ?? []).map(
        (pick) => ({
          userId: pick.user.id,
          username: pick.user.username,
          avatarUrl: resolveUserAvatarUrl(
            pick.user.username,
            pick.user.avatarUrl,
          ),
          outcome: getTeamOutcome(team, groupResult, matchContext),
        }),
      ),
    });

    result.set(match.id, {
      home: buildVoters(match.homeTeam),
      away: buildVoters(match.awayTeam),
    });
  }

  return result;
}
