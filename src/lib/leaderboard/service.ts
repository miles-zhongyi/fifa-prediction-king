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
  const users = await repository.findUsersWithPredictions();

  const entries = users.map((user) => {
    const stats = calculateUserStats(user.predictions);

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
