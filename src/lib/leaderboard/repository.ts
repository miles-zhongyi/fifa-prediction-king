import type { Match, Prediction, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type UserWithPredictions = User & {
  predictions: (Prediction & { match: Match })[];
};

export interface LeaderboardRepository {
  findUsersWithPredictions(): Promise<UserWithPredictions[]>;
}

export const leaderboardRepository: LeaderboardRepository = {
  async findUsersWithPredictions() {
    return prisma.user.findMany({
      include: {
        predictions: {
          include: {
            match: true,
          },
        },
      },
      orderBy: { username: "asc" },
    });
  },
};
