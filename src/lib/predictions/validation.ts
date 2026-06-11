import { z } from "zod";

const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username must be at most 20 characters")
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "Username may only contain letters, numbers, and underscores",
  );

export const submitPredictionSchema = z.object({
  username: usernameSchema,
  matchId: z.string().trim().min(1, "Match ID is required"),
  predictedWinner: z.string().trim().min(1, "Predicted winner is required"),
});

export type SubmitPredictionInput = z.infer<typeof submitPredictionSchema>;

export function createPredictedWinnerSchema(
  homeTeam: string,
  awayTeam: string,
) {
  return z.enum([homeTeam, awayTeam] as [string, string], {
    errorMap: () => ({
      message: `Predicted winner must be either ${homeTeam} or ${awayTeam}`,
    }),
  });
}

export function validatePredictedWinner(
  predictedWinner: string,
  homeTeam: string,
  awayTeam: string,
) {
  return createPredictedWinnerSchema(homeTeam, awayTeam).parse(predictedWinner);
}
