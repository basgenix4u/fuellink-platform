import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { SignOptions } from "jsonwebtoken";
import type { Role } from "@prisma/client";
import { env } from "../config/env";

export interface AccessTokenClaims {
  sub: string;
  email: string;
  role: Role;
  /** Session id, so an access token can be tied to a revocable session. */
  sid: string;
}

/**
 * Token handling.
 *
 * Access tokens are short-lived JWTs (default 15m) carrying identity claims.
 * Refresh tokens are opaque 256-bit random strings — never JWTs — stored only
 * as SHA-256 hashes, so a database leak cannot be replayed against the API.
 */
@Injectable()
export class TokenService {
  constructor(private readonly jwt: JwtService) {}

  async signAccessToken(claims: AccessTokenClaims): Promise<string> {
    return this.jwt.signAsync(claims, {
      secret: env.JWT_ACCESS_SECRET,
      // env values are free-form strings; ms-format values ("15m", "1h") are
      // documented in .env.example and validated at boot.
      expiresIn: env.ACCESS_TOKEN_TTL as SignOptions["expiresIn"],
    });
  }

  async verifyAccessToken(token: string): Promise<AccessTokenClaims> {
    return this.jwt.verifyAsync<AccessTokenClaims>(token, { secret: env.JWT_ACCESS_SECRET });
  }

  /** Returns the raw token (sent to the client) and its hash (stored). */
  generateRefreshToken(): { token: string; hash: string } {
    const token = randomBytes(32).toString("base64url");
    return { token, hash: this.hashRefreshToken(token) };
  }

  hashRefreshToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  /** Constant-time comparison, to avoid leaking information via timing. */
  safeEquals(a: string, b: string): boolean {
    const bufA = Buffer.from(a, "utf8");
    const bufB = Buffer.from(b, "utf8");
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  }

  refreshExpiryDate(): Date {
    return new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 3600_000);
  }
}
