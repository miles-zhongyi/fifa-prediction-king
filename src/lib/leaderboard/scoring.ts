import { MatchStatus } from "@prisma/client";
import { isGroupStageMatch } from "@/lib/match-utils";

export const STAGE_POINTS = {
  GROUP: 1,
  KNOCKOUT: 0.5,
} as const;

export type ScoredPrediction = {
  predictedWinner: string;
  match: {
    status: MatchStatus;
    winner: string | null;
    stage: string;
  };
};

function normalizeStageKey(stage: string): string {
  return stage.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

export function isKnockoutStage(stage: string): boolean {
  const key = normalizeStageKey(stage);

  return (
    key === "roundof16" ||
    key === "r16" ||
    key === "roundof32" ||
    key === "r32" ||
    key === "quarterfinal" ||
    key === "semifinal" ||
    key === "final" ||
    key.includes("knockout") ||
    key.includes("roundof")
  );
}

export function getStagePoints(stage: string): number {
  if (isGroupStageMatch(stage)) {
    return STAGE_POINTS.GROUP;
  }

  if (isKnockoutStage(stage)) {
    return STAGE_POINTS.KNOCKOUT;
  }

  return 0;
}

export function isCorrectPrediction(prediction: ScoredPrediction): boolean {
  return (
    prediction.match.status === MatchStatus.FINISHED &&
    prediction.match.winner !== null &&
    prediction.predictedWinner === prediction.match.winner
  );
}

export function getPointsForPrediction(prediction: ScoredPrediction): number {
  if (!isCorrectPrediction(prediction)) {
    return 0;
  }

  return getStagePoints(prediction.match.stage);
}

export function calculateUserStats(predictions: ScoredPrediction[]) {
  const correctPredictions = predictions.filter(isCorrectPrediction).length;
  const points = predictions.reduce(
    (total, prediction) => total + getPointsForPrediction(prediction),
    0,
  );

  return {
    totalPredictions: predictions.length,
    correctPredictions,
    points,
  };
}

export function formatPoints(points: number): string {
  return Number.isInteger(points) ? String(points) : points.toFixed(1);
}
