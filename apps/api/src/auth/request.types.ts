import { Role } from "@prisma/client";

export interface RequestUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

/**
 * Express request as seen by guards/controllers. Typed narrowly so this
 * package never needs express types on the type-check path.
 */
export interface AuthRequest {
  user?: RequestUser;
  headers: { authorization?: string | string[] };
}
