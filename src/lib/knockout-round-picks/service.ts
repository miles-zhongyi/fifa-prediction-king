import { ZodError } from "zod";
import {
  getDownstreamRounds,
  getKnockoutRound,
  isKnockoutRoundKey,
  KNOCKOUT_ROUNDS,
  type KnockoutRoundKey,
} from "@/lib/knockout-rounds";
import {
  getUserAdvancingPool,
  isAdvancingPoolComplete,
} from "@/lib/knockout-pool";
import { isKnockoutRoundLocked, isKnockoutRoundsLocked } from "@/lib/knockout-round-picks/locking";
import { knockoutRoundPickSchema } from "@/lib/knockout-round-picks/validation";
import { prisma } from "@/lib/prisma";
import { PredictionServiceError } from "@/lib/predictions/errors";
import { getOrCreateUser } from "@/lib/users";

export type RoundVoterSummary = {
  userId: string;
  username: string;
  avatarUrl: string | null;
};

function parseResultTeams(teamsJson: string): string[] {
  try {
    const parsed = JSON.parse(teamsJson) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((team): team is string => typeof team === "string")
      : [];
  } catch {
    return [];
  }
}

async function getUserRoundTeams(
  userId: string,
  round: KnockoutRoundKey,
): Promise<string[]> {
  const picks = await prisma.knockoutRoundPick.findMany({
    where: { userId, round },
    select: { team: true },
    orderBy: { team: "asc" },
  });

  return picks.map((pick) => pick.team);
}

async function getEligibleTeams(
  userId: string,
  round: KnockoutRoundKey,
): Promise<string[]> {
  const definition = getKnockoutRound(round);
  if (!definition) {
    return [];
  }

  if (!definition.parentRound) {
    return getUserAdvancingPool(userId);
  }

  return getUserRoundTeams(userId, definition.parentRound);
}

async function cascadeRemoveDownstreamPicks(
  userId: string,
  round: KnockoutRoundKey,
  team: string,
): Promise<void> {
  const downstreamRounds = getDownstreamRounds(round);

  if (downstreamRounds.length === 0) {
    return;
  }

  await prisma.knockoutRoundPick.deleteMany({
    where: {
      userId,
      round: { in: downstreamRounds },
      team,
    },
  });
}

export async function toggleKnockoutRoundPick(rawInput: unknown) {
  let input;
  try {
    input = knockoutRoundPickSchema.parse(rawInput);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new PredictionServiceError("Validation failed", 400, error.flatten());
    }
    throw error;
  }

  const roundDefinition = getKnockoutRound(input.round);
  if (!roundDefinition) {
    throw new PredictionServiceError("Invalid knockout round", 400);
  }

  const user = await getOrCreateUser(input.username);

  if (!(await isAdvancingPoolComplete(user.id))) {
    throw new PredictionServiceError(
      "Complete all group and third-place picks before knockout rounds",
      400,
    );
  }

  if (isKnockoutRoundLocked(input.round)) {
    throw new PredictionServiceError(
      "Picks for this round are locked — the round has already started or starts within 24 hours",
      400,
    );
  }

  const eligibleTeams = await getEligibleTeams(user.id, input.round);
  if (!eligibleTeams.includes(input.team)) {
    throw new PredictionServiceError(
      "This team is not in your pool for this round",
      400,
    );
  }

  const existing = await prisma.knockoutRoundPick.findUnique({
    where: {
      userId_round_team: {
        userId: user.id,
        round: input.round,
        team: input.team,
      },
    },
  });

  if (existing) {
    await prisma.knockoutRoundPick.delete({ where: { id: existing.id } });
    await cascadeRemoveDownstreamPicks(user.id, input.round, input.team);
    return { round: input.round, team: input.team, selected: false };
  }

  const currentCount = await prisma.knockoutRoundPick.count({
    where: { userId: user.id, round: input.round },
  });

  if (currentCount >= roundDefinition.maxPicks) {
    throw new PredictionServiceError(
      `You can only pick ${roundDefinition.maxPicks} teams for ${roundDefinition.label}`,
      400,
    );
  }

  await prisma.knockoutRoundPick.create({
    data: {
      userId: user.id,
      round: input.round,
      team: input.team,
    },
  });

  return { round: input.round, team: input.team, selected: true };
}

export async function getUserKnockoutRoundPicks(username: string) {
  const user = await getOrCreateUser(username);
  return prisma.knockoutRoundPick.findMany({
    where: { userId: user.id },
    orderBy: [{ round: "asc" }, { team: "asc" }],
  });
}

export async function getKnockoutRoundPickBoard() {
  const [picks, results] = await Promise.all([
    prisma.knockoutRoundPick.findMany({
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.knockoutRoundResult.findMany(),
  ]);
  const locked = isKnockoutRoundLocked("TOP16");

  const picksByRoundTeam: Record<string, Record<string, RoundVoterSummary[]>> =
    {};

  for (const round of KNOCKOUT_ROUNDS) {
    picksByRoundTeam[round.key] = {};
  }

  for (const pick of picks) {
    if (!isKnockoutRoundKey(pick.round)) {
      continue;
    }

    if (!picksByRoundTeam[pick.round][pick.team]) {
      picksByRoundTeam[pick.round][pick.team] = [];
    }

    picksByRoundTeam[pick.round][pick.team].push({
      userId: pick.user.id,
      username: pick.user.username,
      avatarUrl: pick.user.avatarUrl,
    });
  }

  const resultsByRound: Record<
    string,
    { teams: string[]; finalized: boolean }
  > = {};

  for (const result of results) {
    resultsByRound[result.round] = {
      teams: parseResultTeams(result.teams),
      finalized: result.finalized,
    };
  }

  return {
    rounds: KNOCKOUT_ROUNDS,
    picksByRoundTeam,
    resultsByRound,
    locked,
    requiresPoolSize: true,
  };
}
