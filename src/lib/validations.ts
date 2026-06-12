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

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address")
  .max(254, "Email is too long");

export const createUserSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
});

export function parseCreateUserInput(input: z.infer<typeof createUserSchema>) {
  return {
    username: input.username,
    email: input.email,
  };
}

export type CreateUserInput = z.infer<typeof createUserSchema>;
