import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { VerificationStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { ErrorCode, ForbiddenError, UnauthenticatedError } from "../common/errors";
import { PUBLIC_KEY } from "./decorators";
import type { AuthRequest, RequestOrg } from "./request.types";
import { TokenService } from "./token.service";

/**
 * Authenticates a request from its bearer token.
 *
 * The user *and their session* are re-read from the database on every
 * request. This costs one indexed query but means deactivation, role
 * changes, and session revocation take effect immediately rather than at
 * token expiry — essential when suspending a bad actor mid-trade.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly tokens: TokenService,
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<AuthRequest>();
    const token = this.extractToken(req);
    if (!token) throw new UnauthenticatedError("Missing bearer token");

    let claims;
    try {
      claims = await this.tokens.verifyAccessToken(token);
    } catch {
      throw new UnauthenticatedError("Invalid or expired token", ErrorCode.TOKEN_EXPIRED);
    }

    const [user, session] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: claims.sub },
        include: {
          memberships: {
            where: { acceptedAt: { not: null } },
            include: { org: { select: { id: true, verificationStatus: true, isActive: true } } },
          },
        },
      }),
      this.prisma.session.findUnique({
        where: { id: claims.sid },
        select: { id: true, revokedAt: true, expiresAt: true, userId: true },
      }),
    ]);

    if (!user) throw new UnauthenticatedError("Account not found");
    if (!user.isActive) throw new ForbiddenError("This account has been deactivated", ErrorCode.ACCOUNT_INACTIVE);

    // The session must still be live: this is what makes revocation instant.
    if (!session || session.userId !== user.id) throw new UnauthenticatedError("Session not found");
    if (session.revokedAt) throw new UnauthenticatedError("Session has been revoked", ErrorCode.TOKEN_EXPIRED);
    if (session.expiresAt < new Date()) throw new UnauthenticatedError("Session has expired", ErrorCode.TOKEN_EXPIRED);

    const organizations: RequestOrg[] = user.memberships
      .filter((m) => m.org.isActive)
      .map((m) => ({
        orgId: m.org.id,
        orgRole: m.role,
        verificationStatus: m.org.verificationStatus,
      }));

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      sessionId: session.id,
      organizations,
      activeOrg: this.resolveActiveOrg(req, organizations),
    };

    return true;
  }

  /**
   * Determines which organisation the request acts for. A user may belong to
   * several (e.g. a group operating multiple depots); the client selects one
   * with X-Org-Id. Membership is always re-checked here — the header alone
   * grants nothing.
   */
  private resolveActiveOrg(req: AuthRequest, orgs: RequestOrg[]): RequestOrg | null {
    const requested = req.headers["x-org-id"];
    const requestedId = Array.isArray(requested) ? requested[0] : requested;

    if (requestedId) {
      const match = orgs.find((o) => o.orgId === requestedId);
      if (!match) {
        throw new ForbiddenError("You are not a member of the requested organisation");
      }
      return match;
    }

    return orgs.length === 1 ? orgs[0] : null;
  }

  private extractToken(req: AuthRequest): string | null {
    const header = req.headers.authorization;
    if (typeof header !== "string") return null;
    const [scheme, value] = header.split(" ");
    if (!/^Bearer$/i.test(scheme ?? "") || !value) return null;
    return value.trim() || null;
  }
}

/** Convenience predicate used by services that need the same rule. */
export function isOrgVerified(org: { verificationStatus: VerificationStatus }): boolean {
  return org.verificationStatus === VerificationStatus.VERIFIED;
}
