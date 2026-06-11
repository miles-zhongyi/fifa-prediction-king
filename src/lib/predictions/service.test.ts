import { MatchStatus, type Match } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PredictionRepository } from "./repository";
import { PredictionServiceError } from "./errors";
import { assertMatchNotStarted, submitPrediction } from "./service";

vi.mock("@/lib/users", () => ({
  getOrCreateUser: vi.fn(),
}));

import { getOrCreateUser } from "@/lib/users";

const futureStart = new Date("2099-06-15T18:00:00.000Z");
const pastStart = new Date("2020-06-15T18:00:00.000Z");

const baseMatch: Match = {
  id: "match-1",
  homeTeam: "Brazil",
  awayTeam: "Argentina",
  stage: "Group A",
  startTime: futureStart,
  winner: null,
  status: MatchStatus.SCHEDULED,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
};

function createRepository(
  overrides: Partial<PredictionRepository> = {},
): PredictionRepository {
  return {
    findMatchById: vi.fn().mockResolvedValue(baseMatch),
    upsertPrediction: vi.fn().mockResolvedValue({
      id: "prediction-1",
      userId: "user-1",
      matchId: "match-1",
      predictedWinner: "Brazil",
      createdAt: new Date("2026-01-02T00:00:00.000Z"),
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      user: { id: "user-1", username: "alice" },
      match: baseMatch,
    }),
    findPredictionById: vi.fn(),
    updatePredictionById: vi.fn(),
    ...overrides,
  };
}

describe("assertMatchNotStarted", () => {
  it("allows predictions before kickoff", () => {
    expect(() =>
      assertMatchNotStarted(
        new Date("2099-01-01T12:00:00.000Z"),
        new Date("2099-01-01T00:00:00.000Z"),
      ),
    ).not.toThrow();
  });

  it("rejects predictions at kickoff", () => {
    const kickoff = new Date("2026-06-15T18:00:00.000Z");

    expect(() => assertMatchNotStarted(kickoff, kickoff)).toThrow(
      PredictionServiceError,
    );
  });

  it("rejects predictions after kickoff", () => {
    expect(() =>
      assertMatchNotStarted(
        pastStart,
        new Date("2026-06-15T19:00:00.000Z"),
      ),
    ).toThrow(/match has already started/);
  });
});

describe("submitPrediction", () => {
  beforeEach(() => {
    vi.mocked(getOrCreateUser).mockReset();
  });

  it("creates a user when the username does not exist", async () => {
    const repository = createRepository();
    vi.mocked(getOrCreateUser).mockResolvedValue({
      id: "user-new",
      username: "new_player",
      createdAt: new Date(),
    });

    await submitPrediction(
      {
        username: "new_player",
        matchId: "match-1",
        predictedWinner: "Brazil",
      },
      {
        now: new Date("2026-01-01T00:00:00.000Z"),
        repository,
      },
    );

    expect(getOrCreateUser).toHaveBeenCalledWith("new_player");
  });

  it("creates a prediction for a new user and match", async () => {
    const repository = createRepository();
    vi.mocked(getOrCreateUser).mockResolvedValue({
      id: "user-1",
      username: "alice",
      createdAt: new Date(),
    });

    const result = await submitPrediction(
      {
        username: "alice",
        matchId: "match-1",
        predictedWinner: "Brazil",
      },
      {
        now: new Date("2026-01-01T00:00:00.000Z"),
        repository,
      },
    );

    expect(repository.upsertPrediction).toHaveBeenCalledWith({
      userId: "user-1",
      matchId: "match-1",
      predictedWinner: "Brazil",
    });
    expect(result.predictedWinner).toBe("Brazil");
  });

  it("updates an existing prediction via upsert", async () => {
    const repository = createRepository();
    vi.mocked(getOrCreateUser).mockResolvedValue({
      id: "user-1",
      username: "alice",
      createdAt: new Date(),
    });

    await submitPrediction(
      {
        username: "alice",
        matchId: "match-1",
        predictedWinner: "Argentina",
      },
      {
        now: new Date("2026-01-01T00:00:00.000Z"),
        repository,
      },
    );

    expect(repository.upsertPrediction).toHaveBeenCalledWith({
      userId: "user-1",
      matchId: "match-1",
      predictedWinner: "Argentina",
    });
  });

  it("rejects predictions once the match has started", async () => {
    const repository = createRepository({
      findMatchById: vi.fn().mockResolvedValue({
        ...baseMatch,
        startTime: pastStart,
      }),
    });

    vi.mocked(getOrCreateUser).mockResolvedValue({
      id: "user-1",
      username: "alice",
      createdAt: new Date(),
    });

    await expect(
      submitPrediction(
        {
          username: "alice",
          matchId: "match-1",
          predictedWinner: "Brazil",
        },
        {
          now: new Date("2026-06-15T18:00:00.000Z"),
          repository,
        },
      ),
    ).rejects.toMatchObject({
      message: "Predictions are closed because the match has already started",
      statusCode: 400,
    });
  });

  it("rejects winners that are not one of the two teams", async () => {
    const repository = createRepository();
    vi.mocked(getOrCreateUser).mockResolvedValue({
      id: "user-1",
      username: "alice",
      createdAt: new Date(),
    });

    await expect(
      submitPrediction(
        {
          username: "alice",
          matchId: "match-1",
          predictedWinner: "Draw",
        },
        {
          now: new Date("2026-01-01T00:00:00.000Z"),
          repository,
        },
      ),
    ).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("returns 404 when the match does not exist", async () => {
    const repository = createRepository({
      findMatchById: vi.fn().mockResolvedValue(null),
    });

    vi.mocked(getOrCreateUser).mockResolvedValue({
      id: "user-1",
      username: "alice",
      createdAt: new Date(),
    });

    await expect(
      submitPrediction(
        {
          username: "alice",
          matchId: "missing-match",
          predictedWinner: "Brazil",
        },
        {
          now: new Date("2026-01-01T00:00:00.000Z"),
          repository,
        },
      ),
    ).rejects.toMatchObject({
      message: "Match not found",
      statusCode: 404,
    });
  });

  it("returns validation errors for invalid input", async () => {
    const repository = createRepository();

    await expect(
      submitPrediction(
        {
          username: "a",
          matchId: "",
          predictedWinner: "",
        },
        { repository },
      ),
    ).rejects.toMatchObject({
      message: "Validation failed",
      statusCode: 400,
    });
  });
});
