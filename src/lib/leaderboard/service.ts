import {
  isKnockoutRoundKey,
  type KnockoutRoundKey,
} from "@/lib/knockout-rounds";
import { isKnockoutStage } from "@/lib/match-utils";
import { resolveUserAvatarUrl } from "@/lib/avatar";
import type { LeaderboardEntry } from "@/types";
import { rankLeaderboard } from "./ranking";
import type { LeaderboardRepository } from "./repository";
import { leaderboardRepository } from "./repository";
import { calculateUserStats } from "./scoring";

function parseKnockoutRoundTeams(teamsJson: string): string[] {
  try {
    const parsed = JSON.parse(teamsJson) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((team): team is string => typeof team === "string")
      : [];
  } catch {
    return [];
  }
}

export type GetLeaderboardOptions = {
  repository?: LeaderboardRepository;
};

export async function getLeaderboard(
  options: GetLeaderboardOptions = {},
): Promise<LeaderboardEntry[]> {
  const repository = options.repository ?? leaderboardRepository;
  const [users, groupResults, knockoutRoundResults] = await Promise.all([
    repository.findUsersWithPicks(),
    repository.findGroupResults(),
    repository.findKnockoutRoundResults(),
  ]);

  const parsedKnockoutRoundResults = knockoutRoundResults.map((result) => ({
    round: result.round,
    teams: parseKnockoutRoundTeams(result.teams),
    finalized: result.finalized,
  }));

  const entries = users.map((user) => {
    const stats = calculateUserStats({
      groupPicks: user.groupAdvancePicks.map((pick) => ({
        groupKey: pick.groupKey,
        team: pick.team,
      })),
      thirdPlacePicks: user.thirdPlacePicks.map((pick) => ({
        team: pick.team,
      })),
      knockoutRoundPicks: user.knockoutRoundPicks
        .filter((pick): pick is typeof pick & { round: KnockoutRoundKey } =>
          isKnockoutRoundKey(pick.round),
        )
        .map((pick) => ({
          round: pick.round,
          team: pick.team,
        })),
      matchPredictions: user.predictions
        .filter((prediction) => isKnockoutStage(prediction.match.stage))
        .map((prediction) => ({
          predictedWinner: prediction.predictedWinner,
          match: prediction.match,
        })),
      groupResults,
      knockoutRoundResults: parsedKnockoutRoundResults,
    });

    return {
      userId: user.id,
      username: user.username,
      email: user.email,
      avatarUrl: resolveUserAvatarUrl(user.username, user.avatarUrl),
      ...stats,
    };
  });

  return rankLeaderboard(entries);
}
