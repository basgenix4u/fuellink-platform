import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { OrgRole, Role, VerificationStatus } from "@prisma/client";
import { ErrorCode, ForbiddenError, UnauthenticatedError } from "../common/errors";
import { ORG_ROLES_KEY, REQUIRE_VERIFIED_ORG_KEY, ROLES_KEY } from "./decorators";
import type { AuthRequest } from "./request.types";

/**
 * Authorisation. Runs after JwtAuthGuard and enforces, in order:
 *   1. platform role       (@Roles)
 *   2. organisation role   (@OrgRoles)
 *   3. verification status (@RequireVerifiedOrg)
 *
 * ADMIN bypasses org-role and verification checks: the platform operator must
 * be able to act on any organisation to resolve disputes and correct data.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const handler = context.getHandler();
    const cls = context.getClass();

    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [handler, cls]);
    const requiredOrgRoles = this.reflector.getAllAndOverride<OrgRole[]>(ORG_ROLES_KEY, [handler, cls]);
    const requireVerified = this.reflector.getAllAndOverride<boolean>(REQUIRE_VERIFIED_ORG_KEY, [handler, cls]);

    if (!requiredRoles?.length && !requiredOrgRoles?.length && !requireVerified) return true;

    const req = context.switchToHttp().getRequest<AuthRequest>();
    const user = req.user;
    if (!user) throw new UnauthenticatedError();

    if (requiredRoles?.length && !requiredRoles.includes(user.role)) {
      throw new ForbiddenError("Your account type cannot perform this action");
    }

    const isPlatformAdmin = user.role === Role.ADMIN;

    if (requiredOrgRoles?.length) {
      if (isPlatformAdmin) return true;

      if (!user.activeOrg) {
        throw new ForbiddenError(
          "Select an organisation for this request (X-Org-Id header)",
          ErrorCode.INSUFFICIENT_ORG_ROLE
        );
      }
      if (!requiredOrgRoles.includes(user.activeOrg.orgRole)) {
        throw new ForbiddenError(
          `This action requires one of these roles in your organisation: ${requiredOrgRoles.join(", ")}`,
          ErrorCode.INSUFFICIENT_ORG_ROLE
        );
      }
    }

    if (requireVerified && !isPlatformAdmin) {
      const org = user.activeOrg;
      if (!org) {
        throw new ForbiddenError("Select an organisation for this request", ErrorCode.ORG_NOT_VERIFIED);
      }
      if (org.verificationStatus !== VerificationStatus.VERIFIED) {
        throw new ForbiddenError(
          this.verificationMessage(org.verificationStatus),
          ErrorCode.ORG_NOT_VERIFIED
        );
      }
    }

    return true;
  }

  private verificationMessage(status: VerificationStatus): string {
    switch (status) {
      case VerificationStatus.PENDING:
        return "Your organisation's verification is still under review. Trading unlocks once it is approved.";
      case VerificationStatus.REJECTED:
        return "Your organisation's verification was rejected. Please review the feedback and resubmit.";
      case VerificationStatus.SUSPENDED:
        return "Your organisation has been suspended. Contact support.";
      default:
        return "Complete your organisation's verification before trading.";
    }
  }
}
