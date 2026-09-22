import { SetMetadata, createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { OrgRole, Role } from "@prisma/client";
import { UnauthenticatedError } from "../common/errors";
import type { AuthRequest, RequestOrg, RequestUser } from "./request.types";

export const ROLES_KEY = "roles";
export const ORG_ROLES_KEY = "orgRoles";
export const PUBLIC_KEY = "isPublic";
export const REQUIRE_VERIFIED_ORG_KEY = "requireVerifiedOrg";

/** Marks a route as reachable without authentication. */
export const Public = () => SetMetadata(PUBLIC_KEY, true);

/** Restricts a route to the given platform roles. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

/** Restricts a route to the given roles *within the active organisation*. */
export const OrgRoles = (...roles: OrgRole[]) => SetMetadata(ORG_ROLES_KEY, roles);

/**
 * Requires the active organisation to be VERIFIED. Applied to every endpoint
 * that can move money or create a trading obligation.
 */
export const RequireVerifiedOrg = () => SetMetadata(REQUIRE_VERIFIED_ORG_KEY, true);

/** Injects the authenticated user. */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): RequestUser => {
  const req = ctx.switchToHttp().getRequest<AuthRequest>();
  if (!req.user) throw new UnauthenticatedError();
  return req.user;
});

/** Injects the organisation this request acts for. */
export const ActiveOrg = createParamDecorator((_data: unknown, ctx: ExecutionContext): RequestOrg => {
  const req = ctx.switchToHttp().getRequest<AuthRequest>();
  if (!req.user) throw new UnauthenticatedError();
  if (!req.user.activeOrg) {
    throw new UnauthenticatedError("No active organisation for this request");
  }
  return req.user.activeOrg;
});

/** Injects the client IP and user agent for auditing. */
export const ReqContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): { ip: string | null; userAgent: string | null } => {
    const req = ctx.switchToHttp().getRequest<AuthRequest>();
    return {
      ip: req.ip ?? null,
      userAgent: (req.headers["user-agent"] as string | undefined) ?? null,
    };
  }
);
