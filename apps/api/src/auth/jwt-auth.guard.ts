import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import { AuthRequest, RequestUser } from "./request.types";

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

/**
 * Bearer-token authentication. The token is verified and the user is
 * re-fetched from Postgres on every request, so deactivated accounts and
 * role changes take effect immediately (not at token expiry).
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const header = request.headers.authorization;
    const token =
      typeof header === "string" && header.startsWith("Bearer ")
        ? header.slice("Bearer ".length).trim()
        : null;
    if (!token) {
      throw new UnauthorizedException("Missing bearer token");
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException("Invalid or expired token");
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException("Account not found or deactivated");
    }

    const reqUser: RequestUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };
    request.user = reqUser;
    return true;
  }
}
