import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Response } from "express";
import { env } from "../config/env";
import { zodPipe } from "../common/zod-validation.pipe";
import { UnauthenticatedError } from "../common/errors";
import { AuthService, AuthResult } from "./auth.service";
import {
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
  changePasswordSchema,
  loginSchema,
  registerSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
} from "./dto";
import { CurrentUser, Public, ReqContext } from "./decorators";
import { JwtAuthGuard } from "./jwt-auth.guard";
import type { AuthRequest, RequestUser } from "./request.types";

const REFRESH_COOKIE = "fl_refresh";

/**
 * Auth endpoints.
 *
 * The refresh token is delivered as an httpOnly, SameSite=Strict cookie so it
 * is unreadable by JavaScript (XSS cannot exfiltrate it) and is not sent on
 * cross-site requests (CSRF is mitigated). The access token is returned in
 * the body for the client to hold in memory only.
 */
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post("register")
  @Throttle({ default: { limit: 5 * env.RATE_LIMIT_FACTOR, ttl: 3600_000 } }) // 5 signups/hour/IP
  async register(
    @Body(zodPipe(registerSchema)) body: RegisterInput,
    @ReqContext() ctx: { ip: string | null; userAgent: string | null },
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.auth.register(body, ctx);
    return this.respond(result, res);
  }

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10 * env.RATE_LIMIT_FACTOR, ttl: 900_000 } }) // 10 attempts/15min/IP
  async login(
    @Body(zodPipe(loginSchema)) body: LoginInput,
    @ReqContext() ctx: { ip: string | null; userAgent: string | null },
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.auth.login(body, ctx);
    return this.respond(result, res);
  }

  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 60 * env.RATE_LIMIT_FACTOR, ttl: 900_000 } })
  async refresh(
    @Req() req: AuthRequest,
    @ReqContext() ctx: { ip: string | null; userAgent: string | null },
    @Res({ passthrough: true }) res: Response
  ) {
    const token = this.readRefreshCookie(req);
    if (!token) throw new UnauthenticatedError("No refresh token supplied");
    const result = await this.auth.refresh(token, ctx);
    return this.respond(result, res);
  }

  @UseGuards(JwtAuthGuard)
  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() req: AuthRequest,
    @CurrentUser() user: RequestUser,
    @ReqContext() ctx: { ip: string | null; userAgent: string | null },
    @Res({ passthrough: true }) res: Response
  ): Promise<void> {
    await this.auth.logout(this.readRefreshCookie(req), user.id, ctx, user.sessionId);
    res.clearCookie(REFRESH_COOKIE, this.cookieOptions(0));
  }

  @UseGuards(JwtAuthGuard)
  @Post("logout-all")
  @HttpCode(HttpStatus.NO_CONTENT)
  async logoutAll(
    @CurrentUser() user: RequestUser,
    @Res({ passthrough: true }) res: Response
  ): Promise<void> {
    await this.auth.revokeAllSessions(user.id, "user_requested");
    res.clearCookie(REFRESH_COOKIE, this.cookieOptions(0));
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  async me(@CurrentUser() user: RequestUser) {
    return { user: await this.auth.getAuthenticatedUser(user.id) };
  }

  @UseGuards(JwtAuthGuard)
  @Post("change-password")
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(
    @CurrentUser() user: RequestUser,
    @Body(zodPipe(changePasswordSchema)) body: ChangePasswordInput,
    @ReqContext() ctx: { ip: string | null; userAgent: string | null },
    @Res({ passthrough: true }) res: Response
  ): Promise<void> {
    await this.auth.changePassword(user.id, body, ctx);
    res.clearCookie(REFRESH_COOKIE, this.cookieOptions(0));
  }

  @Public()
  @Post("forgot-password")
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 5 * env.RATE_LIMIT_FACTOR, ttl: 3600_000 } })
  async forgotPassword(
    @Body(zodPipe(requestPasswordResetSchema)) body: { email: string },
    @ReqContext() ctx: { ip: string | null; userAgent: string | null }
  ) {
    const issued = await this.auth.requestPasswordReset(body.email, ctx);

    // TODO(notifications): email `issued.token` as a reset link. Until the
    // mailer is wired the token is only returned outside production, so the
    // flow is testable without silently leaking reset tokens in production.
    const devToken = env.NODE_ENV !== "production" && issued ? { devResetToken: issued.token } : {};

    // Identical response whether or not the account exists.
    return {
      message: "If an account exists for that email, a reset link has been sent.",
      ...devToken,
    };
  }

  @Public()
  @Post("reset-password")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 10 * env.RATE_LIMIT_FACTOR, ttl: 3600_000 } })
  async resetPassword(
    @Body(zodPipe(resetPasswordSchema)) body: { token: string; newPassword: string },
    @ReqContext() ctx: { ip: string | null; userAgent: string | null }
  ): Promise<void> {
    await this.auth.resetPassword(body.token, body.newPassword, ctx);
  }

  // ---------------------------------------------------------------------

  private respond(result: AuthResult, res: Response) {
    res.cookie(REFRESH_COOKIE, result.refreshToken, this.cookieOptions(env.REFRESH_TOKEN_TTL_DAYS * 86_400_000));
    return {
      user: result.user,
      accessToken: result.accessToken,
      expiresIn: result.expiresInSeconds,
    };
  }

  private readRefreshCookie(req: AuthRequest): string | undefined {
    const cookies = (req as AuthRequest & { cookies?: Record<string, string> }).cookies;
    return cookies?.[REFRESH_COOKIE];
  }

  private cookieOptions(maxAgeMs: number) {
    return {
      httpOnly: true,
      secure: env.COOKIE_SECURE,
      sameSite: "strict" as const,
      domain: env.COOKIE_DOMAIN,
      path: "/api/v1/auth",
      maxAge: maxAgeMs,
    };
  }
}
