import { Role } from "@prisma/client";
import { z } from "zod";

export const listUsersSchema = z.object({
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  role: z.nativeEnum(Role).optional()
});

export const setRoleSchema = z.object({
  role: z.nativeEnum(Role)
});

export const setStatusSchema = z.object({
  isActive: z.boolean()
});

export type ListUsersQuery = z.infer<typeof listUsersSchema>;
export type SetRoleInput = z.infer<typeof setRoleSchema>;
export type SetStatusInput = z.infer<typeof setStatusSchema>;
