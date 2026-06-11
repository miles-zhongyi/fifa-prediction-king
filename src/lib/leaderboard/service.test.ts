import { MatchStatus, type Match, type Prediction } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import type { LeaderboardRepository, UserWithPredictions } from "./repository";
import { getLeaderboard } from "./service";

function createUser(
  username: string,
  predictions: Array<{
    stage: string;
    predictedWinner: string;
    winner: string | null;
    status?: MatchStatus;
  }>,
): UserWithPredictions {
  return {
    id: `user-${username}`,
    username,
    email: `${username}@dodonadata.ai`,
    avatarUrl: `/api/avatar/${username}`,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    predictions: predictions.map((prediction, index) => {
      const match: Match = {
        id: `match-${username}-${index}`,
        homeTeam: "A",
        awayTeam: "B",
        stage: prediction.stage,
        startTime: new Date("2026-06-01T00:00:00.000Z"),
        winner: prediction.winner,
        status: prediction.status ?? MatchStatus.FINISHED,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      };

      const record: Prediction & { match: Match } = {
        id: `prediction-${username}-${index}`,
        userId: `user-${username}`,
        matchId: match.id,
        predictedWinner: prediction.predictedWinner,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        match,
      };

      return record;
    }),
  };
}

describe("getLeaderboard", () => {
  it("computes scores from database records without storing totals", async () => {
    const repository: LeaderboardRepository = {
      findUsersWithPredictions: vi.fn().mockResolvedValue([
        createUser("alice", [
          {
            stage: "Group A",
            predictedWinner: "Brazil",
            winner: "Brazil",
          },
          {
            stage: "Final",
            predictedWinner: "France",
            winner: "France",
          },
        ]),
        createUser("bob", [
          {
            stage: "Quarter Final",
            predictedWinner: "Spain",
            winner: "Spain",
          },
          {
            stage: "Group B",
            predictedWinner: "Germany",
            winner: "France",
          },
        ]),
      ] satisfies UserWithPredictions[]),
    };

    const leaderboard = await getLeaderboard({ repository });

    expect(leaderboard).toEqual([
      {
        userId: "user-alice",
        username: "alice",
        email: "alice@dodonadata.ai",
        avatarUrl: "/api/avatar/alice",
        totalPredictions: 2,
        correctPredictions: 2,
        points: 1.5,
        rank: 1,
      },
      {
        userId: "user-bob",
        username: "bob",
        email: "bob@dodonadata.ai",
        avatarUrl: "/api/avatar/bob",
        totalPredictions: 2,
        correctPredictions: 1,
        points: 0.5,
        rank: 2,
      },
    ]);
  });

  it("includes users with zero points and handles ties", async () => {
    const repository: LeaderboardRepository = {
      findUsersWithPredictions: vi.fn().mockResolvedValue([
        createUser("amy", [
          {
            stage: "Semi Final",
            predictedWinner: "A",
            winner: "A",
          },
        ]),
        createUser("zoe", [
          {
            stage: "Semi Final",
            predictedWinner: "B",
            winner: "B",
          },
        ]),
        createUser("mia", []),
      ] satisfies UserWithPredictions[]),
    };

    const leaderboard = await getLeaderboard({ repository });

    expect(leaderboard).toEqual([
      {
        userId: "user-amy",
        username: "amy",
        email: "amy@dodonadata.ai",
        avatarUrl: "/api/avatar/amy",
        totalPredictions: 1,
        correctPredictions: 1,
        points: 0.5,
        rank: 1,
      },
      {
        userId: "user-zoe",
        username: "zoe",
        email: "zoe@dodonadata.ai",
        avatarUrl: "/api/avatar/zoe",
        totalPredictions: 1,
        correctPredictions: 1,
        points: 0.5,
        rank: 1,
      },
      {
        userId: "user-mia",
        username: "mia",
        email: "mia@dodonadata.ai",
        avatarUrl: "/api/avatar/mia",
        totalPredictions: 0,
        correctPredictions: 0,
        points: 0,
        rank: 3,
      },
    ]);
  });
});
