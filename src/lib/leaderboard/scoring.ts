import { MatchStatus, type GroupResult } from "@prisma/client";
import { isKnockoutStage } from "@/lib/match-utils";
import type { KnockoutRoundKey } from "@/lib/knockout-rounds";

export const STAGE_POINTS = {
  GROUP_ADVANCE: 1,
  THIRD_PLACE: 1,
  KNOCKOUT: 0.5,
  KNOCKOUT_ROUND: 0.5,
  CHAMPION: 2,
} as const;

// The 8 third-place teams that advance to the Round of 16 (best 8 of 12).
// Hardcoded here so scoring is never dependent on the DB's thirdAdvances field.
export const ADVANCING_THIRD_PLACE_TEAMS = new Set([
  "Bosnia and Herzegovina", // Group B
  "Paraguay",               // Group D
  "Ecuador",                // Group E
  "Sweden",                 // Group F
  "Senegal",                // Group I
  "Algeria",                // Group J
  "DR Congo",               // Group K
  "Ghana",                  // Group L
]);

export type ScoredPrediction = {
  predictedWinner: string;
  match: {
    status: MatchStatus;
    winner: string | null;
    stage: string;
  };
};

export type ScoredGroupPick = {
  groupKey: string;
  team: string;
};

export type ScoredThirdPlacePick = {
  team: string;
};

export type ScoredKnockoutRoundPick = {
  round: KnockoutRoundKey;
  team: string;
};

export type KnockoutRoundResultEntry = {
  round: string;
  teams: string[];
  finalized: boolean;
};

export function isCorrectKnockoutPrediction(
  prediction: ScoredPrediction,
): boolean {
  return (
    prediction.match.status === MatchStatus.FINISHED &&
    prediction.match.winner !== null &&
    prediction.predictedWinner === prediction.match.winner &&
    isKnockoutStage(prediction.match.stage)
  );
}

export function isCorrectGroupAdvancePick(
  pick: ScoredGroupPick,
  results: GroupResult[],
): boolean {
  const result = results.find(
    (entry) => entry.groupKey === pick.groupKey && entry.finalized,
  );

  if (!result) {
    return false;
  }

  const advancers = [result.advancer1, result.advancer2].filter(
    (team): team is string => Boolean(team),
  );

  return advancers.includes(pick.team);
}

export function isCorrectThirdPlacePick(
  pick: ScoredThirdPlacePick,
  results: GroupResult[],
): boolean {
  // Check hardcoded list first — never depends on the DB's thirdAdvances field.
  if (!ADVANCING_THIRD_PLACE_TEAMS.has(pick.team)) {
    return false;
  }
  // Verify the group is finalized and the team is actually the 3rd-place finisher.
  return results.some(
    (result) => result.finalized && result.thirdPlaceTeam === pick.team,
  );
}

export function isCorrectKnockoutRoundPick(
  pick: ScoredKnockoutRoundPick,
  results: KnockoutRoundResultEntry[],
): boolean {
  const result = results.find((entry) => entry.round === pick.round);
  if (!result) return false;
  return result.teams.includes(pick.team);
}

export function calculateUserStats(input: {
  groupPicks: ScoredGroupPick[];
  thirdPlacePicks: ScoredThirdPlacePick[];
  knockoutRoundPicks: ScoredKnockoutRoundPick[];
  matchPredictions: ScoredPrediction[];
  groupResults: GroupResult[];
  knockoutRoundResults: KnockoutRoundResultEntry[];
}) {
  let correctPredictions = 0;
  let points = 0;

  for (const pick of input.groupPicks) {
    if (isCorrectGroupAdvancePick(pick, input.groupResults)) {
      correctPredictions += 1;
      points += STAGE_POINTS.GROUP_ADVANCE;
    }
  }

  for (const pick of input.thirdPlacePicks) {
    if (isCorrectThirdPlacePick(pick, input.groupResults)) {
      correctPredictions += 1;
      points += STAGE_POINTS.THIRD_PLACE;
    }
  }

  for (const pick of input.knockoutRoundPicks) {
    if (isCorrectKnockoutRoundPick(pick, input.knockoutRoundResults)) {
      correctPredictions += 1;
      points += pick.round === "WINNER" ? STAGE_POINTS.CHAMPION : STAGE_POINTS.KNOCKOUT_ROUND;
    }
  }

  for (const prediction of input.matchPredictions) {
    if (isCorrectKnockoutPrediction(prediction)) {
      correctPredictions += 1;
      points += STAGE_POINTS.KNOCKOUT;
    }
  }

  return {
    totalPredictions:
      input.groupPicks.length +
      input.thirdPlacePicks.length +
      input.knockoutRoundPicks.length +
      input.matchPredictions.length,
    correctPredictions,
    points,
  };
}

export function formatPoints(points: number): string {
  return Number.isInteger(points) ? String(points) : points.toFixed(1);
}

// Legacy helpers used in tests
export function getStagePoints(stage: string): number {
  if (isKnockoutStage(stage)) {
    return STAGE_POINTS.KNOCKOUT;
  }

  return 0;
}

export function isCorrectPrediction(prediction: ScoredPrediction): boolean {
  return isCorrectKnockoutPrediction(prediction);
}

export function getPointsForPrediction(prediction: ScoredPrediction): number {
  if (!isCorrectKnockoutPrediction(prediction)) {
    return 0;
  }

  return STAGE_POINTS.KNOCKOUT;
}
