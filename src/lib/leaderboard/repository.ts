import type {
  GroupAdvancePick,
  GroupResult,
  Match,
  Prediction,
  ThirdPlacePick,
  User,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type UserWithAllPicks = User & {
  groupAdvancePicks: GroupAdvancePick[];
  thirdPlacePicks: ThirdPlacePick[];
  predictions: (Prediction & { match: Match })[];
};

export interface LeaderboardRepository {
  findUsersWithPicks(): Promise<UserWithAllPicks[]>;
  findGroupResults(): Promise<GroupResult[]>;
}

export const leaderboardRepository: LeaderboardRepository = {
  async findUsersWithPicks() {
    return prisma.user.findMany({
      include: {
        groupAdvancePicks: true,
        thirdPlacePicks: true,
        predictions: {
          include: {
            match: true,
          },
        },
      },
      orderBy: { username: "asc" },
    });
  },

  async findGroupResults() {
    return prisma.groupResult.findMany();
  },
};
