import { OrgType, Role } from "@prisma/client";
import { z } from "zod";
import { NIGERIAN_STATES } from "../common/constants";

/** Nigerian mobile numbers: +234XXXXXXXXXX or 0XXXXXXXXXX. */
export const nigerianPhone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-()]/g, ""))
  .refine((v) => /^(\+234|0)[789]\d{9}$/.test(v), "Enter a valid Nigerian phone number")
  // Normalise to E.164 so the same number cannot be registered twice.
  .transform((v) => (v.startsWith("0") ? `+234${v.slice(1)}` : v));

export const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address")
  .max(254);

export const registerSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Password is required"),
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  phone: nigerianPhone,
  /** Platform side the user is registering for. ADMIN is never self-service. */
  role: z.enum([Role.DEPOT, Role.MARKETER]),
  /** A company is created alongside the first user. */
  organizationName: z.string().trim().min(2, "Company name is required").max(160),
  rcNumber: z.string().trim().max(40).optional(),
  state: z.enum(NIGERIAN_STATES).optional(),
});

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Password is required"),
});

export const refreshSchema = z.object({
  /** Optional: the token normally arrives in an httpOnly cookie. */
  refreshToken: z.string().min(10).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(1, "New password is required"),
});

export const requestPasswordResetSchema = z.object({ email: emailField });

export const resetPasswordSchema = z.object({
  token: z.string().min(10, "Reset token is required"),
  newPassword: z.string().min(1, "New password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/** Maps the platform role chosen at signup to the organisation type. */
export function orgTypeForRole(role: Role): OrgType {
  return role === Role.DEPOT ? OrgType.DEPOT : OrgType.MARKETER;
}
