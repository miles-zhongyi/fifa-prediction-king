import { z } from "zod";
import { KNOCKOUT_ROUND_KEYS } from "@/lib/knockout-rounds";

export const knockoutRoundPickSchema = z.object({
  username: z.string().trim().min(1),
  round: z.enum(KNOCKOUT_ROUND_KEYS),
  team: z.string().trim().min(1),
});
