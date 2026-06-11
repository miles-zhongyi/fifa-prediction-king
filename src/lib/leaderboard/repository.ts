import type {
  GroupAdvancePick,
  GroupResult,
  KnockoutRoundPick,
  KnockoutRoundResult,
  Match,
  Prediction,
  ThirdPlacePick,
  User,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type UserWithAllPicks = User & {
  groupAdvancePicks: GroupAdvancePick[];
  thirdPlacePicks: ThirdPlacePick[];
  knockoutRoundPicks: KnockoutRoundPick[];
  predictions: (Prediction & { match: Match })[];
};

export interface LeaderboardRepository {
  findUsersWithPicks(): Promise<UserWithAllPicks[]>;
  findGroupResults(): Promise<GroupResult[]>;
  findKnockoutRoundResults(): Promise<KnockoutRoundResult[]>;
}

export const leaderboardRepository: LeaderboardRepository = {
  async findUsersWithPicks() {
    return prisma.user.findMany({
      include: {
        groupAdvancePicks: true,
        thirdPlacePicks: true,
        knockoutRoundPicks: true,
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

  async findKnockoutRoundResults() {
    return prisma.knockoutRoundResult.findMany();
  },
};
