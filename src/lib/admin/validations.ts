import { MatchStatus } from "@prisma/client";
import { z } from "zod";
import { validatePredictedWinner } from "@/lib/predictions/validation";

export const ADMIN_MATCH_STAGES = [
  "Group A",
  "Group B",
  "Group C",
  "Group D",
  "Round of 16",
  "Quarter Final",
  "Semi Final",
  "Final",
] as const;

export const adminCreateMatchSchema = z.object({
  homeTeam: z.string().trim().min(1, "Home team is required"),
  awayTeam: z.string().trim().min(1, "Away team is required"),
  stage: z.string().trim().min(1, "Stage is required"),
  startTime: z.coerce.date({ invalid_type_error: "Start time is required" }),
  status: z
    .nativeEnum(MatchStatus)
    .optional()
    .default(MatchStatus.SCHEDULED),
});

export const adminUpdateMatchSchema = z
  .object({
    homeTeam: z.string().trim().min(1, "Home team is required").optional(),
    awayTeam: z.string().trim().min(1, "Away team is required").optional(),
    stage: z.string().trim().min(1, "Stage is required").optional(),
    startTime: z.coerce
      .date({ invalid_type_error: "Start time is invalid" })
      .optional(),
    winner: z.string().trim().min(1).nullable().optional(),
    status: z.nativeEnum(MatchStatus).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const adminCompleteMatchSchema = z.object({
  winner: z.string().trim().min(1, "Winner is required"),
});

export type AdminCreateMatchInput = z.infer<typeof adminCreateMatchSchema>;
export type AdminUpdateMatchInput = z.infer<typeof adminUpdateMatchSchema>;
export type AdminCompleteMatchInput = z.infer<typeof adminCompleteMatchSchema>;

export type MatchFields = {
  homeTeam: string;
  awayTeam: string;
  winner: string | null;
  status: MatchStatus;
};

export function validateWinnerForMatch(
  winner: string,
  homeTeam: string,
  awayTeam: string,
) {
  return validatePredictedWinner(winner, homeTeam, awayTeam);
}

export function validateFinishedMatchState(match: MatchFields): void {
  if (match.status !== MatchStatus.FINISHED) {
    return;
  }

  if (!match.winner) {
    throw new Error("Winner is required when a match is marked as completed");
  }

  validateWinnerForMatch(match.winner, match.homeTeam, match.awayTeam);
}
