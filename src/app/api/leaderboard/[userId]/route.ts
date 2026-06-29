import { handleApiError, jsonResponse } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import {
  isCorrectGroupAdvancePick,
  isCorrectThirdPlacePick,
  STAGE_POINTS,
} from "@/lib/leaderboard/scoring";
import { isKnockoutRoundKey } from "@/lib/knockout-rounds";

const KNOCKOUT_ROUND_ORDER = ["TOP16", "TOP8", "TOP4", "TOP2", "WINNER"] as const;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;

    const [user, groupResults, knockoutRoundResults] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: {
          groupAdvancePicks: { orderBy: [{ groupKey: "asc" }, { team: "asc" }] },
          thirdPlacePicks: { orderBy: { team: "asc" } },
          knockoutRoundPicks: { orderBy: [{ round: "asc" }, { team: "asc" }] },
        },
      }),
      prisma.groupResult.findMany(),
      prisma.knockoutRoundResult.findMany(),
    ]);

    if (!user) {
      return jsonResponse({ error: "User not found" }, 404);
    }

    const parsedKnockoutResults = knockoutRoundResults.map((r) => ({
      round: r.round,
      teams: JSON.parse(r.teams) as string[],
      finalized: r.finalized,
    }));

    const groupPicks = user.groupAdvancePicks.map((pick) => {
      const correct = isCorrectGroupAdvancePick(pick, groupResults);
      const groupResult = groupResults.find((g) => g.groupKey === pick.groupKey);
      return {
        groupKey: pick.groupKey,
        team: pick.team,
        correct,
        finalized: groupResult?.finalized ?? false,
        points: correct ? STAGE_POINTS.GROUP_ADVANCE : 0,
      };
    });

    const thirdPlacePicks = user.thirdPlacePicks.map((pick) => {
      const correct = isCorrectThirdPlacePick(pick, groupResults);
      const groupResult = groupResults.find(
        (g) => g.thirdPlaceTeam === pick.team && g.finalized,
      );
      return {
        team: pick.team,
        correct,
        finalized: !!groupResult,
        points: correct ? STAGE_POINTS.THIRD_PLACE : 0,
      };
    });

    const knockoutPicks = user.knockoutRoundPicks
      .filter((p) => isKnockoutRoundKey(p.round))
      .sort((a, b) => {
        return KNOCKOUT_ROUND_ORDER.indexOf(a.round as typeof KNOCKOUT_ROUND_ORDER[number]) -
               KNOCKOUT_ROUND_ORDER.indexOf(b.round as typeof KNOCKOUT_ROUND_ORDER[number]);
      })
      .map((pick) => {
        const roundResult = parsedKnockoutResults.find((r) => r.round === pick.round);
        const correct = !!(roundResult && roundResult.teams.includes(pick.team));
        const pts = correct
          ? pick.round === "WINNER"
            ? STAGE_POINTS.CHAMPION
            : STAGE_POINTS.KNOCKOUT_ROUND
          : 0;
        return {
          round: pick.round,
          team: pick.team,
          correct,
          finalized: roundResult?.finalized ?? false,
          roundStarted: (roundResult?.teams.length ?? 0) > 0,
          points: pts,
        };
      });

    const totalPoints =
      groupPicks.reduce((s, p) => s + p.points, 0) +
      thirdPlacePicks.reduce((s, p) => s + p.points, 0) +
      knockoutPicks.reduce((s, p) => s + p.points, 0);

    return jsonResponse({
      userId: user.id,
      username: user.username,
      totalPoints,
      groupPicks,
      thirdPlacePicks,
      knockoutPicks,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
