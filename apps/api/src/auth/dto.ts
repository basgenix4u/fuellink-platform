import { Role } from "@prisma/client";
import { z } from "zod";

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters");

export const registerSchema = z.object({
  email: z
    .string()
    .email("A valid email is required")
    .max(254)
    .transform((v) => v.trim().toLowerCase()),
  password,
  name: z.string().min(2, "Name must be at least 2 characters").max(120),
  phone: z
    .string()
    .min(7)
    .max(20)
    .regex(/^[+\d][\d\s-]{6,19}$/, "Enter a valid phone number")
    .optional(),
  // Self-service sign-up is restricted to market-facing roles; ADMIN is
  // platform-internal (provisioned manually / by an admin).
  role: z.enum([Role.DEPOT, Role.MARKETER])
});

export const loginSchema = z.object({
  email: z.string().email().max(254).transform((v) => v.trim().toLowerCase()),
  password: z.string().min(1, "Password is required")
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
