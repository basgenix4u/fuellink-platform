import { Injectable, Logger } from "@nestjs/common";
import { OrgRole, Prisma, Role, VerificationStatus } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { env } from "../config/env";
import {
  ConflictError,
  ErrorCode,
  ForbiddenError,
  NotFoundError,
  UnauthenticatedError,
  ValidationError,
} from "../common/errors";
import { PasswordService } from "./password.service";
import { TokenService } from "./token.service";
import { ChangePasswordInput, LoginInput, RegisterInput, orgTypeForRole } from "./dto";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: Role;
  emailVerified: boolean;
  organizations: {
    orgId: string;
    orgName: string;
    orgSlug: string;
    orgRole: OrgRole;
    verificationStatus: VerificationStatus;
  }[];
}

export interface AuthResult {
  user: AuthenticatedUser;
  accessToken: string;
  /** Returned to the controller, which sets it as an httpOnly cookie. */
  refreshToken: string;
  expiresInSeconds: number;
}

export interface RequestContext {
  ip?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
    private readonly audit: AuditService
  ) {}

  // -------------------------------------------------------------------------
  // Registration
  // -------------------------------------------------------------------------

  /**
   * Creates the user, their organisation, and the OWNER membership in one
   * transaction — a user without an organisation cannot trade, so a partial
   * write here would strand the account.
   */
  async register(input: RegisterInput, ctx: RequestContext): Promise<AuthResult> {
    // Validate the password before the expensive uniqueness checks.
    this.passwords.assertStrong(input.password);

    const passwordHash = await this.passwords.hash(input.password);

    const created = await this.prisma.$transaction(async (tx) => {
      const [emailTaken, phoneTaken] = await Promise.all([
        tx.user.findUnique({ where: { email: input.email }, select: { id: true } }),
        tx.user.findUnique({ where: { phone: input.phone }, select: { id: true } }),
      ]);
      if (emailTaken) throw new ConflictError("An account with this email already exists", ErrorCode.DUPLICATE_RESOURCE);
      if (phoneTaken) throw new ConflictError("An account with this phone number already exists", ErrorCode.DUPLICATE_RESOURCE);

      const user = await tx.user.create({
        data: {
          email: input.email,
          phone: input.phone,
          passwordHash,
          name: input.name,
          role: input.role,
        },
      });

      const org = await tx.organization.create({
        data: {
          name: input.organizationName,
          slug: await this.uniqueOrgSlug(tx, input.organizationName),
          type: orgTypeForRole(input.role),
          rcNumber: input.rcNumber ?? null,
          state: input.state ?? null,
          email: input.email,
          phone: input.phone,
          // Trading is gated until an admin verifies the documents.
          verificationStatus: VerificationStatus.UNVERIFIED,
        },
      });

      await tx.orgMember.create({
        data: { orgId: org.id, userId: user.id, role: OrgRole.OWNER, acceptedAt: new Date() },
      });

      await this.audit.record(
        {
          action: "auth.registered",
          entityType: "User",
          entityId: user.id,
          actorUserId: user.id,
          actorOrgId: org.id,
          changes: { email: user.email, role: user.role, organization: org.name },
          ip: ctx.ip,
          userAgent: ctx.userAgent,
        },
        tx
      );

      return { user, org };
    });

    const session = await this.createSession(created.user.id, ctx);
    return this.buildAuthResult(created.user.id, session);
  }

  // -------------------------------------------------------------------------
  // Login
  // -------------------------------------------------------------------------

  async login(input: LoginInput, ctx: RequestContext): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });

    // Always spend time hashing, even for an unknown email, so response
    // timing cannot be used to enumerate registered accounts.
    if (!user) {
      await this.passwords.verify(
        "$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHR2YWx1ZQ$0000000000000000000000000000000000000000000",
        input.password
      );
      throw new UnauthenticatedError("Invalid email or password", ErrorCode.INVALID_CREDENTIALS);
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60_000);
      throw new UnauthenticatedError(
        `Account temporarily locked after too many failed attempts. Try again in ${minutes} minute(s).`,
        ErrorCode.ACCOUNT_LOCKED
      );
    }

    const valid = await this.passwords.verify(user.passwordHash, input.password);

    if (!valid) {
      await this.registerFailedLogin(user.id, user.failedLoginCount, ctx);
      throw new UnauthenticatedError("Invalid email or password", ErrorCode.INVALID_CREDENTIALS);
    }

    if (!user.isActive) {
      throw new ForbiddenError("This account has been deactivated. Contact support.", ErrorCode.ACCOUNT_INACTIVE);
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    await this.audit.record({
      action: "auth.login",
      entityType: "User",
      entityId: user.id,
      actorUserId: user.id,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    const session = await this.createSession(user.id, ctx);
    return this.buildAuthResult(user.id, session);
  }

  private async registerFailedLogin(userId: string, current: number, ctx: RequestContext): Promise<void> {
    const next = current + 1;
    const shouldLock = next >= env.MAX_FAILED_LOGINS;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginCount: next,
        lockedUntil: shouldLock ? new Date(Date.now() + env.LOCKOUT_MINUTES * 60_000) : null,
      },
    });

    if (shouldLock) {
      this.logger.warn({ userId, attempts: next, ip: ctx.ip }, "Account locked after repeated failed logins");
      await this.audit.record({
        action: "auth.account_locked",
        entityType: "User",
        entityId: userId,
        actorUserId: userId,
        changes: { failedAttempts: next },
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
    }
  }

  // -------------------------------------------------------------------------
  // Refresh with rotation + theft detection
  // -------------------------------------------------------------------------

  /**
   * Rotates a refresh token.
   *
   * Each refresh issues a new token and marks the old one as rotated. If a
   * token that has *already* been rotated is presented again, it has been
   * stolen (or cloned), so the entire session family is revoked immediately.
   */
  async refresh(rawToken: string, ctx: RequestContext): Promise<AuthResult> {
    const hash = this.tokens.hashRefreshToken(rawToken);
    const session = await this.prisma.session.findUnique({
      where: { refreshTokenHash: hash },
      include: { user: true },
    });

    if (!session) throw new UnauthenticatedError("Invalid refresh token", ErrorCode.TOKEN_EXPIRED);

    if (session.rotatedToId) {
      // Reuse of a rotated token: treat as compromise.
      this.logger.warn({ userId: session.userId, sessionId: session.id }, "Refresh token reuse detected");
      await this.revokeAllSessions(session.userId, "refresh_token_reuse");
      await this.audit.record({
        action: "auth.token_reuse_detected",
        entityType: "User",
        entityId: session.userId,
        actorUserId: session.userId,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
      throw new UnauthenticatedError(
        "Session invalidated for security reasons. Please sign in again.",
        ErrorCode.TOKEN_EXPIRED
      );
    }

    if (session.revokedAt) throw new UnauthenticatedError("Session has been revoked", ErrorCode.TOKEN_EXPIRED);
    if (session.expiresAt < new Date()) throw new UnauthenticatedError("Session has expired", ErrorCode.TOKEN_EXPIRED);
    if (!session.user.isActive) {
      throw new ForbiddenError("This account has been deactivated", ErrorCode.ACCOUNT_INACTIVE);
    }

    const next = this.tokens.generateRefreshToken();
    const newSession = await this.prisma.$transaction(async (tx) => {
      const created = await tx.session.create({
        data: {
          userId: session.userId,
          refreshTokenHash: next.hash,
          userAgent: ctx.userAgent ?? null,
          ip: ctx.ip ?? null,
          expiresAt: this.tokens.refreshExpiryDate(),
        },
      });
      await tx.session.update({
        where: { id: session.id },
        data: { rotatedToId: created.id, revokedAt: new Date() },
      });
      return created;
    });

    return this.buildAuthResult(session.userId, { id: newSession.id, rawToken: next.token });
  }

  // -------------------------------------------------------------------------
  // Logout / revocation
  // -------------------------------------------------------------------------

  /**
   * Ends the current session.
   *
   * Revocation is keyed on the session id carried in the access token, so it
   * works even when the refresh cookie is absent (different client, cookie
   * already cleared, or a stolen access token being disposed of). The refresh
   * token, when supplied, is revoked as well — it may belong to a session
   * that was rotated since this access token was issued.
   */
  async logout(
    rawToken: string | undefined,
    userId: string,
    ctx: RequestContext,
    sessionId?: string
  ): Promise<void> {
    const orConditions: Prisma.SessionWhereInput[] = [];
    if (sessionId) orConditions.push({ id: sessionId });
    if (rawToken) orConditions.push({ refreshTokenHash: this.tokens.hashRefreshToken(rawToken) });

    if (orConditions.length > 0) {
      await this.prisma.session.updateMany({
        where: { userId, revokedAt: null, OR: orConditions },
        data: { revokedAt: new Date() },
      });
    }
    await this.audit.record({
      action: "auth.logout",
      entityType: "User",
      entityId: userId,
      actorUserId: userId,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
  }

  async revokeAllSessions(userId: string, reason: string): Promise<number> {
    const { count } = await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    this.logger.log({ userId, count, reason }, "Revoked all sessions");
    return count;
  }

  // -------------------------------------------------------------------------
  // Password management
  // -------------------------------------------------------------------------

  async changePassword(userId: string, input: ChangePasswordInput, ctx: RequestContext): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError("User");

    const ok = await this.passwords.verify(user.passwordHash, input.currentPassword);
    if (!ok) throw new UnauthenticatedError("Current password is incorrect", ErrorCode.INVALID_CREDENTIALS);

    if (input.currentPassword === input.newPassword) {
      throw new ValidationError("New password must differ from the current password");
    }

    const passwordHash = await this.passwords.hash(input.newPassword);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });

    // A password change invalidates every existing session.
    await this.revokeAllSessions(userId, "password_changed");

    await this.audit.record({
      action: "auth.password_changed",
      entityType: "User",
      entityId: userId,
      actorUserId: userId,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
  }

  /**
   * Issues a password-reset token.
   *
   * Always resolves successfully, whether or not the email exists — the
   * response must not reveal which addresses are registered. The caller is
   * responsible for emailing `token` when one is returned.
   */
  async requestPasswordReset(email: string, ctx: RequestContext): Promise<{ token: string; userId: string } | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) return null;

    const raw = randomBytes(32).toString("base64url");
    const tokenHash = this.tokens.hashRefreshToken(raw);

    await this.prisma.verificationToken.create({
      data: {
        userId: user.id,
        email: user.email,
        tokenHash,
        purpose: "PASSWORD_RESET",
        expiresAt: new Date(Date.now() + 60 * 60_000), // 1 hour
      },
    });

    await this.audit.record({
      action: "auth.password_reset_requested",
      entityType: "User",
      entityId: user.id,
      actorUserId: user.id,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    return { token: raw, userId: user.id };
  }

  async resetPassword(rawToken: string, newPassword: string, ctx: RequestContext): Promise<void> {
    const tokenHash = this.tokens.hashRefreshToken(rawToken);
    const record = await this.prisma.verificationToken.findUnique({ where: { tokenHash } });

    if (!record || record.purpose !== "PASSWORD_RESET") {
      throw new UnauthenticatedError("Invalid or expired reset link", ErrorCode.TOKEN_EXPIRED);
    }
    if (record.usedAt) throw new UnauthenticatedError("This reset link has already been used", ErrorCode.TOKEN_EXPIRED);
    if (record.expiresAt < new Date()) throw new UnauthenticatedError("This reset link has expired", ErrorCode.TOKEN_EXPIRED);
    if (!record.userId) throw new UnauthenticatedError("Invalid reset link", ErrorCode.TOKEN_EXPIRED);

    const passwordHash = await this.passwords.hash(newPassword);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: record.userId as string },
        data: { passwordHash, failedLoginCount: 0, lockedUntil: null },
      });
      await tx.verificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
      await tx.session.updateMany({
        where: { userId: record.userId as string, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });

    await this.audit.record({
      action: "auth.password_reset",
      entityType: "User",
      entityId: record.userId,
      actorUserId: record.userId,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  async getAuthenticatedUser(userId: string): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          where: { acceptedAt: { not: null } },
          include: { org: { select: { id: true, name: true, slug: true, verificationStatus: true } } },
        },
      },
    });
    if (!user) throw new NotFoundError("User");

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      emailVerified: user.emailVerifiedAt !== null,
      organizations: user.memberships.map((m) => ({
        orgId: m.org.id,
        orgName: m.org.name,
        orgSlug: m.org.slug,
        orgRole: m.role,
        verificationStatus: m.org.verificationStatus,
      })),
    };
  }

  private async createSession(userId: string, ctx: RequestContext): Promise<{ id: string; rawToken: string }> {
    const { token, hash } = this.tokens.generateRefreshToken();
    const session = await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash: hash,
        userAgent: ctx.userAgent ?? null,
        ip: ctx.ip ?? null,
        expiresAt: this.tokens.refreshExpiryDate(),
      },
    });
    return { id: session.id, rawToken: token };
  }

  private async buildAuthResult(
    userId: string,
    session: { id: string; rawToken: string }
  ): Promise<AuthResult> {
    const user = await this.getAuthenticatedUser(userId);
    const accessToken = await this.tokens.signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      sid: session.id,
    });

    return {
      user,
      accessToken,
      refreshToken: session.rawToken,
      expiresInSeconds: this.parseTtlSeconds(env.ACCESS_TOKEN_TTL),
    };
  }

  private parseTtlSeconds(ttl: string): number {
    const match = /^(\d+)([smhd])$/.exec(ttl);
    if (!match) return 900;
    const value = Number(match[1]);
    const unit = match[2];
    const multiplier = unit === "s" ? 1 : unit === "m" ? 60 : unit === "h" ? 3600 : 86400;
    return value * multiplier;
  }

  private async uniqueOrgSlug(tx: Prisma.TransactionClient, name: string): Promise<string> {
    const base =
      name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60) || "org";

    for (let attempt = 0; attempt < 50; attempt++) {
      const slug = attempt === 0 ? base : `${base}-${attempt + 1}`;
      const existing = await tx.organization.findUnique({ where: { slug }, select: { id: true } });
      if (!existing) return slug;
    }
    // Fall back to a random suffix rather than looping forever.
    return `${base}-${randomBytes(4).toString("hex")}`;
  }
}
