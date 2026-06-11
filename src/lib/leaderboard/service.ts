import { isKnockoutStage } from "@/lib/match-utils";
import { resolveUserAvatarUrl } from "@/lib/avatar";
import type { LeaderboardEntry } from "@/types";
import { rankLeaderboard } from "./ranking";
import type { LeaderboardRepository } from "./repository";
import { leaderboardRepository } from "./repository";
import { calculateUserStats } from "./scoring";

export type GetLeaderboardOptions = {
  repository?: LeaderboardRepository;
};

export async function getLeaderboard(
  options: GetLeaderboardOptions = {},
): Promise<LeaderboardEntry[]> {
  const repository = options.repository ?? leaderboardRepository;
  const [users, groupResults] = await Promise.all([
    repository.findUsersWithPicks(),
    repository.findGroupResults(),
  ]);

  const entries = users.map((user) => {
    const stats = calculateUserStats({
      groupPicks: user.groupAdvancePicks.map((pick) => ({
        groupKey: pick.groupKey,
        team: pick.team,
      })),
      thirdPlacePicks: user.thirdPlacePicks.map((pick) => ({
        team: pick.team,
      })),
      matchPredictions: user.predictions
        .filter((prediction) => isKnockoutStage(prediction.match.stage))
        .map((prediction) => ({
          predictedWinner: prediction.predictedWinner,
          match: prediction.match,
        })),
      groupResults,
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
