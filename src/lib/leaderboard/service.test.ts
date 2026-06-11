import { MatchStatus, type Match } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import type { LeaderboardRepository, UserWithAllPicks } from "./repository";
import { getLeaderboard } from "./service";

function createUser(
  username: string,
  input: {
    groupPicks?: Array<{ groupKey: string; team: string }>;
    thirdPlacePicks?: string[];
    knockout?: Array<{
      stage: string;
      predictedWinner: string;
      winner: string | null;
      status?: MatchStatus;
    }>;
  },
): UserWithAllPicks {
  return {
    id: `user-${username}`,
    username,
    email: `${username}@dodonadata.ai`,
    avatarUrl: `/api/avatar/${username}`,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    groupAdvancePicks: (input.groupPicks ?? []).map((pick, index) => ({
      id: `gap-${username}-${index}`,
      userId: `user-${username}`,
      groupKey: pick.groupKey,
      team: pick.team,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    })),
    thirdPlacePicks: (input.thirdPlacePicks ?? []).map((team, index) => ({
      id: `tpp-${username}-${index}`,
      userId: `user-${username}`,
      team,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    })),
    predictions: (input.knockout ?? []).map((prediction, index) => {
      const match: Match = {
        id: `match-${username}-${index}`,
        homeTeam: "A",
        awayTeam: "B",
        stage: prediction.stage,
        startTime: new Date("2026-07-01T00:00:00.000Z"),
        winner: prediction.winner,
        status: prediction.status ?? MatchStatus.FINISHED,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      };

      return {
        id: `prediction-${username}-${index}`,
        userId: `user-${username}`,
        matchId: match.id,
        predictedWinner: prediction.predictedWinner,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        match,
      };
    }),
  };
}

describe("getLeaderboard", () => {
  it("computes scores from group, third-place, and knockout picks", async () => {
    const repository: LeaderboardRepository = {
      findUsersWithPicks: vi.fn().mockResolvedValue([
        createUser("alice", {
          groupPicks: [
            { groupKey: "A", team: "Mexico" },
            { groupKey: "A", team: "South Africa" },
          ],
          thirdPlacePicks: ["South Korea"],
          knockout: [
            {
              stage: "Final",
              predictedWinner: "France",
              winner: "France",
            },
          ],
        }),
        createUser("bob", {
          groupPicks: [{ groupKey: "A", team: "Mexico" }],
          knockout: [
            {
              stage: "Final",
              predictedWinner: "Brazil",
              winner: "France",
            },
          ],
        }),
      ] satisfies UserWithAllPicks[]),
      findGroupResults: vi.fn().mockResolvedValue([
        {
          id: "gr-a",
          groupKey: "A",
          advancer1: "Mexico",
          advancer2: "South Africa",
          thirdPlaceTeam: "South Korea",
          thirdAdvances: true,
          finalized: true,
          updatedAt: new Date(),
        },
      ]),
    };

    const leaderboard = await getLeaderboard({ repository });

    expect(leaderboard[0]).toMatchObject({
      username: "alice",
      points: 3.5,
      correctPredictions: 4,
      rank: 1,
    });
    expect(leaderboard[1]).toMatchObject({
      username: "bob",
      points: 1,
      correctPredictions: 1,
      rank: 2,
    });
  });
});
