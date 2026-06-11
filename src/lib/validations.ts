import { z } from "zod";
import { toDodonaEmail } from "@/lib/email";

const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username must be at most 20 characters")
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "Username may only contain letters, numbers, and underscores",
  );

const emailLocalPartSchema = z
  .string()
  .trim()
  .min(1, "Email username is required")
  .max(64, "Email username is too long")
  .regex(
    /^[a-zA-Z0-9._-]+$/,
    "Email username may only contain letters, numbers, dots, underscores, and hyphens",
  );

export const createUserSchema = z.object({
  username: usernameSchema,
  email: emailLocalPartSchema,
});

export function parseCreateUserInput(input: z.infer<typeof createUserSchema>) {
  return {
    username: input.username,
    email: toDodonaEmail(input.email),
  };
}

export type CreateUserInput = z.infer<typeof createUserSchema>;
