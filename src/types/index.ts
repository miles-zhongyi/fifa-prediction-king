import type { Match, MatchStatus, Prediction, User } from "@prisma/client";

export type { Match, MatchStatus, Prediction, User };

export type MatchCorrectPredictor = {
  userId: string;
  username: string;
  avatarUrl: string;
};

export type AdvanceVoterOutcome = "correct" | "incorrect" | "pending";

export type AdvanceVoter = {
  userId: string;
  username: string;
  avatarUrl: string;
  outcome: AdvanceVoterOutcome;
};

export type TeamAdvanceVoters = {
  team: string;
  voters: AdvanceVoter[];
};

export type MatchWithPredictionCount = Match & {
  _count: {
    predictions: number;
  };
  correctPredictors?: MatchCorrectPredictor[];
  advanceVoters?: {
    home: TeamAdvanceVoters;
    away: TeamAdvanceVoters;
  };
};

export type PredictionWithRelations = Prediction & {
  user: Pick<User, "id" | "username" | "avatarUrl">;
  match: Match;
};

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  username: string;
  email: string;
  avatarUrl: string;
  totalPredictions: number;
  correctPredictions: number;
  points: number;
};

export type ApiError = {
  error: string;
  details?: unknown;
};
