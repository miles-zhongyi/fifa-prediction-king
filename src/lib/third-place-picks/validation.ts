import { z } from "zod";

const usernameSchema = z
  .string()
  .trim()
  .min(3)
  .max(20)
  .regex(/^[a-zA-Z0-9_]+$/);

export const thirdPlacePickSchema = z.object({
  username: usernameSchema,
  team: z.string().trim().min(1),
});
