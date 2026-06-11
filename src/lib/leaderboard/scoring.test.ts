import { MatchStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  STAGE_POINTS,
  calculateUserStats,
  formatPoints,
  getPointsForPrediction,
  isCorrectGroupAdvancePick,
  isCorrectKnockoutPrediction,
  isCorrectPrediction,
  isCorrectThirdPlacePick,
  type ScoredPrediction,
} from "./scoring";

function knockoutPrediction(
  overrides: Partial<ScoredPrediction> & {
    stage?: string;
    winner?: string | null;
    status?: MatchStatus;
    predictedWinner?: string;
  } = {},
): ScoredPrediction {
  return {
    predictedWinner: overrides.predictedWinner ?? "Brazil",
    match: {
      status: overrides.status ?? MatchStatus.FINISHED,
      winner: overrides.winner ?? "Brazil",
      stage: overrides.stage ?? "Quarter Final",
    },
  };
}

describe("group and third-place scoring", () => {
  it("scores correct group advancers at 1 point each", () => {
    const stats = calculateUserStats({
      groupPicks: [
        { groupKey: "A", team: "Mexico" },
        { groupKey: "A", team: "South Africa" },
      ],
      thirdPlacePicks: [],
      knockoutRoundPicks: [],
      matchPredictions: [],
      groupResults: [
        {
          id: "1",
          groupKey: "A",
          advancer1: "Mexico",
          advancer2: "South Africa",
          thirdPlaceTeam: "South Korea",
          thirdAdvances: false,
          finalized: true,
          updatedAt: new Date(),
        },
      ],
      knockoutRoundResults: [],
    });

    expect(stats).toEqual({
      totalPredictions: 2,
      correctPredictions: 2,
      points: 2,
    });
  });

  it("scores correct third-place picks at 1 point each", () => {
    expect(
      isCorrectThirdPlacePick({ team: "South Korea" }, [
        {
          id: "1",
          groupKey: "A",
          advancer1: "Mexico",
          advancer2: "South Africa",
          thirdPlaceTeam: "South Korea",
          thirdAdvances: true,
          finalized: true,
          updatedAt: new Date(),
        },
      ]),
    ).toBe(true);
  });

  it("scores correct knockout round picks at 0.5 points", () => {
    const stats = calculateUserStats({
      groupPicks: [],
      thirdPlacePicks: [],
      knockoutRoundPicks: [
        { round: "TOP16", team: "Brazil" },
        { round: "WINNER", team: "France" },
      ],
      matchPredictions: [],
      groupResults: [],
      knockoutRoundResults: [
        {
          round: "TOP16",
          teams: ["Brazil", "France"],
          finalized: true,
        },
        {
          round: "WINNER",
          teams: ["France"],
          finalized: true,
        },
      ],
    });

    expect(stats.points).toBe(1);
    expect(stats.correctPredictions).toBe(2);
  });

  it("scores knockout winners at 0.5 points", () => {
    const stats = calculateUserStats({
      groupPicks: [],
      thirdPlacePicks: [],
      knockoutRoundPicks: [],
      matchPredictions: [knockoutPrediction()],
      groupResults: [],
      knockoutRoundResults: [],
    });

    expect(stats.points).toBe(STAGE_POINTS.KNOCKOUT);
  });
});

describe("isCorrectGroupAdvancePick", () => {
  it("is false when the group is not finalized", () => {
    expect(
      isCorrectGroupAdvancePick(
        { groupKey: "A", team: "Mexico" },
        [
          {
            id: "1",
            groupKey: "A",
            advancer1: "Mexico",
            advancer2: "South Africa",
            thirdPlaceTeam: null,
            thirdAdvances: false,
            finalized: false,
            updatedAt: new Date(),
          },
        ],
      ),
    ).toBe(false);
  });
});

describe("knockout helpers", () => {
  it("detects correct knockout predictions", () => {
    expect(isCorrectKnockoutPrediction(knockoutPrediction())).toBe(true);
    expect(isCorrectPrediction(knockoutPrediction())).toBe(true);
  });

  it("awards knockout points through legacy helper", () => {
    expect(getPointsForPrediction(knockoutPrediction())).toBe(0.5);
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
