import { MatchStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  STAGE_POINTS,
  calculateUserStats,
  formatPoints,
  getPointsForPrediction,
  getStagePoints,
  isCorrectPrediction,
  type ScoredPrediction,
} from "./scoring";

function prediction(
  overrides: Partial<ScoredPrediction> & {
    stage?: string;
    winner?: string | null;
    status?: MatchStatus;
    predictedWinner?: string;
  } = {},
): ScoredPrediction {
  const winner =
    overrides.winner !== undefined ? overrides.winner : "Brazil";

  return {
    predictedWinner: overrides.predictedWinner ?? "Brazil",
    match: {
      status: overrides.status ?? MatchStatus.FINISHED,
      winner,
      stage: overrides.stage ?? "Group A",
    },
  };
}

describe("getStagePoints", () => {
  it.each([
    ["Group A", STAGE_POINTS.GROUP],
    ["Group B", STAGE_POINTS.GROUP],
    ["Round of 16", STAGE_POINTS.KNOCKOUT],
    ["R16", STAGE_POINTS.KNOCKOUT],
    ["Quarter Final", STAGE_POINTS.KNOCKOUT],
    ["Quarterfinal", STAGE_POINTS.KNOCKOUT],
    ["Semi Final", STAGE_POINTS.KNOCKOUT],
    ["Semifinal", STAGE_POINTS.KNOCKOUT],
    ["Final", STAGE_POINTS.KNOCKOUT],
  ])("maps %s to %s points", (stage, expectedPoints) => {
    expect(getStagePoints(stage)).toBe(expectedPoints);
  });

  it("returns 0 for unknown stages", () => {
    expect(getStagePoints("Friendly")).toBe(0);
  });
});

describe("isCorrectPrediction", () => {
  it("is correct when the finished match winner matches", () => {
    expect(
      isCorrectPrediction(
        prediction({
          predictedWinner: "Argentina",
          winner: "Argentina",
          status: MatchStatus.FINISHED,
        }),
      ),
    ).toBe(true);
  });

  it("is incorrect for unfinished matches", () => {
    expect(
      isCorrectPrediction(
        prediction({
          status: MatchStatus.SCHEDULED,
        }),
      ),
    ).toBe(false);
  });

  it("is incorrect when the winner is missing", () => {
    expect(
      isCorrectPrediction(
        prediction({
          winner: null,
          status: MatchStatus.FINISHED,
        }),
      ),
    ).toBe(false);
  });

  it("is incorrect when the pick does not match", () => {
    expect(
      isCorrectPrediction(
        prediction({
          predictedWinner: "Brazil",
          winner: "Argentina",
        }),
      ),
    ).toBe(false);
  });
});

describe("getPointsForPrediction", () => {
  it("awards stage points only for correct finished predictions", () => {
    expect(
      getPointsForPrediction(
        prediction({
          stage: "Quarter Final",
          predictedWinner: "Spain",
          winner: "Spain",
        }),
      ),
    ).toBe(0.5);
  });

  it("awards no points for incorrect predictions", () => {
    expect(
      getPointsForPrediction(
        prediction({
          stage: "Final",
          predictedWinner: "Brazil",
          winner: "Argentina",
        }),
      ),
    ).toBe(0);
  });
});

describe("calculateUserStats", () => {
  it("sums weighted points across correct predictions only", () => {
    const stats = calculateUserStats([
      prediction({
        stage: "Group A",
        predictedWinner: "Brazil",
        winner: "Brazil",
      }),
      prediction({
        stage: "Round of 16",
        predictedWinner: "France",
        winner: "France",
      }),
      prediction({
        stage: "Final",
        predictedWinner: "Spain",
        winner: "England",
      }),
      prediction({
        stage: "Semi Final",
        predictedWinner: "Portugal",
        winner: "Portugal",
        status: MatchStatus.SCHEDULED,
      }),
    ]);

    expect(stats).toEqual({
      totalPredictions: 4,
      correctPredictions: 2,
      points: 1.5,
    });
  });
});

describe("formatPoints", () => {
  it("formats integers without decimals", () => {
    expect(formatPoints(3)).toBe("3");
  });

  it("formats fractional points with one decimal", () => {
    expect(formatPoints(1.5)).toBe("1.5");
  });
});
