import type { Match, Prediction, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { PredictionWithRelations } from "@/types";

const predictionInclude = {
  user: {
    select: { id: true, username: true, avatarUrl: true },
  },
  match: true,
} as const;

export type UpsertPredictionParams = {
  userId: string;
  matchId: string;
  predictedWinner: string;
};

export interface PredictionRepository {
  findMatchById(matchId: string): Promise<Match | null>;
  upsertPrediction(
    params: UpsertPredictionParams,
  ): Promise<PredictionWithRelations>;
  findPredictionById(id: string): Promise<
    | (Prediction & {
        user: Pick<User, "id" | "username" | "avatarUrl">;
        match: Match;
      })
    | null
  >;
  updatePredictionById(
    id: string,
    predictedWinner: string,
  ): Promise<PredictionWithRelations>;
}

export const predictionRepository: PredictionRepository = {
  async findMatchById(matchId) {
    return prisma.match.findUnique({ where: { id: matchId } });
  },

  async upsertPrediction({ userId, matchId, predictedWinner }) {
    return prisma.prediction.upsert({
      where: {
        userId_matchId: { userId, matchId },
      },
      create: { userId, matchId, predictedWinner },
      update: { predictedWinner },
      include: predictionInclude,
    });
  },

  async findPredictionById(id) {
    return prisma.prediction.findUnique({
      where: { id },
      include: predictionInclude,
    });
  },

  async updatePredictionById(id, predictedWinner) {
    return prisma.prediction.update({
      where: { id },
      data: { predictedWinner },
      include: predictionInclude,
    });
  },
};
