import { SetMetadata } from "@nestjs/common";
import { Role } from "@prisma/client";

export type Roles = Role[];

export const ROLES_KEY = "roles";

/** Restrict a route to the given roles. Stacked after JwtAuthGuard. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
